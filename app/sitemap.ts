import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/districts";
import { getAllBarrioSlugs } from "@/lib/barrios";
import { getAllBlogSlugsSync } from "@/lib/blog/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const districtEntries: MetadataRoute.Sitemap = getAllSlugs().map((slug) => ({
    url: `https://madridhome.tech/distrito/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const barrioEntries: MetadataRoute.Sitemap = getAllBarrioSlugs().map((slug) => ({
    url: `https://madridhome.tech/barrio/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const blogSlugs = getAllBlogSlugsSync();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `https://madridhome.tech/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    {
      url: "https://madridhome.tech",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://madridhome.tech/tasar",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://madridhome.tech/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://madridhome.tech/preguntas-frecuentes",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...districtEntries,
    ...barrioEntries,
    ...blogEntries,
  ];
}
