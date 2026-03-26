"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toSlug } from "@/lib/districts";

interface DropOverview {
  total_active: number;
  with_drops: number;
  drop_pct_of_total: number;
  avg_drop_pct: number;
  max_drop_pct: number;
  avg_days_to_drop: number;
  recent_7d: number;
  recent_30d: number;
}

interface BarrioDrop {
  barrio: string;
  distrito: string;
  total: number;
  with_drops: number;
  avg_drop_pct: number;
  max_drop_pct: number;
  drop_rate_pct: number;
}

interface Props {
  overview: DropOverview;
  byBarrio: BarrioDrop[];
  /** If set, only show barrios from this district */
  filterDistrito?: string;
  /** Max barrios to show (default 10) */
  limit?: number;
}

function dropColor(rate: number): string {
  if (rate >= 35) return "bg-red-500";
  if (rate >= 25) return "bg-orange-500";
  if (rate >= 18) return "bg-amber-500";
  return "bg-yellow-500";
}

function dropBgColor(rate: number): string {
  if (rate >= 35) return "bg-red-500/10 border-red-500/20";
  if (rate >= 25) return "bg-orange-500/10 border-orange-500/20";
  if (rate >= 18) return "bg-amber-500/10 border-amber-500/20";
  return "bg-yellow-500/10 border-yellow-500/20";
}

export default function PriceDropZones({
  overview,
  byBarrio,
  filterDistrito,
  limit = 10,
}: Props) {
  const t = useTranslations("drops");
  const locale = useLocale();

  const filtered = filterDistrito
    ? byBarrio.filter((b) => b.distrito === filterDistrito)
    : byBarrio;

  const top = filtered
    .sort((a, b) => b.drop_rate_pct - a.drop_rate_pct)
    .slice(0, limit);

  if (top.length === 0) return null;

  const maxRate = Math.max(...top.map((b) => b.drop_rate_pct));

  const fmtNum = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-GB" : "es-ES", {
      maximumFractionDigits: 0,
    });

  return (
    <div>
      {/* KPI summary cards (only on full view, not district-filtered) */}
      {!filterDistrito && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              icon: "📉",
              value: `${fmtNum(overview.with_drops)} / ${fmtNum(overview.total_active)}`,
              label: t("with_drops"),
              sub: `${overview.drop_pct_of_total.toFixed(1)}%`,
            },
            {
              icon: "✂️",
              value: `${overview.avg_drop_pct.toFixed(1)}%`,
              label: t("avg_drop"),
            },
            {
              icon: "🔥",
              value: fmtNum(overview.recent_7d),
              label: t("recent_7d"),
            },
            {
              icon: "⏳",
              value: `${overview.avg_days_to_drop.toFixed(0)}`,
              label: t("days_to_drop"),
              sub: t("days"),
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3"
            >
              <div className="text-sm mb-1">{kpi.icon}</div>
              <div className="text-white font-semibold text-sm">
                {kpi.value}
                {kpi.sub && (
                  <span className="text-slate-400 font-normal text-xs ml-1">
                    {kpi.sub}
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-xs mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top barrios list */}
      <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/40">
          <h3 className="text-white text-sm font-medium">
            {t("top_barrios")}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {t("subtitle")}
          </p>
        </div>

        <div className="divide-y divide-slate-700/30">
          {top.map((barrio, i) => {
            const barWidth = (barrio.drop_rate_pct / maxRate) * 100;
            const distSlug = toSlug(barrio.distrito);

            return (
              <Link
                key={`${barrio.barrio}-${barrio.distrito}`}
                href={`/distrito/${distSlug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/30 transition-colors group"
              >
                {/* Rank */}
                <span className="text-slate-600 text-xs font-mono w-5 shrink-0 text-right">
                  {i + 1}
                </span>

                {/* Name + district */}
                <div className="min-w-0 w-36 sm:w-44 shrink-0">
                  <div className="text-slate-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                    {barrio.barrio}
                  </div>
                  <div className="text-slate-500 text-xs truncate">
                    {barrio.distrito}
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-slate-700/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dropColor(barrio.drop_rate_pct)} transition-all`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Rate + avg drop */}
                <div className="text-right shrink-0 w-20">
                  <div className="text-emerald-400 text-sm font-semibold">
                    {barrio.drop_rate_pct.toFixed(1)}%
                  </div>
                  <div className="text-slate-500 text-xs">
                    {barrio.avg_drop_pct.toFixed(1)}% {t("avg")}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
