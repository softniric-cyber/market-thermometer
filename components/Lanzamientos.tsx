"use client";

import type { Indicator } from "@/lib/types";
import { useTranslations } from "next-intl";

interface Props {
  indicator: Indicator;
}

interface QuarterPoint {
  label: string;
  total: number;
  alquiler: number;
  hipoteca: number;
  otros: number;
}

export default function Lanzamientos({ indicator }: Props) {
  const t = useTranslations("lanzamientos");

  const total        = indicator.current;
  const quarterLabel = indicator.quarter_label;
  const alquiler     = indicator.alquiler ?? 0;
  const hipoteca     = indicator.hipoteca ?? 0;
  const otros        = indicator.otros    ?? 0;
  const alqPct       = indicator.alquiler_pct;
  const yoyChgPct    = indicator.yoy_change_pct;
  const yoyChg       = indicator.yoy_change;

  const series = (indicator.series ?? []) as unknown as QuarterPoint[];

  if (!total) return null;

  // YoY badge
  const yoyPositive = yoyChgPct !== null && yoyChgPct !== undefined && yoyChgPct > 5;
  const yoyNegative = yoyChgPct !== null && yoyChgPct !== undefined && yoyChgPct < -5;
  const yoyColor = yoyPositive
    ? "bg-red-500/20 text-red-400"
    : yoyNegative
    ? "bg-green-500/20 text-green-400"
    : "bg-slate-500/20 text-slate-400";
  const yoyLabel = yoyPositive
    ? t("yoy_up")
    : yoyNegative
    ? t("yoy_down")
    : t("yoy_stable");

  // Chart: find max for bar scaling
  const maxTotal = series.length
    ? Math.max(...series.map((p) => p.total ?? 0))
    : total;

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          ⚖️ {t("title")}
        </h3>
        {yoyChgPct !== null && yoyChgPct !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${yoyColor}`}>
            {yoyChgPct > 0 ? "+" : ""}{yoyChgPct}% {yoyLabel}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-[10px] mb-4">{t("subtitle")}</p>

      {/* Latest quarter summary */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-white">{total.toLocaleString()}</span>
        <span className="text-slate-400 text-xs">{t("total")}</span>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        {t("latest_quarter")}: <span className="text-slate-300">{quarterLabel}</span>
        {yoyChg !== null && yoyChg !== undefined && (
          <span className={`ml-2 ${yoyPositive ? "text-red-400" : yoyNegative ? "text-green-400" : "text-slate-400"}`}>
            ({yoyChg > 0 ? "+" : ""}{yoyChg} {t("yoy_label")})
          </span>
        )}
      </p>

      {/* Breakdown pills */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-lg bg-slate-700/50 p-2 text-center">
          <div className="text-orange-400 text-base font-bold">{alquiler.toLocaleString()}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{t("alquiler")}</div>
          {alqPct && (
            <div className="text-slate-500 text-[10px]">{alqPct}%</div>
          )}
        </div>
        <div className="rounded-lg bg-slate-700/50 p-2 text-center">
          <div className="text-blue-400 text-base font-bold">{hipoteca.toLocaleString()}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{t("hipoteca")}</div>
        </div>
        <div className="rounded-lg bg-slate-700/50 p-2 text-center">
          <div className="text-slate-300 text-base font-bold">{otros.toLocaleString()}</div>
          <div className="text-slate-400 text-[10px] mt-0.5">{t("otros")}</div>
        </div>
      </div>

      {/* Quarterly bar chart */}
      {series.length > 0 && (
        <div>
          <h4 className="text-slate-400 text-xs font-medium mb-3">{t("chart_title")}</h4>
          <div className="flex items-end gap-1" style={{ height: "80px" }}>
            {series.map((pt) => {
              const heightPct = maxTotal > 0 ? Math.round((pt.total / maxTotal) * 100) : 0;
              const alqH = maxTotal > 0 ? Math.round((pt.alquiler / maxTotal) * 100) : 0;
              const hipH = maxTotal > 0 ? Math.round((pt.hipoteca / maxTotal) * 100) : 0;
              const otrosH = heightPct - alqH - hipH;
              const isLatest = pt.label === quarterLabel;

              return (
                <div
                  key={pt.label}
                  className="flex-1 flex flex-col justify-end gap-0 group relative"
                  title={`${pt.label}: ${pt.total} (${t("alquiler")}: ${pt.alquiler})`}
                >
                  {/* Stacked bar: otros / hipoteca / alquiler (bottom) */}
                  <div
                    className="w-full rounded-t-sm bg-slate-500/60"
                    style={{ height: `${Math.max(otrosH, 0)}%` }}
                  />
                  <div
                    className="w-full bg-blue-500/70"
                    style={{ height: `${Math.max(hipH, 0)}%` }}
                  />
                  <div
                    className={`w-full rounded-b-sm ${isLatest ? "bg-orange-400" : "bg-orange-500/60"}`}
                    style={{ height: `${Math.max(alqH, 0)}%` }}
                  />
                  {/* Quarter label below */}
                  <div
                    className={`text-center text-[8px] mt-1 truncate ${
                      isLatest ? "text-slate-200 font-medium" : "text-slate-600"
                    }`}
                  >
                    {pt.label.replace("20", "").replace(" T", "T")}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-3 text-[10px] text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-orange-500/60 inline-block" />
              {t("alquiler")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-500/70 inline-block" />
              {t("hipoteca")}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-slate-500/60 inline-block" />
              {t("otros")}
            </span>
          </div>
        </div>
      )}

      {/* Source */}
      <p className="text-slate-600 text-[9px] mt-4">{t("source")}</p>
    </div>
  );
}
