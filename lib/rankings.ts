import type { MetricsData, BarrioData } from "@/lib/types";

/** All ranking page definitions used for routing, sitemap, and rendering. */
export const RANKING_PAGES = [
  "barrios-mas-baratos",
  "barrios-mas-caros",
  "barrios-mayor-rentabilidad",
  "barrios-bajan-precio",
  "barrios-mas-rapidos",
  "pisos-menos-200000",
  "pisos-menos-300000",
  "pisos-menos-3000-m2",
] as const;

export type RankingSlug = (typeof RANKING_PAGES)[number];

export interface RankedBarrio {
  barrio: string;
  distrito: string;
  value: number;
  extra?: number | null;
}

/**
 * Return the ranked barrio list for a given ranking slug.
 * Each ranking applies its own filter + sort on the metrics data.
 */
export function getRanking(
  slug: RankingSlug,
  data: MetricsData
): RankedBarrio[] {
  const barrios = data.barrios.filter(
    (b) => b.price_per_sqm != null && b.price_per_sqm > 0
  );

  switch (slug) {
    case "barrios-mas-baratos":
      return barrios
        .sort((a, b) => (a.price_per_sqm ?? 0) - (b.price_per_sqm ?? 0))
        .slice(0, 30)
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.price_per_sqm!,
          extra: b.median_price,
        }));

    case "barrios-mas-caros":
      return barrios
        .sort((a, b) => (b.price_per_sqm ?? 0) - (a.price_per_sqm ?? 0))
        .slice(0, 30)
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.price_per_sqm!,
          extra: b.median_price,
        }));

    case "barrios-mayor-rentabilidad":
      return barrios
        .filter((b) => b.gross_yield != null && b.gross_yield > 0)
        .sort((a, b) => (b.gross_yield ?? 0) - (a.gross_yield ?? 0))
        .slice(0, 30)
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.gross_yield!,
          extra: b.rent_median,
        }));

    case "barrios-bajan-precio": {
      const dropMap = new Map(
        (data.price_drop_stats?.by_barrio ?? []).map((d) => [d.barrio, d])
      );
      return barrios
        .filter((b) => dropMap.has(b.barrio) && (dropMap.get(b.barrio)!.drop_rate_pct ?? 0) > 0)
        .sort(
          (a, b) =>
            (dropMap.get(b.barrio)!.drop_rate_pct ?? 0) -
            (dropMap.get(a.barrio)!.drop_rate_pct ?? 0)
        )
        .slice(0, 30)
        .map((b) => {
          const d = dropMap.get(b.barrio)!;
          return {
            barrio: b.barrio,
            distrito: b.distrito,
            value: d.drop_rate_pct,
            extra: d.avg_drop_pct,
          };
        });
    }

    case "barrios-mas-rapidos":
      return barrios
        .filter((b) => b.avg_days_market != null && b.avg_days_market > 0)
        .sort(
          (a, b) => (a.avg_days_market ?? 999) - (b.avg_days_market ?? 999)
        )
        .slice(0, 30)
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.avg_days_market!,
          extra: b.active_count,
        }));

    case "pisos-menos-200000":
      return barrios
        .filter((b) => b.median_price != null && b.median_price < 200000 && b.median_price > 0)
        .sort((a, b) => (a.median_price ?? 0) - (b.median_price ?? 0))
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.median_price!,
          extra: b.price_per_sqm,
        }));

    case "pisos-menos-300000":
      return barrios
        .filter((b) => b.median_price != null && b.median_price < 300000 && b.median_price > 0)
        .sort((a, b) => (a.median_price ?? 0) - (b.median_price ?? 0))
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.median_price!,
          extra: b.price_per_sqm,
        }));

    case "pisos-menos-3000-m2":
      return barrios
        .filter((b) => b.price_per_sqm != null && b.price_per_sqm < 3000)
        .sort((a, b) => (a.price_per_sqm ?? 0) - (b.price_per_sqm ?? 0))
        .map((b) => ({
          barrio: b.barrio,
          distrito: b.distrito,
          value: b.price_per_sqm!,
          extra: b.median_price,
        }));

    default:
      return [];
  }
}
