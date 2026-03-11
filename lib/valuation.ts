/* ── Valuation API client & types ──────────────────────────── */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.madridhome.tech";

/* ── Input ─────────────────────────────────────────────────── */
export interface PropertyInput {
  distrito: string;
  barrio: string;
  size_sqm: number;
  rooms: number;
  floor: string;
  has_elevator: boolean;
  is_exterior: boolean;
  has_terrace: boolean;
  has_garage: boolean;
  condition: string; // sin_reformar | reformado | obra_nueva
  energy_cert: string | null;
}

/* ── Output ────────────────────────────────────────────────── */
export interface AdjustmentDetail {
  label: string;
  pct: number;
  eur: number;
}

export interface ValuationResponse {
  estimated_price: number;
  lower_bound: number;
  upper_bound: number;
  price_per_sqm: number;
  confidence_pct: number;
  adjustments: AdjustmentDetail[];
  base_price: number;
  model_info: {
    r2: number | null;
    mae: number | null;
    mape: number | null;
    training_samples: number;
    training_date: string | null;
  };
}

/* ── Fetch ─────────────────────────────────────────────────── */
export async function fetchValuation(
  input: PropertyInput
): Promise<ValuationResponse> {
  const res = await fetch(`${API_URL}/api/valorar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Error ${res.status}`);
  }

  return res.json();
}

/* ── Constants shared between form components ─────────────── */
export const FLOOR_OPTIONS = [
  "Bajo",
  "Entreplanta",
  "1ª Planta",
  "2ª Planta",
  "3ª Planta",
  "4ª Planta",
  "5ª Planta",
  "6ª Planta",
  "7ª+ Planta",
  "Ático",
] as const;

export const CONDITION_OPTIONS = [
  { value: "sin_reformar", label: "Sin reformar" },
  { value: "reformado", label: "Reformado" },
  { value: "obra_nueva", label: "Obra nueva" },
] as const;

export const ENERGY_OPTIONS = ["A", "B", "C", "D", "E", "F", "G"] as const;

export const DEFAULT_INPUT: PropertyInput = {
  distrito: "",
  barrio: "",
  size_sqm: 80,
  rooms: 2,
  floor: "1ª Planta",
  has_elevator: true,
  is_exterior: true,
  has_terrace: false,
  has_garage: false,
  condition: "sin_reformar",
  energy_cert: null,
};
