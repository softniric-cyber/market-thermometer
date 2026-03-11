import { readFile } from "fs/promises";
import { join } from "path";
import Link from "next/link";
import type { Metadata } from "next";
import type { MetricsData } from "@/lib/types";
import { toSlug } from "@/lib/districts";
import { toBarrioSlug } from "@/lib/barrios";
import { fmtEur, fmtEurSqm, fmtPct, fmtNum } from "@/lib/utils";

import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";

export const revalidate = 3600;

/* ── Metadata ──────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Preguntas frecuentes — Precio vivienda Madrid",
  description:
    "Respuestas actualizadas sobre el precio de la vivienda en Madrid: cuánto cuesta un piso, rentabilidad alquiler, Euríbor, mejores distritos y más.",
  alternates: { canonical: "/preguntas-frecuentes" },
  openGraph: {
    title: "Preguntas frecuentes — Precio vivienda Madrid | madridhome.tech",
    description:
      "Todo lo que necesitas saber sobre el mercado inmobiliario de Madrid, con datos reales actualizados a diario.",
    url: "https://madridhome.tech/preguntas-frecuentes",
  },
};

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

/* ── FAQ builder ───────────────────────────────────────────── */
interface FaqItem {
  question: string;
  answer: string;
  answerJsx: React.ReactNode;
}

