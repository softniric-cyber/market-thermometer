"use client";

import { useState, useMemo, useCallback } from "react";
import { BARRIO_LIST } from "@/lib/barrios";
import {
  type PropertyInput,
  type ValuationResponse,
  DEFAULT_INPUT,
  FLOOR_OPTIONS,
  CONDITION_OPTIONS,
  ENERGY_OPTIONS,
  fetchValuation,
} from "@/lib/valuation";
import ValuationResults from "./ValuationResults";

/* ── District → barrios map ───────────────────────────────── */
const DISTRICT_BARRIOS: Record<string, string[]> = {};
const DISTRICTS: string[] = [];

for (const [distrito, barrio] of BARRIO_LIST) {
  if (!DISTRICT_BARRIOS[distrito]) {
    DISTRICT_BARRIOS[distrito] = [];
    DISTRICTS.push(distrito);
  }
  DISTRICT_BARRIOS[distrito].push(barrio);
}
DISTRICTS.sort();

/* ── Component ────────────────────────────────────────────── */
export default function ValuationForm() {
  const [form, setForm] = useState<PropertyInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barrios = useMemo(
    () => (form.distrito ? DISTRICT_BARRIOS[form.distrito] ?? [] : []),
    [form.distrito]
  );

  const set = useCallback(
    <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.distrito || !form.barrio) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchValuation(form);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30";
  const inputClass = selectClass;
  const labelClass = "block text-slate-400 text-xs font-medium mb-1";
  const checkboxLabel =
    "flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none";

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Ubicación ─────────────────────────────────── */}
        <fieldset>
          <legend className="text-slate-300 font-semibold text-sm mb-3">
            Ubicación
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Distrito</label>
              <select
                className={selectClass}
                value={form.distrito}
                onChange={(e) => {
                  set("distrito", e.target.value);
                  set("barrio", "");
                }}
                required
              >
                <option value="">Seleccionar distrito</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Barrio</label>
              <select
                className={selectClass}
                value={form.barrio}
                onChange={(e) => set("barrio", e.target.value)}
                disabled={!form.distrito}
                required
              >
                <option value="">Seleccionar barrio</option>
                {barrios.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── Características principales ────────────────── */}
        <fieldset>
          <legend className="text-slate-300 font-semibold text-sm mb-3">
            Características
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Superficie (m²)</label>
              <input
                type="number"
                className={inputClass}
                value={form.size_sqm}
                onChange={(e) => set("size_sqm", Number(e.target.value))}
                min={10}
                max={1000}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Habitaciones</label>
              <input
                type="number"
                className={inputClass}
                value={form.rooms}
                onChange={(e) => set("rooms", Number(e.target.value))}
                min={0}
                max={15}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Planta</label>
              <select
                className={selectClass}
                value={form.floor}
                onChange={(e) => set("floor", e.target.value)}
              >
                {FLOOR_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select
                className={selectClass}
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ── Extras ────────────────────────────────────── */}
        <fieldset>
          <legend className="text-slate-300 font-semibold text-sm mb-3">
            Extras
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className={checkboxLabel}>
              <input
                type="checkbox"
                checked={form.has_elevator}
                onChange={(e) => set("has_elevator", e.target.checked)}
                className="accent-cyan-500"
              />
              Ascensor
            </label>
            <label className={checkboxLabel}>
              <input
                type="checkbox"
                checked={form.is_exterior}
                onChange={(e) => set("is_exterior", e.target.checked)}
                className="accent-cyan-500"
              />
              Exterior
            </label>
            <label className={checkboxLabel}>
              <input
                type="checkbox"
                checked={form.has_terrace}
                onChange={(e) => set("has_terrace", e.target.checked)}
                className="accent-cyan-500"
              />
              Terraza
            </label>
            <label className={checkboxLabel}>
              <input
                type="checkbox"
                checked={form.has_garage}
                onChange={(e) => set("has_garage", e.target.checked)}
                className="accent-cyan-500"
              />
              Garaje
            </label>
          </div>

          <div className="mt-3 max-w-[200px]">
            <label className={labelClass}>Cert. energética (opcional)</label>
            <select
              className={selectClass}
              value={form.energy_cert ?? ""}
              onChange={(e) =>
                set("energy_cert", e.target.value || null)
              }
            >
              <option value="">Sin especificar</option>
              {ENERGY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* ── Submit ────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading || !form.distrito || !form.barrio}
          className="w-full sm:w-auto px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-colors"
        >
          {loading ? "Calculando..." : "Calcular valoración"}
        </button>
      </form>

      {/* ── Error ─────────────────────────────────────── */}
      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ── Results ───────────────────────────────────── */}
      {result && (
        <div className="mt-8">
          <ValuationResults
            result={result}
            distrito={form.distrito}
            barrio={form.barrio}
            sizeSqm={form.size_sqm}
          />
        </div>
      )}
    </div>
  );
}
