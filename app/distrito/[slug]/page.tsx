import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { MetricsData } from "@/lib/types";
import {
  DISTRICTS,
  toSlug,
  fromSlug,
  getAllSlugs,
  getDistrictMetrics,
} from "@/lib/districts";
import { fmtEur, fmtEurSqm, fmtNum } from "@/lib/utils";

import Breadcrumb from "@/components/Breadcrumb";
import DistrictKpiCards from "@/components/DistrictKpiCards";
import PriceTrendChart from "@/components/PriceTrendChart";
import RentalYields from "@/components/RentalYields";
import DistrictNav from "@/components/DistrictNav";
import Footer from "@/components/Footer";

export const revalidate = 3600;

/* ── Static params for all 21 districts ────────────────────── */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ── Dynamic metadata per district ─────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const distrito = fromSlug(params.slug);
  if (!distrito) return {};

  const data = await getMetrics();
  const zone = data?.zones.find((z) => z.name === distrito);
  const sqm = zone?.price_per_sqm
    ? `${zone.price_per_sqm.toLocaleString("es-ES")} €/m²`
    : "";
  const price = zone?.median_price
    ? `${(zone.median_price / 1000).toFixed(0)}K€`
    : "";
  const count = zone?.active_count ?? 0;

  return {
    title: `Precio vivienda ${distrito} — ${sqm} · Madrid`,
    description: `Consulta el precio de la vivienda en ${distrito}, Madrid. Mediana: ${price}, ${sqm}. ${count} pisos en venta. Evolución semanal, rentabilidad alquiler y datos actualizados a diario.`,
    alternates: { canonical: `/distrito/${params.slug}` },
    openGraph: {
      title: `Precio vivienda ${distrito} — Madrid | madridhome.tech`,
      description: `${distrito}: ${sqm}, ${count} pisos activos. Tendencias del mercado inmobiliario actualizadas a diario.`,
      url: `https://madridhome.tech/distrito/${params.slug}`,
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Page ──────────────────────────────────────────────────── */
export default async function DistrictPage({
  params,
}: {
  params: { slug: string };
}) {
  const distrito = fromSlug(params.slug);
  if (!distrito) notFound();

  const data = await getMetrics();
  if (!data) notFound();

  const metrics = getDistrictMetrics(distrito, data);

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
          Precio vivienda en {distrito}
          <span className="text-slate-500 font-normal"> — Madrid</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Datos actualizados el {formatDate(data.metadata.generated_at)}
          {metrics.zone?.price_per_sqm && (
            <>
              {" · "}
              <strong className="text-slate-300">
                {fmtEurSqm(metrics.zone.price_per_sqm)}
              </strong>
            </>
          )}
          {metrics.zone?.active_count && (
            <>
              {" · "}
              {fmtNum(metrics.zone.active_count)} pisos en venta
            </>
          )}
        </p>
      </header>

      {/* KPI Cards */}
      <section className="mb-8">
        <DistrictKpiCards metrics={metrics} />
      </section>

      {/* Price Trend Chart */}
      {metrics.trends.length > 0 && (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-sm mb-3">
            Evolución precio vivienda {distrito} (€/m²)
          </h2>
          <PriceTrendChart data={metrics.trends} />
        </section>
      )}

      {/* Rental Yields */}
      {metrics.yields.length > 0 && (
        <section className="mb-8">
          <h2 className="text-white font-semibold text-sm mb-3">
            Rentabilidad alquiler por barrio en {distrito}
          </h2>
          <RentalYields yields={metrics.yields} />
        </section>
      )}

      {/* Texto SEO descriptivo */}
      <section className="mb-8 rounded-xl bg-slate-800/40 border border-slate-700/40 px-5 py-4">
        <h2 className="text-white font-semibold text-sm mb-2">
          Mercado inmobiliario en {distrito}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {distrito} es uno de los 21 distritos de Madrid.
          {metrics.zone?.median_price && (
            <>
              {" "}
              El precio mediano de una vivienda en {distrito} es de{" "}
              <strong className="text-slate-300">
                {fmtEur(metrics.zone.median_price)}
              </strong>
              , con un precio por metro cuadrado de{" "}
              <strong className="text-slate-300">
                {fmtEurSqm(metrics.zone.price_per_sqm)}
              </strong>
              .
            </>
          )}
          {metrics.zone?.active_count && (
            <>
              {" "}
              Actualmente hay{" "}
              <strong className="text-slate-300">
                {fmtNum(metrics.zone.active_count)} viviendas en venta
              </strong>{" "}
              en este distrito.
            </>
          )}
          {metrics.notarialGap?.gap_pct != null && (
            <>
              {" "}
              El gap notarial (diferencia entre el precio de venta publicado y
              el precio escriturado) es del{" "}
              <strong className="text-slate-300">
                {metrics.notarialGap.gap_pct.toFixed(1)}%
              </strong>
              .
            </>
          )}
          {metrics.madridAvgSqm && metrics.zone?.price_per_sqm && (
            <>
              {" "}
              Comparado con la media de Madrid ({fmtEurSqm(metrics.madridAvgSqm)}
              ), {distrito}{" "}
              {metrics.zone.price_per_sqm > metrics.madridAvgSqm
                ? "se sitúa por encima"
                : "se sitúa por debajo"}{" "}
              del precio medio.
            </>
          )}
        </p>
      </section>

      {/* District Navigation */}
      <section className="mb-8">
        <DistrictNav currentDistrict={distrito} zones={data.zones} />
      </section>

      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
