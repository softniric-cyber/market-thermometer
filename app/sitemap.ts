import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/districts";
import { getAllBarrioSlugs } from "@/lib/barrios";

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

  return [
    {
      url: "https://madridhome.tech",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...districtEntries,
    ...barrioEntries,
  ];
}
