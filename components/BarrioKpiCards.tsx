"use client";

import type { BarrioMetrics } from "@/lib/barrios";
import { fmtEur, fmtEurSqm, fmtNum, fmtPct } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  metrics: BarrioMetrics;
}

interface KpiCard {
  labelKey: string;
  value: string;
  sub?: string;
  color: string;
}

export default function BarrioKpiCards({ metrics }: Props) {
  const t = useTranslations("barrio");
  const locale = useLocale();
  const { data, madridAvgSqm, notarialGap } = metrics;

  const sqm = data?.price_per_sqm ?? null;
  const sqmVsMadrid =
    sqm && madridAvgSqm
      ? Math.round(((sqm - madridAvgSqm) / madridAvgSqm) * 100)
      : null;

  const cards: KpiCard[] = [
    {
      labelKey: "price_median",
      value: data?.median_price ? fmtEur(data.median_price, locale) : "—",
      sub: data?.avg_rooms ? t("rooms_size", { rooms: data.avg_rooms.toFixed(1), size: data.avg_size_sqm?.toFixed(0) ?? "—" }) : undefined,
      color: "text-cyan-300",
    },
    {
      labelKey: "price_per_sqm",
      value: sqm ? fmtEurSqm(sqm, locale) : "—",
      sub:
        sqmVsMadrid !== null
          ? t("vs_madrid_avg", { pct: `${sqmVsMadrid > 0 ? "+" : ""}${sqmVsMadrid}` })
          : undefined,
      color: "text-indigo-300",
    },
    {
      labelKey: "active_properties",
      value: fmtNum(data?.active_count ?? null, locale),
      sub: undefined,
      color: "text-slate-300",
    },
    {
      labelKey: "days_in_market",
      value: data?.avg_days_market != null ? `${data.avg_days_market}${t("days_suffix")}` : "—",
      sub: undefined,
      color: "text-amber-300",
    },
    ...(data?.gross_yield != null
      ? [
          {
            labelKey: "rental_yield",
            value: `${data.gross_yield.toFixed(1)}%`,
            sub: data.rent_median
              ? t("median_rent", { amount: fmtEur(data.rent_median, locale) })
              : undefined,
            color: "text-emerald-300",
          } satisfies KpiCard,
        ]
      : []),
    ...(notarialGap?.notarial_price != null
      ? [
          {
            labelKey: "notarial_price",
            value: fmtEurSqm(notarialGap.notarial_price, locale),
            sub: t("notarial_price_desc"),
            color: "text-orange-300",
          } satisfies KpiCard,
        ]
      : []),
    ...(notarialGap?.gap_pct != null
      ? [
          {
            labelKey: "notarial_gap",
            value: fmtPct(notarialGap.gap_pct, 1, locale),
            sub: t("gap_description"),
            color: "text-rose-300",
          } satisfies KpiCard,
        ]
      : []),
  ];

  return (
    <div className={`grid gap-3 ${cards.length >= 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
      {cards.map((card) => (
        <div
          key={card.labelKey}
          className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
        >
          <p className="text-slate-400 text-xs mb-1">{t(card.labelKey)}</p>
          <p className={`font-mono font-semibold text-lg ${card.color}`}>
            {card.value}
          </p>
          {card.sub && (
            <p className="text-slate-500 text-[10px] mt-0.5">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
