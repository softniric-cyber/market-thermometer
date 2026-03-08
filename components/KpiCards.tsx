"use client";

import type { Indicator, MacroIndicator } from "@/lib/types";
import { fmtEur, fmtEurSqm, fmtPct, fmtNum, trendIcon, trendColor } from "@/lib/utils";

interface Props {
  indicators: Record<string, Indicator>;
  macro: Record<string, MacroIndicator>;
  dbStats: Record<string, unknown>;
}

interface KpiDef {
  key: string;
  label: string;
  icon: string;
  getValue: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>, db: Record<string, unknown>) => string;
  getTrend: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>) => string | null | undefined;
  invertGood?: boolean;
  subtitle?: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>) => string;
}

const KPI_DEFS: KpiDef[] = [
  {
    key: "price",
    label: "Precio mediano",
    icon: "💶",
    getValue: (ind) => fmtEur(ind.price_trend?.current as number),
    getTrend: (ind) => ind.price_trend?.trend,
    subtitle: (ind) => {
      const pct = ind.price_trend?.change_pct;
      return pct != null ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% semanal` : "";
    },
  },
  {
    key: "price_sqm",
    label: "€/m² mediano",
    icon: "📐",
    getValue: (ind) => {
      const series = ind.price_trend?.series as Array<Record<string, number>> | undefined;
      const last = series?.[series.length - 1];
      // key in JSON is median_price_sqm
      const val = last?.median_price_sqm ?? last?.median_sqm;
      return val ? fmtEurSqm(val) : "—";
    },
    getTrend: (ind) => ind.price_trend?.trend,
  },
  {
    key: "inventory",
    label: "Stock activo",
    icon: "🏗️",
    getValue: (ind) => fmtNum(ind.inventory?.current as number),
    getTrend: (ind) => ind.inventory?.trend,
  },
  {
    key: "speed",
    label: "Días en mercado",
    icon: "📅",
    getValue: (ind) => {
      const d = ind.sales_speed?.current;
      return d != null ? `${d} días` : "—";
    },
    getTrend: (ind) => ind.sales_speed?.trend,
    invertGood: true,
  },
  {
    key: "avg_drop",
    label: "Bajada media",
    icon: "✂️",
    getValue: (_ind, _macro, db) => {
      const overview = (db as Record<string, Record<string, Record<string, number>>>)
        ?.price_drop_stats?.overview;
      const avg = overview?.avg_drop_pct;
      return avg != null ? `${avg.toFixed(1)}%` : "—";
    },
    getTrend: () => "down",
    invertGood: true,
    subtitle: (_ind, _macro) => "Rebaja media sobre precio pedido",
  },
  {
    key: "drops",
    label: "Pisos con bajada",
    icon: "📉",
    getValue: (ind, _macro, db) => {
      // Try indicator first, fall back to price_drop_stats.overview
      const fromInd = ind.price_drop_ratio?.current ?? ind.price_drop_ratio?.drop_ratio;
      if (fromInd != null) return fmtPct(fromInd as number);
      const overview = (db as Record<string, Record<string, Record<string, number>>>)
        ?.price_drop_stats?.overview;
      const pct = overview?.drop_pct_of_total;
      if (pct != null) return fmtPct(pct);
      const withDrops = overview?.with_drops;
      const total = overview?.total_active ?? (ind.inventory?.current as number);
      if (withDrops != null && total) return fmtPct((withDrops / total) * 100);
      return "—";
    },
    getTrend: (ind) => ind.price_drop_ratio?.trend,
    invertGood: true,
    subtitle: (_ind, _macro) => "% con ≥1 rebaja en 30 días",
  },
  {
    key: "affordability",
    label: "Cuota hipotecaria",
    icon: "🏠",
    getValue: (ind) => {
      const mp = ind.affordability?.monthly_payment ?? ind.affordability?.current;
      return mp != null ? `${fmtNum(mp as number)} €/mes` : "—";
    },
    getTrend: (ind) => ind.affordability?.trend,
    invertGood: true,
    subtitle: (ind) => {
      const pti = ind.affordability?.price_to_income;
      return pti != null ? `${(pti as number).toFixed(0)}% del salario` : "";
    },
  },
  {
    key: "yield",
    label: "Rentabilidad alquiler",
    icon: "🏘️",
    getValue: (ind) => {
      const y = ind.rental_yield?.avg_yield ?? ind.rental_yield?.current;
      return y != null ? fmtPct(y as number) : "—";
    },
    getTrend: (ind) => ind.rental_yield?.trend,
  },
  {
    key: "euribor",
    label: "Euríbor 12M",
    icon: "💰",
    getValue: (_ind, macro) => {
      const e = macro.euribor?.current;
      return e != null ? fmtPct(e) : "—";
    },
    getTrend: (_ind, macro) => macro.euribor?.trend,
    invertGood: true,
  },
  {
    key: "notarial",
    label: "Gap oferta vs real",
    icon: "📋",
    getValue: (ind) => {
      const g = ind.notarial_gap?.current;
      return g != null ? `+${fmtPct(g as number)}` : "—";
    },
    getTrend: (ind) => ind.notarial_gap?.trend,
    invertGood: true,
    subtitle: () => "Precio pedido vs escriturado",
  },
];

export default function KpiCards({ indicators, macro, dbStats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPI_DEFS.map((kpi) => {
        const value = kpi.getValue(indicators, macro, dbStats);
        const trend = kpi.getTrend(indicators, macro);
        const sub = kpi.subtitle?.(indicators, macro);
        return (
          <div
            key={kpi.key}
            className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{kpi.icon}</span>
              <span className={`text-xs font-medium ${trendColor(trend, kpi.invertGood)}`}>
                {trendIcon(trend)}
              </span>
            </div>
            <div className="text-white font-semibold text-base truncate">
              {value}
            </div>
            <div className="text-slate-400 text-xs mt-1">{kpi.label}</div>
            {sub && (
              <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
