import type { MetricsData } from "@/lib/types";
import { toSlug } from "@/lib/districts";
import { toBarrioSlug } from "@/lib/barrios";
import type { BlogPostFull } from "./types";

// ── Helpers ──────────────────────────────────────────────────
function esc(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function eurSqm(n: number | null | undefined): string {
  return n != null ? `${esc(n)}\u00a0€/m²` : "—";
}

function eur(n: number | null | undefined): string {
  return n != null ? `${esc(n)}\u00a0€` : "—";
}

function pct(n: number | null | undefined, d = 1): string {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
}

function distLink(name: string): string {
  return `<a href="/distrito/${toSlug(name)}" class="text-cyan-400 hover:underline">${name}</a>`;
}

function barrioLink(name: string): string {
  return `<a href="/barrio/${toBarrioSlug(name)}" class="text-cyan-400 hover:underline">${name}</a>`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── 1. Informe de mercado ────────────────────────────────────
export function generateMarketReport(data: MetricsData): BlogPostFull {
  const s = data.market_score;
  const pt = data.indicators.price_trend;
  const ss = data.indicators.sales_speed;
  const aff = data.indicators.affordability;
  const eu = data.macro.euribor;
  const paro = data.macro.paro;
  const hip = data.macro.hipotecas;
  const zones = data.zones.filter((z) => z.price_per_sqm != null);
  const avgSqm = zones.length
    ? Math.round(zones.reduce((a, z) => a + (z.price_per_sqm ?? 0), 0) / zones.length)
    : null;

  const trendWord =
    s.trend === "up" ? "alcista" : s.trend === "down" ? "bajista" : "estable";

  const alertsHtml = data.alerts.length
    ? `<h2>Alertas activas</h2><ul>${data.alerts.map((a) => `<li><strong>${a.title}</strong> — ${a.message}</li>`).join("")}</ul>`
    : "";

  const html = `
<p>El mercado inmobiliario de Madrid se encuentra en estado <strong>${s.label}</strong> con una puntuación de <strong>${s.score ?? "—"}/100</strong> y tendencia <strong>${trendWord}</strong>. ${s.description}</p>

<h2>Precios</h2>
<p>El precio mediano de la vivienda es de <strong>${eur(pt?.current)}</strong>, con una variación del <strong>${pct(pt?.change_pct)}</strong> respecto al periodo anterior. La media del precio por metro cuadrado en Madrid se sitúa en <strong>${eurSqm(avgSqm)}</strong>.</p>

<h2>Velocidad de venta</h2>
<p>La mediana de tiempo de venta es de <strong>${ss?.current ?? "—"} días</strong>. ${(ss?.current ?? 0) < 45 ? "El mercado muestra una absorción relativamente rápida de la oferta." : "Los pisos tardan en venderse, lo que puede indicar sobreoferta o precios elevados."}</p>

<h2>Accesibilidad</h2>
<p>El ratio precio/ingreso se sitúa en <strong>${pct(aff?.price_to_income)}</strong> años de renta familiar para adquirir una vivienda media. La cuota hipotecaria estimada es de <strong>${eur(aff?.monthly_payment)}/mes</strong>.</p>

<h2>Contexto macroeconómico</h2>
<table>
  <thead><tr><th>Indicador</th><th>Valor</th><th>Tendencia</th></tr></thead>
  <tbody>
    <tr><td>Euríbor 12M</td><td>${pct(eu?.current)}</td><td>${eu?.trend === "down" ? "↓ Bajando" : eu?.trend === "up" ? "↑ Subiendo" : "→ Estable"}</td></tr>
    <tr><td>Paro Madrid</td><td>${pct(paro?.current)}</td><td>${paro?.trend === "down" ? "↓ Bajando" : "→"}</td></tr>
    <tr><td>Hipotecas/mes</td><td>${esc(hip?.current)}</td><td>${hip?.trend === "down" ? "↓" : hip?.trend === "up" ? "↑" : "→"}</td></tr>
  </tbody>
</table>

${alertsHtml}

<p><em>Datos actualizados a ${formatDate(data.metadata.generated_at)}. <a href="/" class="text-cyan-400 hover:underline">Ver dashboard completo →</a></em></p>
`.trim();

  return {
    slug: "informe-mercado-madrid",
    title: "Informe del mercado inmobiliario de Madrid",
    description: `El mercado marca ${s.score}/100 (${s.label}). Precio mediano: ${eur(pt?.current)}, ${eurSqm(avgSqm)}. Tendencia ${trendWord}.`,
    publishedAt: data.metadata.generated_at,
    category: "Informe",
    type: "auto",
    html,
  };
}

// ── 2. Ranking distritos más caros ───────────────────────────
export function generateExpensiveRanking(data: MetricsData): BlogPostFull {
  const sorted = [...data.zones]
    .filter((z) => z.price_per_sqm != null)
    .sort((a, b) => (b.price_per_sqm ?? 0) - (a.price_per_sqm ?? 0));
  const top = sorted.slice(0, 10);

  const rows = top
    .map(
      (z, i) =>
        `<tr><td>${i + 1}</td><td>${distLink(z.name)}</td><td><strong>${eurSqm(z.price_per_sqm)}</strong></td><td>${eur(z.median_price)}</td><td>${esc(z.active_count ?? null)}</td></tr>`
    )
    .join("");

  const html = `
<p>Este ranking muestra los 10 distritos más caros de Madrid ordenados por precio por metro cuadrado. Los datos se actualizan diariamente con precios reales de pisos en venta.</p>

<table>
  <thead><tr><th>#</th><th>Distrito</th><th>€/m²</th><th>Precio mediano</th><th>Pisos activos</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>Análisis</h2>
<p>${distLink(top[0]?.name ?? "")} lidera el ranking con <strong>${eurSqm(top[0]?.price_per_sqm)}</strong>, seguido de ${distLink(top[1]?.name ?? "")} (${eurSqm(top[1]?.price_per_sqm)}) y ${distLink(top[2]?.name ?? "")} (${eurSqm(top[2]?.price_per_sqm)}). Estos distritos concentran las zonas más exclusivas de Madrid con precios que superan ampliamente la media de la ciudad.</p>

<p><em>Datos actualizados a ${formatDate(data.metadata.generated_at)}.</em></p>
`.trim();

  return {
    slug: "ranking-distritos-caros",
    title: "Los distritos más caros de Madrid",
    description: `Ranking actualizado: ${top[0]?.name} (${eurSqm(top[0]?.price_per_sqm)}), ${top[1]?.name} (${eurSqm(top[1]?.price_per_sqm)}), ${top[2]?.name} (${eurSqm(top[2]?.price_per_sqm)}).`,
    publishedAt: data.metadata.generated_at,
    category: "Ranking",
    type: "auto",
    html,
  };
}

// ── 3. Ranking distritos más baratos ─────────────────────────
export function generateCheapRanking(data: MetricsData): BlogPostFull {
  const sorted = [...data.zones]
    .filter((z) => z.price_per_sqm != null)
    .sort((a, b) => (a.price_per_sqm ?? 0) - (b.price_per_sqm ?? 0));
  const top = sorted.slice(0, 10);

  const rows = top
    .map(
      (z, i) =>
        `<tr><td>${i + 1}</td><td>${distLink(z.name)}</td><td><strong>${eurSqm(z.price_per_sqm)}</strong></td><td>${eur(z.median_price)}</td><td>${esc(z.active_count ?? null)}</td></tr>`
    )
    .join("");

  const html = `
<p>Este ranking muestra los 10 distritos más asequibles de Madrid ordenados por precio por metro cuadrado. Los datos se actualizan diariamente con precios reales de pisos en venta.</p>

<table>
  <thead><tr><th>#</th><th>Distrito</th><th>€/m²</th><th>Precio mediano</th><th>Pisos activos</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>Análisis</h2>
<p>${distLink(top[0]?.name ?? "")} es el distrito más asequible con <strong>${eurSqm(top[0]?.price_per_sqm)}</strong>, seguido de ${distLink(top[1]?.name ?? "")} y ${distLink(top[2]?.name ?? "")}. Estos distritos ofrecen las mejores oportunidades para compradores con presupuesto ajustado, con precios significativamente por debajo de la media madrileña.</p>

<p><em>Datos actualizados a ${formatDate(data.metadata.generated_at)}.</em></p>
`.trim();

  return {
    slug: "ranking-distritos-baratos",
    title: "Los distritos más baratos de Madrid",
    description: `Ranking actualizado: ${top[0]?.name} (${eurSqm(top[0]?.price_per_sqm)}), ${top[1]?.name} (${eurSqm(top[1]?.price_per_sqm)}), ${top[2]?.name} (${eurSqm(top[2]?.price_per_sqm)}).`,
    publishedAt: data.metadata.generated_at,
    category: "Ranking",
    type: "auto",
    html,
  };
}

// ── 4. Ranking rentabilidad alquiler ─────────────────────────
export function generateRentalRanking(data: MetricsData): BlogPostFull {
  const yields = [...data.rental_yields].sort(
    (a, b) => (b.gross_yield ?? 0) - (a.gross_yield ?? 0)
  );
  const top = yields.slice(0, 15);
  const avgYield = data.indicators.rental_yield?.avg_yield;

  const rows = top
    .map(
      (y, i) =>
        `<tr><td>${i + 1}</td><td>${barrioLink(y.barrio)}</td><td>${y.distrito}</td><td><strong>${pct(y.gross_yield)}</strong></td><td>${y.rent_median ? `${esc(y.rent_median)}\u00a0€/mes` : "—"}</td></tr>`
    )
    .join("");

  const html = `
<p>La rentabilidad bruta media del alquiler en Madrid es del <strong>${pct(avgYield)}</strong>. Este ranking muestra los barrios con mayor rentabilidad, calculada como la renta anual entre el precio de venta por metro cuadrado.</p>

<table>
  <thead><tr><th>#</th><th>Barrio</th><th>Distrito</th><th>Rentabilidad</th><th>Renta mediana</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<h2>Interpretación</h2>
<p>Los barrios con mayor rentabilidad tienden a estar en distritos periféricos donde el precio de compra es más bajo pero la demanda de alquiler se mantiene. ${barrioLink(top[0]?.barrio ?? "")} lidera con un <strong>${pct(top[0]?.gross_yield)}</strong> de yield bruto.</p>

<p>Ten en cuenta que la rentabilidad bruta no incluye gastos de comunidad, IBI, seguros ni periodos de vacancia. La rentabilidad neta suele ser entre 1,5 y 2,5 puntos porcentuales inferior.</p>

<p><em>Datos actualizados a ${formatDate(data.metadata.generated_at)}.</em></p>
`.trim();

  return {
    slug: "ranking-rentabilidad-alquiler",
    title: "Barrios con mayor rentabilidad de alquiler en Madrid",
    description: `Ranking actualizado: ${top[0]?.barrio} (${pct(top[0]?.gross_yield)}), ${top[1]?.barrio} (${pct(top[1]?.gross_yield)}), ${top[2]?.barrio} (${pct(top[2]?.gross_yield)}). Media Madrid: ${pct(avgYield)}.`,
    publishedAt: data.metadata.generated_at,
    category: "Ranking",
    type: "auto",
    html,
  };
}

// ── Export all generators ────────────────────────────────────
export const AUTO_GENERATORS = [
  generateMarketReport,
  generateExpensiveRanking,
  generateCheapRanking,
  generateRentalRanking,
] as const;
