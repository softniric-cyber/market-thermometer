import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/districts";
import { getAllBarrioSlugs } from "@/lib/barrios";
import { getAllBlogSlugsSync } from "@/lib/blog/registry";
import { RANKING_PAGES } from "@/lib/rankings";
import { locales } from "@/i18n/config";

const BASE = "https://madridhome.tech";

/** Build alternates map for a given path (without leading locale). */
function altLangs(path: string) {
  return Object.fromEntries(
    locales.map((l) => [l, `${BASE}/${l}${path}`])
  ) as Record<string, string>;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  /* ── Static pages ─────────────────────────────────────────── */
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${BASE}/${locale}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1,
      alternates: { languages: altLangs("") },
    },
    {
      url: `${BASE}/${locale}/tasar`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages: altLangs("/tasar") },
    },
    {
      url: `${BASE}/${locale}/blog`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: { languages: altLangs("/blog") },
    },
    {
      url: `${BASE}/${locale}/preguntas-frecuentes`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages: altLangs("/preguntas-frecuentes") },
    },
  ]);

  /* ── District pages ───────────────────────────────────────── */
  const districtEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllSlugs().map((slug) => ({
      url: `${BASE}/${locale}/distrito/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: { languages: altLangs(`/distrito/${slug}`) },
    }))
  );

  /* ── Barrio pages ─────────────────────────────────────────── */
  const barrioEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllBarrioSlugs().map((slug) => ({
      url: `${BASE}/${locale}/barrio/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: { languages: altLangs(`/barrio/${slug}`) },
    }))
  );

  /* ── Blog pages ───────────────────────────────────────────── */
  const blogSlugs = getAllBlogSlugsSync();
  const blogEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    blogSlugs.map((slug) => ({
      url: `${BASE}/${locale}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
      alternates: { languages: altLangs(`/blog/${slug}`) },
    }))
  );

  /* ── Ranking pages ─────────────────────────────────────────── */
  const rankingEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    RANKING_PAGES.map((slug) => ({
      url: `${BASE}/${locale}/rankings/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: altLangs(`/rankings/${slug}`) },
    }))
  );

  return [...staticPages, ...districtEntries, ...barrioEntries, ...rankingEntries, ...blogEntries];
}
