"use client";

import type { Indicator, MacroIndicator } from "@/lib/types";
import { fmtEur, fmtEurSqm, fmtPct, fmtNum, trendIcon, trendColor } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  indicators: Record<string, Indicator>;
  macro: Record<string, MacroIndicator>;
  dbStats: Record<string, unknown>;
}

interface KpiDef {
  key: string;
  labelKey: string;
  icon: string;
  getValue: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>, db: Record<string, unknown>, locale: string) => string;
  getTrend: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>) => string | null | undefined;
  invertGood?: boolean;
  subtitleKey?: string;
  getSubtitle?: (ind: Record<string, Indicator>, macro: Record<string, MacroIndicator>, t: (key: string, opts?: Record<string, unknown>) => string) => string;
}

export default function KpiCards({ indicators, macro, dbStats }: Props) {
  const t = useTranslations("kpi");
  const locale = useLocale();

  const KPI_DEFS: KpiDef[] = [
    {
      key: "price",
      labelKey: "price_median",
      icon: "💶",
      getValue: (ind, _, __, locale) => fmtEur(ind.price_trend?.current as number, locale),
      getTrend: (ind) => ind.price_trend?.trend,
      subtitleKey: "weekly_change",
      getSubtitle: (ind, _, t) => {
        const pct = ind.price_trend?.change_pct;
        return pct != null ? t("weekly_change", { pct: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}` }) : "";
      },
    },
    {
      key: "price_sqm",
      labelKey: "price_per_sqm",
      icon: "📐",
      getValue: (ind, _, __, locale) => {
        // Prefer current_sqm (aligned with the "current" week used for change_pct)
        // over series[-1] which may be an incomplete week
        const direct = ind.price_trend?.current_sqm as number | undefined;
        if (direct) return fmtEurSqm(direct, locale);
        const series = ind.price_trend?.series as Array<Record<string, number>> | undefined;
        const last = series?.[series.length - 1];
        const val = last?.median_price_sqm ?? last?.median_sqm;
        return val ? fmtEurSqm(val, locale) : "—";
      },
      getTrend: (ind) => ind.price_trend?.trend,
    },
    {
      key: "inventory",
      labelKey: "inventory",
      icon: "🏗️",
      getValue: (ind, _, __, locale) => fmtNum(ind.inventory?.current as number, locale),
      getTrend: (ind) => ind.inventory?.trend,
    },
    {
      key: "speed",
      labelKey: "days_in_market",
      icon: "📅",
      getValue: (ind, _, __, locale) => {
        const d = ind.sales_speed?.current;
        return d != null ? `${d} ${t("days_suffix")}` : "—";
      },
      getTrend: (ind) => ind.sales_speed?.trend,
      invertGood: true,
    },
    {
      key: "avg_drop",
      labelKey: "avg_drop",
      icon: "✂️",
      getValue: (_ind, _macro, db, locale) => {
        const overview = (db as Record<string, Record<string, Record<string, number>>>)
          ?.price_drop_stats?.overview;
        const avg = overview?.avg_drop_pct;
        return avg != null ? `${avg.toFixed(1)}%` : "—";
      },
      getTrend: () => "down",
      invertGood: true,
      subtitleKey: "drop_subtitle",
    },
    {
      key: "drops",
      labelKey: "drops",
      icon: "📉",
      getValue: (ind, _macro, db, locale) => {
        const fromInd = ind.price_drop_ratio?.current ?? ind.price_drop_ratio?.drop_ratio;
        if (fromInd != null) return fmtPct(fromInd as number, 1, locale);
        const overview = (db as Record<string, Record<string, Record<string, number>>>)
          ?.price_drop_stats?.overview;
        const pct = overview?.drop_pct_of_total;
        if (pct != null) return fmtPct(pct, 1, locale);
        const withDrops = overview?.with_drops;
        const total = overview?.total_active ?? (ind.inventory?.current as number);
        if (withDrops != null && total) return fmtPct((withDrops / total) * 100, 1, locale);
        return "—";
      },
      getTrend: (ind) => ind.price_drop_ratio?.trend,
      invertGood: true,
      subtitleKey: "drops_subtitle",
    },
    {
      key: "affordability",
      labelKey: "affordability",
      icon: "🏠",
      getValue: (ind, _, __, locale) => {
        const mp = ind.affordability?.monthly_payment ?? ind.affordability?.current;
        return mp != null ? `${fmtNum(mp as number, locale)} €/mes` : "—";
      },
      getTrend: (ind) => ind.affordability?.trend,
      invertGood: true,
      subtitleKey: "affordability_subtitle",
      getSubtitle: (ind, _, t) => {
        const pti = ind.affordability?.price_to_income;
        return pti != null ? t("affordability_subtitle", { pti: (pti as number).toFixed(0) }) : "";
      },
    },
    {
      key: "yield",
      labelKey: "yield",
      icon: "🏘️",
      getValue: (ind, _, __, locale) => {
        const y = ind.rental_yield?.avg_yield ?? ind.rental_yield?.current;
        return y != null ? fmtPct(y as number, 1, locale) : "—";
      },
      getTrend: (ind) => ind.rental_yield?.trend,
    },
    {
      key: "euribor",
      labelKey: "euribor",
      icon: "💰",
      getValue: (_ind, macro, ___, locale) => {
        const e = macro.euribor?.current;
        return e != null ? fmtPct(e, 1, locale) : "—";
      },
      getTrend: (_ind, macro) => macro.euribor?.trend,
      invertGood: true,
    },
    {
      key: "afiliados_ss",
      labelKey: "employed",
      icon: "👷",
      getValue: (_ind, macro, ___, locale) => {
        const a = macro.afiliados_ss?.current;
        return a != null
          ? `${a.toLocaleString(locale === "en" ? "en-GB" : "es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
          : "—";
      },
      getTrend: (_ind, macro) => macro.afiliados_ss?.trend,
      subtitleKey: "employed_subtitle",
      getSubtitle: (_ind, macro, t) => {
        const pct = macro.afiliados_ss?.change_pct;
        return pct != null ? t("employed_subtitle", { pct: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}` }) : "";
      },
    },
    {
      key: "notarial",
      labelKey: "notarial_gap",
      icon: "📋",
      getValue: (ind, _, __, locale) => {
        const g = ind.notarial_gap?.current;
        return g != null ? `+${fmtPct(g as number, 1, locale)}` : "—";
      },
      getTrend: (ind) => ind.notarial_gap?.trend,
      invertGood: true,
      subtitleKey: "notarial_gap_subtitle",
    },
    {
      key: "evictions",
      labelKey: "evictions",
      icon: "⚖️",
      getValue: (ind, _, __, locale) => {
        const v = ind.lanzamientos?.alquiler;
        return v != null ? fmtNum(v as number, locale) : "—";
      },
      getTrend: (ind) => ind.lanzamientos?.trend,
      invertGood: true,
      getSubtitle: (ind, _, t) => {
        const q = ind.lanzamientos?.quarter_label;
        const pct = ind.lanzamientos?.yoy_change_pct;
        if (!q) return "";
        const pctStr = pct != null ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}` : "—";
        return t("evictions_subtitle", { quarter: q, pct: pctStr });
      },
    },
    {
      key: "morosidad",
      labelKey: "morosidad",
      icon: "📛",
      getValue: (ind, _, __, locale) => {
        const v = ind.morosidad?.current;
        return v != null ? `${fmtNum(v as number, locale)} €` : "—";
      },
      getTrend: (ind) => ind.morosidad?.trend,
      invertGood: true,
      getSubtitle: (ind, _, t) => {
        const year = ind.morosidad?.data_year;
        const pct  = ind.morosidad?.yoy_change_pct;
        if (!year) return "";
        const pctStr = pct != null ? pct.toFixed(1) : "—";
        return t("morosidad_subtitle", { year, pct: pctStr });
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {KPI_DEFS.map((kpi) => {
        const value = kpi.getValue(indicators, macro, dbStats, locale);
        const trend = kpi.getTrend(indicators, macro);
        const sub = kpi.getSubtitle
          ? kpi.getSubtitle(indicators, macro, t as (key: string, opts?: Record<string, unknown>) => string)
          : kpi.subtitleKey
            ? t(kpi.subtitleKey)
            : undefined;
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
            <div className="text-slate-400 text-xs mt-1">{t(kpi.labelKey)}</div>
            {sub && (
              <div className="text-slate-500 text-[10px] mt-0.5">{sub}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
