import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { MetricsData } from "@/lib/types";
import {
  DISTRICTS,
  toSlug,
  fromSlug,
  getAllSlugs,
  getDistrictMetrics,
} from "@/lib/districts";
import { getBarriosForDistrict, toBarrioSlug } from "@/lib/barrios";
import { fmtEur, fmtEurSqm, fmtNum, fmtDate, fmtPct } from "@/lib/utils";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

import Breadcrumb from "@/components/Breadcrumb";
import DistrictKpiCards from "@/components/DistrictKpiCards";
import OpenDataProfile from "@/components/OpenDataProfile";
import PriceTrendChart from "@/components/PriceTrendChart";
import DistrictNav from "@/components/DistrictNav";
import PriceDropZones from "@/components/PriceDropZones";
import Footer from "@/components/Footer";
import { getDistrictOpenData, getOpenDataYear } from "@/lib/opendata";

export const revalidate = 3600;

/* ── Static params for all 21 districts ────────────────────── */
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getAllSlugs().map((slug) => ({ locale, slug }))
  );
}

/* ── Dynamic metadata per district ─────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const distrito = fromSlug(params.slug);
  if (!distrito) return {};

  const t = await getTranslations({
    locale: params.locale,
    namespace: "meta",
  });

  const data = await getMetrics();
  const zone = data?.zones.find((z) => z.name === distrito);
  const sqm = zone?.price_per_sqm
    ? `${zone.price_per_sqm.toLocaleString(
        params.locale === "en" ? "en-GB" : "es-ES"
      )} €/m²`
    : "";
  const price = zone?.median_price
    ? `${(zone.median_price / 1000).toFixed(0)}K€`
    : "";
  const count = zone?.active_count ?? 0;

  const title = t("district_title", { name: distrito, sqm });
  const description = t("district_description", {
    name: distrito,
    price,
    sqm,
    count,
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}/distrito/${params.slug}`,
      languages: {
        es: `/es/distrito/${params.slug}`,
        en: `/en/distrito/${params.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://madridhome.tech/${params.locale}/distrito/${params.slug}`,
    },
  };
}

/* ── Data loader ───────────────────────────────────────────── */
async function getMetrics(): Promise<MetricsData | null> {
  try {
    const filePath = join(process.cwd(), "public", "metrics.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

/* ── Page ──────────────────────────────────────────────────── */
export default async function DistrictPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "district",
  });
  const tc = await getTranslations({
    locale: params.locale,
    namespace: "common",
  });
  const tDrops = await getTranslations({
    locale: params.locale,
    namespace: "drops",
  });

  const distrito = fromSlug(params.slug);
  if (!distrito) notFound();

  const data = await getMetrics();
  if (!data) notFound();

  const metrics = getDistrictMetrics(distrito, data);
  const openData = await getDistrictOpenData(distrito);
  const openDataYear = await getOpenDataYear();

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <Breadcrumb district={distrito} slug={params.slug} />

      {/* Header */}
      <header className="mb-8">
        <Link href="/" className="inline-block mb-4">
          <img
            src="/logo.png"
            alt="madridhome.tech"
            className="h-16 w-auto opacity-80 hover:opacity-100 transition-opacity"
          />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("title", { name: distrito })}
          <span className="text-slate-500 font-normal"> — {tc("madrid")}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {tc("data_updated_on", {
            date: fmtDate(data.metadata.generated_at, params.locale),
          })}
          {metrics.zone?.price_per_sqm && (
            <>
              {" · "}
              <strong className="text-slate-300">
                {fmtEurSqm(metrics.zone.price_per_sqm, params.locale)}
              </strong>
            </>
          )}
          {metrics.zone?.active_count && (
            <>
              {" · "}
              {fmtNum(metrics.zone.active_count, params.locale)}{" "}
              {tc("properties_for_sale")}
            </>
          )}
        </p>
      </header>

      {/* KPI Cards */}
      <section className="mb-8">
        <DistrictKpiCards metrics={metrics} />
      </section>

      {/* Perfil socioeconómico (datos abiertos) */}
      {openData && (
        <section className="mb-8">
          <OpenDataProfile
            data={openData}
            year={openDataYear}
            scope={distrito}
          />
        </section>
      )}

      {/* Price Trend Chart */}
      {metrics.trends.length > 0 && (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-sm mb-3">
            {t("price_evolution", { name: distrito })}
          </h2>
          <PriceTrendChart data={metrics.trends} />
        </section>
      )}


      {/* Price Drop Zones (filtered by district) */}
      {data.price_drop_stats?.by_barrio?.filter(b => b.distrito === distrito).length > 0 && (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-sm mb-3">
            {tDrops("title")} — {distrito}
          </h2>
          <PriceDropZones
            overview={data.price_drop_stats.overview}
            byBarrio={data.price_drop_stats.by_barrio}
            filterDistrito={distrito}
            limit={5}
          />
        </section>
      )}

      {/* Texto SEO descriptivo */}
      <section className="mb-8 rounded-xl bg-slate-800/40 border border-slate-700/40 px-5 py-4">
        <h2 className="text-white font-semibold text-sm mb-2">
          {t("market_title", { name: distrito })}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("is_one_of_21", { name: distrito })}
          {openData?.poblacion
            ? ` ${t("has_inhabitants", {
                count: openData.poblacion.toLocaleString(
                  params.locale === "en" ? "en-GB" : "es-ES"
                ),
              })}`
            : ""}
          {openData?.edad_media
            ? ` (${t("median_age", {
                age: openData.edad_media.toLocaleString(
                  params.locale === "en" ? "en-GB" : "es-ES",
                  { maximumFractionDigits: 1 }
                ),
              })})`
            : ""}
          .
          {metrics.zone?.median_price && (
            <>
              {" "}
              {t("median_price_is", { name: distrito })}{" "}
              <strong className="text-slate-300">
                {fmtEur(metrics.zone.median_price, params.locale)}
              </strong>
              , {t("with_price_per_sqm")}{" "}
              <strong className="text-slate-300">
                {fmtEurSqm(metrics.zone.price_per_sqm, params.locale)}
              </strong>
              .
            </>
          )}
          {metrics.zone?.active_count && (
            <>
              {" "}
              {t("currently_available", {
                count: fmtNum(metrics.zone.active_count, params.locale),
              })}
            </>
          )}
          {metrics.notarialGap?.gap_pct != null && (
            <>
              {" "}
              {t("notarial_gap_text", {
                pct: fmtPct(metrics.notarialGap.gap_pct, 1, params.locale),
              })}
            </>
          )}
          {metrics.madridAvgSqm && metrics.zone?.price_per_sqm && (
            <>
              {" "}
              {t("compared_to_avg", {
                avg: fmtEurSqm(metrics.madridAvgSqm, params.locale),
              })}{" "}
              {distrito}{" "}
              {metrics.zone.price_per_sqm > metrics.madridAvgSqm
                ? t("above_avg")
                : t("below_avg")}{" "}
              {t("vs_avg")}.
            </>
          )}
        </p>
      </section>

      {/* Barrios del distrito */}
      <section className="mb-8">
        <h2 className="text-slate-300 font-semibold text-sm mb-3">
          {t("barrios_of", { name: distrito })}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {getBarriosForDistrict(distrito).map(([, barrio]) => {
            const bData = data.barrios?.find((b) => b.barrio === barrio);
            return (
              <Link
                key={barrio}
                href={`/barrio/${toBarrioSlug(barrio)}`}
                className="rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all"
              >
                <p className="text-slate-200 text-xs font-medium truncate">{barrio}</p>
                {bData?.price_per_sqm ? (
                  <p className="text-cyan-400 font-mono text-[10px] mt-0.5">
                    {bData.price_per_sqm.toLocaleString(
                      params.locale === "en" ? "en-GB" : "es-ES"
                    )}{" "}
                    €/m²
                  </p>
                ) : (
                  <p className="text-slate-600 text-[10px] mt-0.5">
                    {t("no_data")}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* District Navigation */}
      <section className="mb-8">
        <DistrictNav currentDistrict={distrito} zones={data.zones} />
      </section>

      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
