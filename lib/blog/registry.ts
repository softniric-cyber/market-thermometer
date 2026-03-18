import { promises as fsp } from "fs";
import { join } from "path";
import type { MetricsData } from "@/lib/types";
import type { BlogPostMeta, BlogPostFull } from "./types";
import { AUTO_GENERATORS } from "./generators";
import { discoverMdxPosts, getMdxPost, discoverMdxSlugsSync } from "./mdx";

// ── Load metrics ─────────────────────────────────────────────
async function getMetrics(): Promise<MetricsData | null> {
  try {
    const raw = await fsp.readFile(
      join(process.cwd(), "public", "metrics.json"),
      "utf-8"
    );
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

// ── Known auto-generated slugs (static, no I/O) ─────────────
const AUTO_SLUGS = [
  "informe-mercado-madrid",
  "ranking-distritos-caros",
  "ranking-distritos-baratos",
  "ranking-rentabilidad-alquiler",
];

// ── All slugs — sync version for sitemap ─────────────────────
export function getAllBlogSlugsSync(): string[] {
  const mdxSlugs = discoverMdxSlugsSync();
  return [...AUTO_SLUGS, ...mdxSlugs];
}

// ── All slugs (for generateStaticParams) ─────────────────────
export async function getAllBlogSlugs(): Promise<string[]> {
  const data = await getMetrics();
  const autoSlugs = data
    ? AUTO_GENERATORS.map((gen) => gen(data).slug)
    : AUTO_SLUGS;
  const mdxPosts = await discoverMdxPosts();
  return [...autoSlugs, ...mdxPosts.map((p) => p.slug)];
}

// ── All post metadata (for blog index) ───────────────────────
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const data = await getMetrics();
  const autoPosts: BlogPostMeta[] = data
    ? AUTO_GENERATORS.map((gen) => {
        const { html: _html, ...meta } = gen(data);
        return meta;
      })
    : [];
  const mdxPosts = await discoverMdxPosts();

  return [...autoPosts, ...mdxPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ── Single post by slug (for post detail page) ───────────────
export async function getBlogPost(
  slug: string,
  locale?: string
): Promise<BlogPostFull | null> {
  const data = await getMetrics();

  // Check auto-generated posts first
  if (data) {
    for (const gen of AUTO_GENERATORS) {
      const post = gen(data);
      if (post.slug === slug) return post;
    }
  }

  // Then check MDX (locale-aware)
  return getMdxPost(slug, locale);
}
