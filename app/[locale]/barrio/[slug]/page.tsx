import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { MetricsData } from "@/lib/types";
import {
  getAllBarrioSlugs,
  fromBarrioSlug,
  getBarrioMetrics,
  toBarrioSlug,
  getBarriosForDistrict,
} from "@/lib/barrios";
import { toSlug } from "@/lib/districts";
import { fmtEurSqm, fmtNum, fmtDate } from "@/lib/utils";
import { locales } from "@/i18n/config";

import Breadcrumb from "@/components/Breadcrumb";
import BarrioKpiCards from "@/components/BarrioKpiCards";
import OpenDataProfile from "@/components/OpenDataProfile";
import PriceTrendChart from "@/components/PriceTrendChart";
import Footer from "@/components/Footer";
import { getBarrioOpenData, getOpenDataYear } from "@/lib/opendata";

export const revalidate = 3600;

/* ── Static params for all 139 barrios × locales ─────────────────────── */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getAllBarrioSlugs().map((slug) => ({ locale, slug }))
  );
}

/* ── Shared data loader ─────────────────────────────────────── */
async function getMetrics(): Promise<MetricsData | null> {
  try {
    const filePath = join(process.cwd(), "public", "metrics.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

/* ── Dynamic metadata per barrio ────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const match = fromBarrioSlug(params.slug);
  if (!match) return {};

  const { barrio, distrito } = match;
  const data = await getMetrics();
  const barrioData = data?.barrios?.find((b) => b.barrio === barrio);
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });

  const sqmStr = barrioData?.price_per_sqm
    ? fmtEurSqm(barrioData.price_per_sqm, params.locale)
    : "";
  const countStr = barrioData?.active_count
    ? `${fmtNum(barrioData.active_count, params.locale)} ${t("barrio_description", { barrio: "", distrito: "", sqm: "", count: "" }).split(" ").slice(-3).join(" ")}`
    : "";
  const priceStr = barrioData?.median_price
    ? `${(barrioData.median_price / 1000).toFixed(0)}K€`
    : "";

  const descParts = [sqmStr, countStr].filter(Boolean).join(", ");

  return {
    title: t("barrio_title", { barrio, distrito }),
    description: t("barrio_description", { barrio, distrito, sqm: sqmStr, count: (barrioData?.active_count ?? 0).toString() || "0" }),
    alternates: {
      canonical: `/barrio/${params.slug}`,
      languages: locales.reduce(
        (acc, loc) => {
          acc[loc === "en" ? "en-GB" : "es-ES"] = `/es/barrio/${params.slug}`;
          return acc;
        },
        {} as Record<string, string>
      ),
    },
    openGraph: {
      title: `${t("barrio_title", { barrio, distrito })} | madridhome.tech`,
      description: t("barrio_description", { barrio, distrito, sqm: sqmStr, count: (barrioData?.active_count ?? 0).toString() || "0" }),
      url: `https://madridhome.tech/barrio/${params.slug}`,
    },
  };
}

/* ── Page component ─────────────────────────────────────────── */
export default async function BarrioPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "barrio" });
  const tCommon = await getTranslations({ locale: params.locale, namespace: "common" });

  const match = fromBarrioSlug(params.slug);
  if (!match) notFound();

  const { barrio, distrito } = match;
  const data = await getMetrics();
  if (!data) notFound();

  const metrics = getBarrioMetrics(barrio, distrito, data);
  const hasData = metrics.data?.active_count != null && metrics.data.active_count > 0;
  const hasTrend = metrics.trends.length >= 3;
  const openData = await getBarrioOpenData(barrio);
  const openDataYear = await getOpenDataYear();

  // Barrios siblings for the district mini-grid
  const siblingBarrios = getBarriosForDistrict(distrito).filter(
    ([, b]) => b !== barrio
  );
  const distritoSlug = toSlug(distrito);

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: distrito, href: `/distrito/${distritoSlug}` },
          { label: barrio },
        ]}
      />

      {/* Header */}
      <header className="mb-6 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("title", { barrio })} <span className="text-cyan-400">{barrio}</span>
          <span className="text-slate-500 font-normal"> {t("subtitle", { distrito })}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {tCommon("data_updated_on", { date: fmtDate(data.metadata.generated_at, params.locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) })}
          {metrics.data?.price_per_sqm && (
            <>
              {" · "}
              <strong className="text-slate-300">
                {fmtEurSqm(metrics.data.price_per_sqm, params.locale)}
              </strong>
            </>
          )}
          {metrics.data?.active_count != null && (
            <>
              {" · "}
              {fmtNum(metrics.data.active_count, params.locale)} {tCommon("properties_for_sale")}
            </>
          )}
        </p>
      </header>

      {/* KPI Cards — always shown, values show — when no data */}
      <section className="mb-8">
        <BarrioKpiCards metrics={metrics} />
      </section>

      {/* Perfil socioeconómico (datos abiertos) */}
      {openData && (
        <section className="mb-8">
          <OpenDataProfile
            data={openData}
            year={openDataYear}
            scope={barrio}
          />
        </section>
      )}

      {/* Price trend chart */}
      {hasTrend ? (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-sm mb-3">
            {t("price_evolution", { barrio })}
          </h2>
          <PriceTrendChart data={metrics.trends} />
        </section>
      ) : (
        <section className="mb-8 rounded-xl bg-slate-800/40 border border-slate-700/40 px-5 py-4">
          <p className="text-slate-400 text-sm">
            {t("trend_unavailable", { barrio })}
          </p>
        </section>
      )}

      {/* SEO paragraph */}
      <section className="mb-8">
        <h2 className="text-slate-300 font-semibold text-sm mb-2">
          {t("market_title", { barrio })}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("is_barrio_of", { barrio, distrito })}{" "}
          {hasData ? (
            <>
              {t("currently_available", { count: fmtNum(metrics.data!.active_count, params.locale) })}{" "}
              {t("with_median_price")}{" "}
              <strong className="text-slate-200">
                {fmtEurSqm(metrics.data!.price_per_sqm, params.locale)}
              </strong>
              {metrics.data!.avg_days_market != null && (
                <>
                  . {t("avg_days", { days: metrics.data!.avg_days_market.toString() })}
                </>
              )}
              {metrics.data!.gross_yield != null && (
                <>
                  . {t("gross_yield")}{" "}
                  <strong className="text-emerald-400">
                    {metrics.data!.gross_yield.toFixed(1)}%
                  </strong>
                </>
              )}
              .
            </>
          ) : (
            <>
              {t("no_data")}
            </>
          )}
        </p>
      </section>

      {/* Back to district + sibling barrios */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-300 font-semibold text-sm">
            {t("more_barrios", { distrito })}
          </h2>
          <Link
            href={`/distrito/${distritoSlug}`}
            className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
          >
            {t("view_district")}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {siblingBarrios.map(([, b]) => {
            const bData = data.barrios?.find((bd) => bd.barrio === b);
            return (
              <Link
                key={b}
                href={`/barrio/${toBarrioSlug(b)}`}
                className="rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all"
              >
                <p className="text-slate-200 text-xs font-medium truncate">{b}</p>
                {bData?.price_per_sqm && (
                  <p className="text-cyan-400 font-mono text-[10px] mt-0.5">
                    {fmtEurSqm(bData.price_per_sqm)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
