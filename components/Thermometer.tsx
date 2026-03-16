"use client";

import { scoreColor } from "@/lib/utils";
import type { MarketScore } from "@/lib/types";
import { useTranslations } from "next-intl";

interface Props {
  score: MarketScore;
}

const CX = 110;
const CY = 108;
const R  = 90;

/**
 * Convert a gauge percentage (0=BAJISTA/left, 1=ALCISTA/right) to an SVG point.
 * Gauge maps: 0% → 180° (left end), 100% → 0° (right end), top = 90°.
 * SVG has Y increasing downward, so we negate sin.
 */
function gaugePoint(pct: number) {
  const deg = 180 - pct * 180;           // 0%→180°, 100%→0°
  const rad = (deg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY - R * Math.sin(rad),            // minus: SVG Y-axis is flipped
  };
}

/**
 * SVG arc from pctStart to pctEnd (fractions 0–1 along the gauge).
 * sweep=1 = clockwise in SVG screen space = goes upward through the top of the arc.
 */
function arcPath(pctStart: number, pctEnd: number): string {
  const s = gaugePoint(pctStart);
  const e = gaugePoint(pctEnd);
  const spanDeg = Math.abs(pctEnd - pctStart) * 180;
  const largeArc = spanDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export default function Thermometer({ score }: Props) {
  const t = useTranslations("thermometer");
  const value = Math.max(0, Math.min(100, score.score ?? 50));
  const pct   = value / 100;
  const color = scoreColor(value);
  const needle = gaugePoint(pct);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-[300px]">

        {/* Background arc: full gauge (left → right) */}
        <path
          d={arcPath(0, 0.9999)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Value arc: left → current score */}
        {pct > 0.005 && (
          <path
            d={arcPath(0, pct)}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}

        {/* Needle dot at score position */}
        <circle cx={needle.x} cy={needle.y} r="7"  fill={color} />
        <circle cx={needle.x} cy={needle.y} r="3"  fill="#0a0f1a" />

        {/* Score */}
        <text
          x={CX} y={CY - 8}
          textAnchor="middle"
          fill="white"
          style={{ fontSize: "38px", fontWeight: 700, fontFamily: "Inter, sans-serif" }}
        >
          {value.toFixed(0)}
        </text>
        <text
          x={CX} y={CY + 14}
          textAnchor="middle"
          fill="#64748b"
          style={{ fontSize: "11px", fontFamily: "Inter, sans-serif" }}
        >
          {t("out_of")}
        </text>

        {/* Labels */}
        <text x="4"   y="124" fill="#f87171" style={{ fontSize: "9px", fontFamily: "Inter, sans-serif" }}>{t("bearish")}</text>
        <text x="172" y="124" fill="#34d399" style={{ fontSize: "9px", fontFamily: "Inter, sans-serif" }}>{t("bullish")}</text>
      </svg>

      <div className="mt-1 text-center">
        <span
          className="inline-block rounded-full px-4 py-1 text-sm font-semibold"
          style={{ backgroundColor: color + "22", color }}
        >
          {score.emoji} {score.label}
        </span>
        <p className="mt-2 text-xs text-slate-400 max-w-[260px]">
          {score.description}
        </p>
      </div>
    </div>
  );
}
