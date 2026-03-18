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

// ── Discover MDX slugs — sync version for sitemap ────────────
export function discoverMdxSlugsSync(): string[] {
  try {
    const files = readdirSync(CONTENT_DIR);
    return files
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => f.replace(/\.(mdx|md)$/, ""));
  } catch {
    return [];
  }
}

// ── Discover all MDX posts ───────────────────────────────────
export async function discoverMdxPosts(): Promise<BlogPostMeta[]> {
  try {
    const files = await readdir(CONTENT_DIR);
    const posts: BlogPostMeta[] = [];

    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const slug = file.replace(/\.(mdx|md)$/, "");
      try {
        const raw = await readFile(join(CONTENT_DIR, file), "utf-8");
        const { meta } = parseFrontmatter(raw);
        posts.push({
          slug,
          title: meta.title || slug,
          description: meta.description || "",
          publishedAt: meta.publishedAt || new Date().toISOString(),
          category: meta.category || "Artículo",
          type: "mdx",
        });
      } catch {
        // Skip invalid files
      }
    }

    return posts;
  } catch {
    // content/blog/ directory doesn't exist yet
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
