import { readFile, readdir } from "fs/promises";
import { readdirSync } from "fs";
import { join } from "path";
import type { BlogPostFull, BlogPostMeta } from "./types";

const CONTENT_DIR = join(process.cwd(), "content", "blog");

// ── Frontmatter parser (no dependencies) ─────────────────────
function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  content: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[key] = val;
    }
  }
  return { meta, content: match[2] };
}

// ── Simple markdown → HTML (handles common patterns) ─────────
function markdownToHtml(md: string): string {
  let html = md;

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 hover:underline">$1</a>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Paragraphs: wrap remaining lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<")) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n\n");

  return html;
}

const KNOWN_LOCALES = ["es", "en"];

// ── Extract base slug and locale from a filename ─────────────
// "post.es.mdx" → { baseSlug: "post", locale: "es" }
// "post.mdx"    → { baseSlug: "post", locale: null }
function parseFilename(filename: string): {
  baseSlug: string;
  locale: string | null;
} {
  const withoutExt = filename.replace(/\.(mdx|md)$/, "");
  const parts = withoutExt.split(".");
  const maybeLoc = parts[parts.length - 1];
  if (KNOWN_LOCALES.includes(maybeLoc)) {
    return {
      baseSlug: parts.slice(0, -1).join("."),
      locale: maybeLoc,
    };
  }
  return { baseSlug: withoutExt, locale: null };
}

// ── Discover MDX slugs — sync version for sitemap ────────────
export function discoverMdxSlugsSync(): string[] {
  try {
    const files = readdirSync(CONTENT_DIR);
    const seen: Record<string, true> = {};
    for (const f of files) {
      if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
      seen[parseFilename(f).baseSlug] = true;
    }
    return Object.keys(seen);
  } catch {
    return [];
  }
}

// ── Discover all MDX posts (locale-aware) ───────────────────
// For posts with locale variants (slug.es.mdx / slug.en.mdx):
//   - Only show the variant that matches `locale`
//   - Fall back to the unlocalized file if no variant exists
// Posts without locale variants always appear.
export async function discoverMdxPosts(
  locale?: string
): Promise<BlogPostMeta[]> {
  try {
    const files = await readdir(CONTENT_DIR);

    // Group files by base slug
    const bySlug: Record<string, { locales: string[]; hasGeneric: boolean }> = {};
    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const { baseSlug, locale: fileLoc } = parseFilename(file);
      if (!bySlug[baseSlug]) bySlug[baseSlug] = { locales: [], hasGeneric: false };
      if (fileLoc) {
        bySlug[baseSlug].locales.push(fileLoc);
      } else {
        bySlug[baseSlug].hasGeneric = true;
      }
    }

    const posts: BlogPostMeta[] = [];

    for (const baseSlug of Object.keys(bySlug)) {
      const { locales, hasGeneric } = bySlug[baseSlug];
      // Decide which file to read for metadata
      let fileToRead: string | null = null;

      if (locales.length > 0) {
        // Has locale variants — only show the one matching current locale
        const matchingLoc = locale && locales.includes(locale) ? locale : locales[0];
        if (locale && !locales.includes(locale) && !hasGeneric) {
          // No matching locale and no generic fallback — skip
          continue;
        }
        if (locale && locales.includes(locale)) {
          fileToRead = `${baseSlug}.${locale}`;
        } else if (hasGeneric) {
          fileToRead = baseSlug;
        } else {
          fileToRead = `${baseSlug}.${matchingLoc}`;
        }
      } else {
        // No locale variants — always show
        fileToRead = baseSlug;
      }

      if (!fileToRead) continue;

      for (const ext of [".mdx", ".md"]) {
        try {
          const raw = await readFile(join(CONTENT_DIR, fileToRead + ext), "utf-8");
          const { meta } = parseFrontmatter(raw);
          posts.push({
            slug: baseSlug,
            title: meta.title || baseSlug,
            description: meta.description || "",
            publishedAt: meta.publishedAt || new Date().toISOString(),
            category: meta.category || "Artículo",
            type: "mdx",
          });
          break;
        } catch {
          continue;
        }
      }
    }

    return posts;
  } catch {
    return [];
  }
}

// ── Load single MDX post ─────────────────────────────────────
// Lookup order: slug.{locale}.mdx → slug.{locale}.md → slug.mdx → slug.md
export async function getMdxPost(
  slug: string,
  locale?: string
): Promise<BlogPostFull | null> {
  const candidates: string[] = [];

  if (locale) {
    candidates.push(`${slug}.${locale}.mdx`, `${slug}.${locale}.md`);
  }
  candidates.push(`${slug}.mdx`, `${slug}.md`);

  for (const filename of candidates) {
    try {
      const raw = await readFile(join(CONTENT_DIR, filename), "utf-8");
      const { meta, content } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        description: meta.description || "",
        publishedAt: meta.publishedAt || new Date().toISOString(),
        category: meta.category || "Artículo",
        type: "mdx",
        html: markdownToHtml(content),
      };
    } catch {
      continue;
    }
  }
  return null;
}
