import type { MetricsData, Zone, RentalYield, TrendPoint } from "./types";

/* ── 21 distritos de Madrid ─────────────────────────────────── */
export const DISTRICTS = [
  "Arganzuela",
  "Barajas",
  "Carabanchel",
  "Centro",
  "Chamartín",
  "Chamberí",
  "Ciudad Lineal",
  "Fuencarral-El Pardo",
  "Hortaleza",
  "Latina",
  "Moncloa-Aravaca",
  "Moratalaz",
  "Puente de Vallecas",
  "Retiro",
  "Salamanca",
  "San Blas-Canillejas",
  "Tetuán",
  "Usera",
  "Vicálvaro",
  "Villa de Vallecas",
  "Villaverde",
] as const;

export type DistrictName = (typeof DISTRICTS)[number];

/* ── Slug helpers ───────────────────────────────────────────── */

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/\s+/g, "-");
}

const slugMap = new Map<string, string>(
  DISTRICTS.map((d) => [toSlug(d), d])
);

export function fromSlug(slug: string): string | undefined {
  return slugMap.get(slug);
}

export function getAllSlugs(): string[] {
  return DISTRICTS.map(toSlug);
}

/* ── Datos agregados de un distrito ─────────────────────────── */

export interface NotarialGapEntry {
  distrito: string;
  notarial_year?: number;
  notarial_price?: number;
  idealista_price?: number;
  gap_pct?: number;
}

export interface DistrictMetrics {
  name: string;
  slug: string;
  zone: Zone | null;
  trends: TrendPoint[];
  yields: RentalYield[];
  notarialGap: NotarialGapEntry | null;
  madridAvgSqm: number | null;
}

export function getDistrictMetrics(
  distrito: string,
  data: MetricsData
): DistrictMetrics {
  const zone = data.zones.find((z) => z.name === distrito) ?? null;

  const trends = (data.trends.by_district as Record<string, unknown>[])
    .filter((t) => (t as { distrito?: string }).distrito === distrito)
    .map((t) => ({
      week: t.week as string | undefined,
      week_start: t.week_start as string | undefined,
      avg_sqm: t.avg_sqm as number | undefined,
      n_listings: t.n_listings as number | undefined,
    }));

  const yields = data.rental_yields.filter((y) => y.distrito === distrito);

  const notarialGap =
    (data.notarial_gap as unknown as NotarialGapEntry[]).find(
      (g) => g.distrito === distrito
    ) ?? null;

  // Media Madrid €/m²
  const validSqm = data.zones
    .map((z) => z.price_per_sqm)
    .filter((v): v is number => v != null && v > 0);
  const madridAvgSqm = validSqm.length
    ? Math.round(validSqm.reduce((a, b) => a + b, 0) / validSqm.length)
    : null;

  return {
    name: distrito,
    slug: toSlug(distrito),
    zone,
    trends,
    yields,
    notarialGap,
    madridAvgSqm,
  };
}
