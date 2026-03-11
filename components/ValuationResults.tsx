"use client";

import Link from "next/link";
import type { ValuationResponse } from "@/lib/valuation";
import { fmtEur, fmtEurSqm } from "@/lib/utils";
import { toBarrioSlug } from "@/lib/barrios";

interface Props {
  result: ValuationResponse;
  distrito: string;
  barrio: string;
  sizeSqm: number;
}

export default function ValuationResults({
  result,
  distrito,
  barrio,
  sizeSqm,
}: Props) {
  const { estimated_price, lower_bound, upper_bound, price_per_sqm, confidence_pct, adjustments, base_price, model_info } = result;

  return (
    <div className="space-y-6">
      {/* ── Main estimate ─────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-slate-800/60 border border-cyan-500/20 p-6 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
          Precio estimado
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-white">
          {fmtEur(estimated_price)}
        </p>
        <p className="text-cyan-400 text-sm mt-1">{fmtEurSqm(price_per_sqm)}</p>
      </div>

      {/* ── Confidence band ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">
            Mínimo (P10)
          </p>
          <p className="text-slate-300 font-semibold text-lg">
            {fmtEur(lower_bound)}
          </p>
        </div>
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3">
          <p className="text-cyan-400 text-[10px] uppercase tracking-wider">
            Estimación
          </p>
          <p className="text-white font-bold text-lg">
            {fmtEur(estimated_price)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">
            Máximo (P90)
          </p>
          <p className="text-slate-300 font-semibold text-lg">
            {fmtEur(upper_bound)}
          </p>
        </div>
      </div>

      {/* ── Visual range bar ──────────────────────────── */}
      <div className="px-2">
        <div className="relative h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="absolute inset-y-0 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
            style={{
              left: "10%",
              right: "10%",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-cyan-500"
            style={{ left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>{fmtEur(lower_bound)}</span>
          <span>Dispersión: ±{(confidence_pct / 2).toFixed(1)}%</span>
          <span>{fmtEur(upper_bound)}</span>
        </div>
      </div>

      {/* ── Adjustments breakdown ─────────────────────── */}
      {adjustments.length > 0 && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-4">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">
            Desglose de ajustes
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Precio base (modelo IA)</span>
              <span className="text-slate-300">{fmtEur(base_price)}</span>
            </div>
            {adjustments.map((adj, i) => (
              <div
                key={i}
                className="flex justify-between text-sm text-slate-400"
              >
                <span>
                  {adj.label}{" "}
                  <span
                    className={
                      adj.pct > 0 ? "text-emerald-400" : "text-red-400"
                    }
                  >
                    ({adj.pct > 0 ? "+" : ""}
                    {adj.pct.toFixed(0)}%)
                  </span>
                </span>
                <span
                  className={
                    adj.eur > 0 ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {adj.eur > 0 ? "+" : ""}
                  {fmtEur(adj.eur)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-slate-300">Total estimado</span>
              <span className="text-white">{fmtEur(estimated_price)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Model info ────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        {model_info.training_samples > 0 && (
          <span>
            Basado en {model_info.training_samples.toLocaleString("es-ES")}{" "}
            propiedades
          </span>
        )}
        {model_info.r2 != null && <span>R² = {model_info.r2.toFixed(3)}</span>}
        {model_info.mape != null && (
          <span>Error medio: {model_info.mape.toFixed(1)}%</span>
        )}
      </div>

      {/* ── Links ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/barrio/${toBarrioSlug(barrio)}`}
          className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
        >
          Ver datos de {barrio} →
        </Link>
      </div>

      {/* ── Disclaimer ────────────────────────────────── */}
      <p className="text-slate-600 text-[10px] leading-relaxed">
        Esta valoración es meramente orientativa y no constituye una tasación
        oficial. Se basa en un modelo estadístico entrenado con anuncios
        publicados en portales inmobiliarios. Para una tasación homologada,
        contacta con un tasador certificado.
      </p>
    </div>
  );
}
