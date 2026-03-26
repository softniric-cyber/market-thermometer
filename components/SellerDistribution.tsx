"use client";

import { useTranslations, useLocale } from "next-intl";

interface DistrictSeller {
  distrito: string;
  total: number;
  particular_pct: number;
  professional_pct: number;
}

interface SellerStats {
  total: number;
  particular: number;
  professional: number;
  other: number;
  particular_pct: number;
  professional_pct: number;
  other_pct: number;
  by_district?: DistrictSeller[];
}

interface Props {
  stats: SellerStats;
  /** If set, highlight this district in the breakdown */
  filterDistrito?: string;
}

export default function SellerDistribution({ stats, filterDistrito }: Props) {
  const t = useTranslations("seller");
  const locale = useLocale();

  const fmtNum = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-GB" : "es-ES", {
      maximumFractionDigits: 0,
    });

  // If filtering by district, use that district's data
  const districtData = filterDistrito
    ? stats.by_district?.find((d) => d.distrito === filterDistrito)
    : null;

  const particularPct = districtData?.particular_pct ?? stats.particular_pct;
  const professionalPct = districtData?.professional_pct ?? stats.professional_pct;
  const otherPct = districtData
    ? Math.max(0, 100 - particularPct - professionalPct)
    : stats.other_pct;

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
      {/* Stacked bar */}
      <div className="h-6 flex rounded-full overflow-hidden mb-4">
        {particularPct > 0 && (
          <div
            className="bg-emerald-500 transition-all relative group"
            style={{ width: `${particularPct}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {particularPct.toFixed(1)}%
            </span>
          </div>
        )}
        {professionalPct > 0 && (
          <div
            className="bg-cyan-500 transition-all relative group"
            style={{ width: `${professionalPct}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {professionalPct.toFixed(1)}%
            </span>
          </div>
        )}
        {otherPct > 0 && (
          <div
            className="bg-slate-600 transition-all relative group"
            style={{ width: `${otherPct}%` }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {otherPct.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Legend + numbers */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-400 text-xs">{t("particular")}</span>
          </div>
          <div className="text-white font-semibold text-lg">
            {particularPct.toFixed(1)}%
          </div>
          {!filterDistrito && (
            <div className="text-slate-500 text-xs">
              {fmtNum(stats.particular)} {t("listings")}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <span className="text-slate-400 text-xs">{t("professional")}</span>
          </div>
          <div className="text-white font-semibold text-lg">
            {professionalPct.toFixed(1)}%
          </div>
          {!filterDistrito && (
            <div className="text-slate-500 text-xs">
              {fmtNum(stats.professional)} {t("listings")}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
            <span className="text-slate-400 text-xs">{t("other")}</span>
          </div>
          <div className="text-white font-semibold text-lg">
            {otherPct.toFixed(1)}%
          </div>
          {!filterDistrito && (
            <div className="text-slate-500 text-xs">
              {fmtNum(stats.other)} {t("listings")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
