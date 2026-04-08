import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { MetricsData } from "@/lib/types";
import { RANKING_PAGES, getRanking, type RankingSlug } from "@/lib/rankings";
import { fmtEur, fmtEurSqm, fmtPct, fmtNum } from "@/lib/utils";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import RankingTable, { type RankingRow } from "@/components/RankingTable";
import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";

export const revalidate = 3600;

/* ── Static params ───────────────────────────────────────────── */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    RANKING_PAGES.map((slug) => ({ locale, slug }))
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
async function getMetrics(): Promise<MetricsData | null> {
  try {
    const raw = await readFile(
      join(process.cwd(), "public", "metrics.json"),
      "utf-8"
    );
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

/** Map ranking slug → i18n key prefix for title/description/labels */
const CONFIG: Record<
  RankingSlug,
  {
    valueLabel: "eur_sqm" | "eur" | "pct" | "days" | "yield";
    extraLabel?: "eur" | "eur_sqm" | "avg_drop" | "listings" | "rent";
  }
> = {
  "barrios-mas-baratos": { valueLabel: "eur_sqm", extraLabel: "eur" },
  "barrios-mas-caros": { valueLabel: "eur_sqm", extraLabel: "eur" },
  "barrios-mayor-rentabilidad": { valueLabel: "yield", extraLabel: "rent" },
  "barrios-bajan-precio": { valueLabel: "pct", extraLabel: "avg_drop" },
  "barrios-mas-rapidos": { valueLabel: "days", extraLabel: "listings" },
  "pisos-menos-200000": { valueLabel: "eur", extraLabel: "eur_sqm" },
  "pisos-menos-300000": { valueLabel: "eur", extraLabel: "eur_sqm" },
  "pisos-menos-3000-m2": { valueLabel: "eur_sqm", extraLabel: "eur" },
};

function formatValue(
  type: string,
  n: number,
  locale: string
): string {
  switch (type) {
    case "eur_sqm": return fmtEurSqm(n, locale);
    case "eur": return fmtEur(n, locale);
    case "pct": return fmtPct(n, 1, locale);
    case "yield": return fmtPct(n, 2, locale);
    case "days": return `${fmtNum(n, locale)} d`;
    case "listings": return fmtNum(n, locale);
    case "rent": return `${fmtEur(n, locale)}/mes`;
    case "avg_drop": return fmtPct(n, 1, locale);
    default: return String(n);
  }
}

/* ── Metadata ────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const slug = params.slug as RankingSlug;
  if (!RANKING_PAGES.includes(slug)) return {};

  const t = await getTranslations({
    locale: params.locale,
    namespace: "rankings",
  });

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = now
    .toLocaleString(params.locale === "en" ? "en-GB" : "es-ES", {
      month: "long",
    });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);

  const title = t(`${slug}_title`, { year, month: monthCap });
  const description = t(`${slug}_desc`, { year, month: monthCap });

  const BASE = "https://madridhome.tech";
  const canonical = `${BASE}/${params.locale}/rankings/${slug}`;
  const alternates = Object.fromEntries(
    locales.map((l) => [l, `${BASE}/${l}/rankings/${slug}`])
  );

  return {
    title,
    description,
    alternates: { canonical, languages: alternates },
    openGraph: { title, description, url: canonical },
  };
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function RankingPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const slug = params.slug as RankingSlug;
  if (!RANKING_PAGES.includes(slug)) notFound();

  const data = await getMetrics();
  if (!data) notFound();

  const t = await getTranslations({
    locale: params.locale,
    namespace: "rankings",
  });

  const config = CONFIG[slug];
  const ranked = getRanking(slug, data);

  if (ranked.length === 0) notFound();

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = now
    .toLocaleString(params.locale === "en" ? "en-GB" : "es-ES", {
      month: "long",
    });
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);

  const rows: RankingRow[] = ranked.map((r, i) => ({
    barrio: r.barrio,
    distrito: r.distrito,
    value: formatValue(config.valueLabel, r.value, params.locale),
    extra: r.extra != null && config.extraLabel
      ? formatValue(config.extraLabel, r.extra, params.locale)
      : undefined,
    badge:
      i < 3
        ? {
            text: i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉",
            color: "bg-slate-700/50",
          }
        : undefined,
  }));

  const breadcrumbs = [
    {
      label: params.locale === "en" ? "Home" : "Inicio",
      href: `/${params.locale}`,
    },
    {
      label: "Rankings",
      href: `/${params.locale}/rankings/${slug}`,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Breadcrumb items={breadcrumbs} />

        <h1 className="text-2xl sm:text-3xl font-bold mt-4 mb-2">
          {t(`${slug}_title`, { year, month: monthCap })}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {t(`${slug}_desc`, { year, month: monthCap })}
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
          <RankingTable
            rows={rows}
            valueLabel={t(`col_${config.valueLabel}`)}
            extraLabel={
              config.extraLabel ? t(`col_${config.extraLabel}`) : undefined
            }
            locale={params.locale}
          />
        </div>

        <p className="text-slate-500 text-xs mt-4">
          {t("data_source")}
        </p>

        {/* Internal links to other rankings for SEO interlinking */}
        <nav className="mt-10">
          <h2 className="text-lg font-semibold mb-3 text-slate-300">
            {t("other_rankings")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {RANKING_PAGES.filter((s) => s !== slug).map((s) => (
              <Link
                key={s}
                href={`/rankings/${s}`}
                locale={params.locale}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                {t(`${s}_short`)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
