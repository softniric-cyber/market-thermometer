"use client";

import type { DistrictMetrics } from "@/lib/districts";
import { fmtEur, fmtEurSqm, fmtNum, fmtPct } from "@/lib/utils";

interface Props {
  metrics: DistrictMetrics;
}

interface KpiItem {
  label: string;
  icon: string;
  value: string;
  comparison?: string;
  comparisonColor?: string;
}

export default function DistrictKpiCards({ metrics }: Props) {
  const { zone, notarialGap, madridAvgSqm } = metrics;

  // Comparación con media Madrid
  const vsMadrid =
    zone?.price_per_sqm && madridAvgSqm
      ? ((zone.price_per_sqm - madridAvgSqm) / madridAvgSqm) * 100
      : null;
  const vsMadridStr =
    vsMadrid != null
      ? `${vsMadrid > 0 ? "+" : ""}${vsMadrid.toFixed(0)}% vs media Madrid`
      : undefined;
  const vsMadridColor =
    vsMadrid != null
      ? vsMadrid > 15
        ? "text-red-400"
        : vsMadrid < -15
          ? "text-emerald-400"
          : "text-slate-400"
      : undefined;

  const kpis: KpiItem[] = [
    {
      label: "Precio mediano",
      icon: "💶",
      value: fmtEur(zone?.median_price),
    },
    {
      label: "Precio por m²",
      icon: "📐",
      value: fmtEurSqm(zone?.price_per_sqm),
      comparison: vsMadridStr,
      comparisonColor: vsMadridColor,
    },
    {
      label: "Pisos en venta",
      icon: "🏠",
      value: fmtNum(zone?.active_count),
    },
    {
      label: "Días en mercado",
      icon: "📅",
      value: zone?.days_to_sell != null ? `${Math.round(zone.days_to_sell)} días` : "—",
    },
    {
      label: "Gap notarial",
      icon: "⚖️",
      value: notarialGap?.gap_pct != null ? fmtPct(notarialGap.gap_pct) : "—",
      comparison:
        notarialGap?.gap_pct != null
          ? "Diferencia precio pedido vs escriturado"
          : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{kpi.icon}</span>
            <span className="text-slate-400 text-xs">{kpi.label}</span>
          </div>
          <div className="text-white text-lg font-semibold">{kpi.value}</div>
          {kpi.comparison && (
            <div
              className={`text-xs mt-0.5 ${kpi.comparisonColor ?? "text-slate-500"}`}
            >
              {kpi.comparison}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
