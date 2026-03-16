"use client";

import type { Indicator } from "@/lib/types";
import { fmtEur } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  indicator: Indicator;
}

const SEVERITY_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  affordable:             { bar: "bg-green-500",  badge: "bg-green-500/20 text-green-400", text: "text-green-400" },
  strained:               { bar: "bg-yellow-500", badge: "bg-yellow-500/20 text-yellow-400", text: "text-yellow-400" },
  overburdened:           { bar: "bg-orange-500",  badge: "bg-orange-500/20 text-orange-400", text: "text-orange-400" },
  severely_overburdened:  { bar: "bg-red-500",    badge: "bg-red-500/20 text-red-400", text: "text-red-400" },
};

export default function RentBurden({ indicator }: Props) {
  const t = useTranslations("rent_burden");
  const locale = useLocale();

  const burden = indicator.current;
  const medianRent = indicator.median_rent;
  const incomeRef = indicator.monthly_income_ref;
  const severity = indicator.severity ?? "strained";
  const byDistrict = indicator.by_district ?? [];

  if (!burden) return null;

  const colors = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.strained;

  // Cap bar width at 100% for display
  const barWidth = Math.min(burden, 100);

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          🏠 {t("title")}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
          {t(`severity.${severity}`)}
        </span>
      </div>

      {/* Main stat */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-3xl font-bold ${colors.text}`}>
          {burden}%
        </span>
        <span className="text-slate-400 text-xs">
          {t("of_income")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bar} transition-all`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Reference data */}
      <div className="flex justify-between text-xs text-slate-400 mb-4">
        <span>{t("median_rent")}: {fmtEur(medianRent, locale)}</span>
        <span>{t("ref_income")}: {fmtEur(incomeRef, locale)}</span>
      </div>

      {/* Threshold legend */}
      <div className="flex gap-2 text-[10px] text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          ≤30%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          30–40%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          40–50%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          &gt;50%
        </span>
      </div>

      {/* Per-district breakdown (top 5 + bottom 3) */}
      {byDistrict.length > 0 && (
        <div>
          <h4 className="text-slate-400 text-xs font-medium mb-2">{t("by_district")}</h4>
          <div className="space-y-1.5">
            {byDistrict.slice(0, 5).map((d) => {
              const dc = SEVERITY_COLORS[d.severity] ?? SEVERITY_COLORS.strained;
              const w = Math.min(d.burden_pct, 100);
              return (
                <div key={d.distrito} className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 w-28 truncate">{d.distrito}</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dc.bar}`} style={{ width: `${w}%` }} />
                  </div>
                  <span className={`text-xs font-medium w-12 text-right ${dc.text}`}>
                    {d.burden_pct}%
                  </span>
                </div>
              );
            })}
            {byDistrict.length > 5 && (
              <>
                <div className="text-center text-slate-600 text-[10px]">···</div>
                {byDistrict.slice(-3).map((d) => {
                  const dc = SEVERITY_COLORS[d.severity] ?? SEVERITY_COLORS.strained;
                  const w = Math.min(d.burden_pct, 100);
                  return (
                    <div key={d.distrito} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 w-28 truncate">{d.distrito}</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dc.bar}`} style={{ width: `${w}%` }} />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${dc.text}`}>
                        {d.burden_pct}%
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