function buildFaqs(data: MetricsData): FaqItem[] {
  // Helpers
  const zones = [...data.zones].filter((z) => z.price_per_sqm != null);
  const sortedByPrice = [...zones].sort(
    (a, b) => (b.price_per_sqm ?? 0) - (a.price_per_sqm ?? 0)
  );
  const top5 = sortedByPrice.slice(0, 5);
  const bottom5 = sortedByPrice.slice(-5).reverse();

  const avgSqm = zones.length
    ? Math.round(
        zones.reduce((s, z) => s + (z.price_per_sqm ?? 0), 0) / zones.length
      )
    : null;

  const priceTrend = data.indicators.price_trend;
  const salesSpeed = data.indicators.sales_speed;
  const rentalYield = data.indicators.rental_yield;
  const notarialGap = data.indicators.notarial_gap;
  const priceDrop = data.indicators.price_drop_ratio;
  const euribor = data.macro.euribor;
  const hipotecas = data.macro.hipotecas;
  const score = data.market_score;
  const topYields = data.rental_yields.slice(0, 3);

  const totalActive =
    (data.db_stats as Record<string, unknown>).total_active_listings as
      | number
      | undefined;

  // Plain-text answers for JSON-LD
  const faqs: FaqItem[] = [
    {
      question: "¿Cuánto cuesta un piso en Madrid?",
      answer: `El precio mediano de una vivienda en Madrid es de ${fmtEur(priceTrend?.current ?? null)}, con una variación del ${fmtPct(priceTrend?.change_pct ?? null)} respecto al periodo anterior. El rango va desde ${fmtEurSqm(bottom5[0]?.price_per_sqm ?? null)} en ${bottom5[0]?.name ?? "—"} hasta ${fmtEurSqm(top5[0]?.price_per_sqm ?? null)} en ${top5[0]?.name ?? "—"}.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          El precio mediano de una vivienda en Madrid es de{" "}
          <strong className="text-white">
            {fmtEur(priceTrend?.current ?? null)}
          </strong>
          , con una variación del{" "}
          <strong
            className={
              (priceTrend?.change_pct ?? 0) > 0
                ? "text-red-400"
                : "text-emerald-400"
            }
          >
            {fmtPct(priceTrend?.change_pct ?? null)}
          </strong>{" "}
          respecto al periodo anterior. El rango va desde{" "}
          <Link
            href={`/distrito/${toSlug(bottom5[0]?.name ?? "")}`}
            className="text-cyan-400 hover:underline"
          >
            {fmtEurSqm(bottom5[0]?.price_per_sqm ?? null)} en{" "}
            {bottom5[0]?.name}
          </Link>{" "}
          hasta{" "}
          <Link
            href={`/distrito/${toSlug(top5[0]?.name ?? "")}`}
            className="text-cyan-400 hover:underline"
          >
            {fmtEurSqm(top5[0]?.price_per_sqm ?? null)} en {top5[0]?.name}
          </Link>
          .
        </p>
      ),
    },
    {
      question: "¿Cuánto cuesta el metro cuadrado en Madrid?",
      answer: `La media del precio por metro cuadrado en Madrid es de ${fmtEurSqm(avgSqm)}. El distrito más caro es ${top5[0]?.name} (${fmtEurSqm(top5[0]?.price_per_sqm ?? null)}) y el más asequible es ${bottom5[0]?.name} (${fmtEurSqm(bottom5[0]?.price_per_sqm ?? null)}).`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          La media del precio por metro cuadrado en Madrid es de{" "}
          <strong className="text-white">{fmtEurSqm(avgSqm)}</strong>. El
          distrito más caro es{" "}
          <Link
            href={`/distrito/${toSlug(top5[0]?.name ?? "")}`}
            className="text-cyan-400 hover:underline"
          >
            {top5[0]?.name} ({fmtEurSqm(top5[0]?.price_per_sqm ?? null)})
          </Link>{" "}
          y el más asequible es{" "}
          <Link
            href={`/distrito/${toSlug(bottom5[0]?.name ?? "")}`}
            className="text-cyan-400 hover:underline"
          >
            {bottom5[0]?.name} ({fmtEurSqm(bottom5[0]?.price_per_sqm ?? null)})
          </Link>
          .
        </p>
      ),
    },
    {
      question: "¿Es buen momento para comprar vivienda en Madrid?",
      answer: `Nuestro termómetro de mercado marca ${score.score ?? "—"}/100 (${score.label}). ${score.description} Una puntuación alta (>75) indica un mercado claramente alcista; baja (<40) sugiere oportunidades para compradores. La tendencia actual es ${score.trend === "up" ? "alcista" : score.trend === "down" ? "bajista" : "estable"}.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          Nuestro termómetro de mercado marca{" "}
          <strong className="text-white">
            {score.score ?? "—"}/100 ({score.label})
          </strong>
          . {score.description} Una puntuación alta (&gt;75) indica un mercado
          claramente alcista; baja (&lt;40) sugiere oportunidades para
          compradores. La tendencia actual es{" "}
          <strong className="text-white">
            {score.trend === "up"
              ? "alcista"
              : score.trend === "down"
                ? "bajista"
                : "estable"}
          </strong>
          .
        </p>
      ),
    },
    {
      question: "¿Cuánto tarda en venderse un piso en Madrid?",
      answer: `La mediana de tiempo de venta en Madrid es de ${salesSpeed?.current ?? "—"} días. Esto varía significativamente por distrito: en las zonas más demandadas puede bajar de 30 días, mientras que en distritos periféricos puede superar los 60.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          La mediana de tiempo de venta en Madrid es de{" "}
          <strong className="text-white">
            {salesSpeed?.current ?? "—"} días
          </strong>
          . Esto varía significativamente por distrito: en las zonas más
          demandadas puede bajar de 30 días, mientras que en distritos
          periféricos puede superar los 60.
        </p>
      ),
    },
    {
      question: "¿Cuál es la rentabilidad del alquiler en Madrid?",
      answer: `La rentabilidad bruta media del alquiler en Madrid es del ${fmtPct(rentalYield?.avg_yield ?? null)}. Los barrios con mayor rentabilidad son: ${topYields.map((y) => `${y.barrio} (${fmtPct(y.gross_yield)})`).join(", ")}.`,
      answerJsx: (
        <div className="text-slate-300 text-sm leading-relaxed">
          <p>
            La rentabilidad bruta media del alquiler en Madrid es del{" "}
            <strong className="text-emerald-400">
              {fmtPct(rentalYield?.avg_yield ?? null)}
            </strong>
            . Los barrios con mayor rentabilidad son:
          </p>
          <ul className="mt-2 space-y-1 ml-4 list-disc">
            {topYields.map((y) => (
              <li key={y.barrio}>
                <Link
                  href={`/barrio/${toBarrioSlug(y.barrio)}`}
                  className="text-cyan-400 hover:underline"
                >
                  {y.barrio}
                </Link>{" "}
                — <strong className="text-emerald-400">{fmtPct(y.gross_yield)}</strong>{" "}
                <span className="text-slate-500">({y.distrito})</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      question: "¿Cómo afecta el Euríbor al mercado inmobiliario de Madrid?",
      answer: `El Euríbor a 12 meses está en el ${fmtPct(euribor?.current ?? null)}, con tendencia ${euribor?.trend === "down" ? "a la baja" : euribor?.trend === "up" ? "al alza" : "estable"}. Un Euríbor más bajo abarata las hipotecas variables y facilita el acceso a la vivienda. Actualmente se firman unas ${fmtNum(hipotecas?.current ?? null)} hipotecas mensuales en Madrid.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          El Euríbor a 12 meses está en el{" "}
          <strong className="text-white">
            {fmtPct(euribor?.current ?? null)}
          </strong>
          , con tendencia{" "}
          <strong
            className={
              euribor?.trend === "down" ? "text-emerald-400" : "text-slate-300"
            }
          >
            {euribor?.trend === "down"
              ? "a la baja"
              : euribor?.trend === "up"
                ? "al alza"
                : "estable"}
          </strong>
          . Un Euríbor más bajo abarata las hipotecas variables y facilita el
          acceso a la vivienda. Actualmente se firman unas{" "}
          <strong className="text-white">
            {fmtNum(hipotecas?.current ?? null)}
          </strong>{" "}
          hipotecas mensuales en Madrid.
        </p>
      ),
    },
    {
      question: "¿Cuáles son los distritos más caros de Madrid?",
      answer: `Los 5 distritos más caros de Madrid por €/m² son: ${top5.map((z) => `${z.name} (${fmtEurSqm(z.price_per_sqm)})`).join(", ")}.`,
      answerJsx: (
        <div className="text-slate-300 text-sm leading-relaxed">
          <p>Los 5 distritos más caros de Madrid por €/m²:</p>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            {top5.map((z) => (
              <li key={z.name}>
                <Link
                  href={`/distrito/${toSlug(z.name)}`}
                  className="text-cyan-400 hover:underline"
                >
                  {z.name}
                </Link>{" "}
                — <strong className="text-white">{fmtEurSqm(z.price_per_sqm)}</strong>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      question: "¿Cuáles son los distritos más baratos de Madrid?",
      answer: `Los 5 distritos más asequibles de Madrid por €/m² son: ${bottom5.map((z) => `${z.name} (${fmtEurSqm(z.price_per_sqm)})`).join(", ")}.`,
      answerJsx: (
        <div className="text-slate-300 text-sm leading-relaxed">
          <p>Los 5 distritos más asequibles de Madrid por €/m²:</p>
          <ol className="mt-2 space-y-1 ml-4 list-decimal">
            {bottom5.map((z) => (
              <li key={z.name}>
                <Link
                  href={`/distrito/${toSlug(z.name)}`}
                  className="text-cyan-400 hover:underline"
                >
                  {z.name}
                </Link>{" "}
                — <strong className="text-white">{fmtEurSqm(z.price_per_sqm)}</strong>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      question: "¿Qué es el gap notarial y qué indica?",
      answer: `El gap notarial es la diferencia entre el precio de venta publicado por los portales y el precio real escriturado en notaría. En Madrid, el gap medio es del ${fmtPct(notarialGap?.current ?? null)}. Un gap alto indica que los vendedores están aceptando ofertas significativamente por debajo de su precio de salida.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          El gap notarial es la diferencia entre el precio de venta publicado por
          los portales y el precio real escriturado en notaría. En Madrid, el gap
          medio es del{" "}
          <strong className="text-white">
            {fmtPct(notarialGap?.current ?? null)}
          </strong>
          . Un gap alto indica que los vendedores están aceptando ofertas
          significativamente por debajo de su precio de salida.
        </p>
      ),
    },
    {
      question: "¿Qué porcentaje de pisos en Madrid baja de precio?",
      answer: `Actualmente el ${fmtPct((priceDrop?.drop_ratio ?? 0) * 100)} de los pisos en venta en Madrid ha experimentado al menos una bajada de precio. Esto afecta a ${fmtNum(priceDrop?.with_drops ?? null)} de los ${fmtNum(priceDrop?.total_active ?? null)} pisos activos.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          Actualmente el{" "}
          <strong className="text-amber-300">
            {fmtPct((priceDrop?.drop_ratio ?? 0) * 100)}
          </strong>{" "}
          de los pisos en venta en Madrid ha experimentado al menos una bajada de
          precio. Esto afecta a{" "}
          <strong className="text-white">
            {fmtNum(priceDrop?.with_drops ?? null)}
          </strong>{" "}
          de los {fmtNum(priceDrop?.total_active ?? null)} pisos activos.
        </p>
      ),
    },
    {
      question: "¿De dónde vienen los datos de madridhome.tech?",
      answer: `Los datos se obtienen diariamente mediante scraping automatizado de portales inmobiliarios (principalmente Idealista). Se procesan y agregan estadísticamente para mostrar indicadores de mercado. La base de datos contiene ${fmtNum(totalActive ?? null)} pisos activos en Madrid, actualizados cada 24 horas.`,
      answerJsx: (
        <p className="text-slate-300 text-sm leading-relaxed">
          Los datos se obtienen diariamente mediante scraping automatizado de
          portales inmobiliarios. Se procesan y agregan estadísticamente para
          mostrar indicadores de mercado. La base de datos contiene{" "}
          <strong className="text-white">
            {fmtNum(totalActive ?? null)} pisos activos
          </strong>{" "}
          en Madrid, actualizados cada 24 horas. Los datos macro (Euríbor, IPC,
          paro) provienen de fuentes oficiales (INE, BCE, Colegio de
          Registradores).
        </p>
      ),
    },
    {
      question: "¿Qué significa la puntuación del termómetro?",
      answer: `El termómetro es una puntuación compuesta de 0 a 100 que resume el estado del mercado inmobiliario de Madrid. Combina: tendencia de precios, velocidad de venta, accesibilidad (ratio precio/ingreso), Euríbor, y datos notariales. Una puntuación >75 indica un mercado alcista (favorece a vendedores); <40 indica un mercado bajista (favorece a compradores); 40-75 indica transición. Actualmente: ${score.score ?? "—"}/100 (${score.label}).`,
      answerJsx: (
        <div className="text-slate-300 text-sm leading-relaxed">
          <p>
            El termómetro es una puntuación compuesta de 0 a 100 que resume el
            estado del mercado inmobiliario de Madrid. Combina: tendencia de
            precios, velocidad de venta, accesibilidad (ratio precio/ingreso),
            Euríbor y datos notariales.
          </p>
          <ul className="mt-2 space-y-1 ml-4 list-disc">
            <li>
              <strong className="text-emerald-400">&gt;75</strong> — Mercado
              alcista (favorece a vendedores)
            </li>
            <li>
              <strong className="text-amber-400">40–75</strong> — Mercado en
              transición
            </li>
            <li>
              <strong className="text-red-400">&lt;40</strong> — Mercado bajista
              (favorece a compradores)
            </li>
          </ul>
          <p className="mt-2">
            Actualmente:{" "}
            <strong className="text-white">
              {score.score ?? "—"}/100 ({score.label})
            </strong>
          </p>
        </div>
      ),
    },
  ];

  return faqs;
}

/* ── Page component ────────────────────────────────────────── */
export default async function FaqPage() {
  const data = await getMetrics();

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Datos no disponibles.</p>
      </main>
    );
  }

  const faqs = buildFaqs(data);

  // JSON-LD FAQPage schema for Google rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb items={[{ label: "Preguntas frecuentes" }]} />

      <header className="mb-8 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Preguntas frecuentes sobre el mercado inmobiliario en Madrid
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Respuestas actualizadas con datos reales del mercado
        </p>
      </header>

      {/* FAQ list with native HTML details/summary */}
      <section className="space-y-3 mb-10">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden"
            open={i === 0}
          >
            <summary className="px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-3 hover:bg-slate-700/30 transition-colors">
              <h2 className="text-white font-medium text-sm">{faq.question}</h2>
              <span className="text-slate-500 text-xs group-open:rotate-180 transition-transform shrink-0">
                ▼
              </span>
            </summary>
            <div className="px-5 pb-4 pt-1 border-t border-slate-700/30">
              {faq.answerJsx}
            </div>
          </details>
        ))}
      </section>

      {/* CTA — Explore districts */}
      <section className="mb-8 rounded-xl bg-slate-800/40 border border-slate-700/40 px-5 py-5 text-center">
        <h2 className="text-white font-semibold text-sm mb-2">
          Explora el mercado por distrito y barrio
        </h2>
        <p className="text-slate-400 text-xs mb-4">
          Datos detallados de precios, tendencias y rentabilidad para los 21
          distritos y 139 barrios de Madrid.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/distrito/salamanca"
            className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-colors"
          >
            Salamanca →
          </Link>
          <Link
            href="/distrito/centro"
            className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-colors"
          >
            Centro →
          </Link>
          <Link
            href="/distrito/chamartin"
            className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-colors"
          >
            Chamartín →
          </Link>
          <Link
            href="/distrito/carabanchel"
            className="px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-colors"
          >
            Carabanchel →
          </Link>
        </div>
      </section>

      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
