import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import type { MetricsData, ValuationModel, BarrioBaseline } from "@/lib/types";

/* ── Load metrics.json (cached in module scope for the serverless lifetime) */
let _cached: MetricsData | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 min

async function getMetrics(): Promise<MetricsData | null> {
  const now = Date.now();
  if (_cached && now - _cacheTime < CACHE_TTL) return _cached;
  try {
    const raw = await readFile(
      join(process.cwd(), "public", "metrics.json"),
      "utf-8"
    );
    _cached = JSON.parse(raw) as MetricsData;
    _cacheTime = now;
    return _cached;
  } catch {
    return null;
  }
}

/* ── Floor label → numeric ─────────────────────────────────── */
const FLOOR_MAP: Record<string, number> = {
  Bajo: 0,
  Entreplanta: 0.5,
  "1ª Planta": 1,
  "2ª Planta": 2,
  "3ª Planta": 3,
  "4ª Planta": 4,
  "5ª Planta": 5,
  "6ª Planta": 6,
  "7ª+ Planta": 7,
  "Ático": 10,
};

/* ── Input schema ──────────────────────────────────────────── */
interface PropertyInput {
  distrito: string;
  barrio: string;
  size_sqm: number;
  rooms: number;
  floor: string;
  has_elevator: boolean;
  is_exterior: boolean;
  has_terrace: boolean;
  has_garage: boolean;
  condition: string;
  energy_cert: string | null;
}

/* ── Valuation engine (pure math, no sklearn) ─────────────── */
function valuate(input: PropertyInput, model: ValuationModel) {
  const adj = model.adjustments;
  const barrio = model.barrio_baselines[input.barrio] as
    | BarrioBaseline
    | undefined;
  const district = model.district_baselines[input.distrito] as
    | { median_sqm: number; count: number }
    | undefined;

  // Determine base €/m²
  let baseSqm: number;
  let comparablesCount: number;
  let stdSqm: number;
  let source: string;

  if (barrio && barrio.count >= 5) {
    baseSqm = barrio.median_sqm;
    comparablesCount = barrio.count;
    stdSqm = barrio.std_sqm;
    source = "barrio";
  } else if (district) {
    baseSqm = district.median_sqm;
    comparablesCount = district.count;
    stdSqm = baseSqm * 0.2; // estimate 20% std
    source = "distrito";
  } else {
    baseSqm = model.madrid_median_sqm;
    comparablesCount = model.training_samples;
    stdSqm = baseSqm * 0.25;
    source = "madrid";
  }

  // ── Feature adjustments ─────────────────────────
  const adjustments: Array<{ label: string; pct: number; eur: number }> = [];
  let totalMultiplier = 1.0;

  // Floor adjustment (vs avg floor in barrio, default ~2)
  const floorLevel = FLOOR_MAP[input.floor] ?? 1;
  const avgFloor = barrio?.avg_floor ?? 2;
  const floorDiff = floorLevel - avgFloor;
  if (Math.abs(floorDiff) > 0.5) {
    const floorPct = floorDiff * (adj.floor_premium_per_level ?? 0.015);
    totalMultiplier += floorPct;
    adjustments.push({
      label: `Planta (${input.floor})`,
      pct: Math.round(floorPct * 10000) / 100,
      eur: 0, // filled below
    });
  }

  // Elevator — the barrio baseline already includes a mix of lift/no-lift,
  // so we only apply a PENALTY for no elevator on upper floors (where it
  // matters most) rather than a bonus for having one (which is the norm).
  if (!input.has_elevator && floorLevel >= 2) {
    const penaltyPct = -(adj.elevator_premium ?? 0.05);
    totalMultiplier += penaltyPct;
    adjustments.push({
      label: "Sin ascensor (planta alta)",
      pct: Math.round(penaltyPct * 10000) / 100,
      eur: 0,
    });
  }

  // Exterior
  if (input.is_exterior) {
    const extPct = adj.exterior_premium ?? 0.03;
    totalMultiplier += extPct;
    adjustments.push({
      label: "Exterior",
      pct: Math.round(extPct * 10000) / 100,
      eur: 0,
    });
  }

  // Terrace
  if (input.has_terrace) {
    const pct = adj.terrace_premium ?? 0.06;
    totalMultiplier += pct;
    adjustments.push({
      label: "Terraza",
      pct: Math.round(pct * 10000) / 100,
      eur: 0,
    });
  }

  // Garage
  if (input.has_garage) {
    const pct = adj.garage_premium ?? 0.04;
    totalMultiplier += pct;
    adjustments.push({
      label: "Garaje",
      pct: Math.round(pct * 10000) / 100,
      eur: 0,
    });
  }

  // Condition
  if (input.condition === "reformado") {
    const pct = adj.condition_reformado ?? 0.12;
    totalMultiplier += pct;
    adjustments.push({
      label: "Reformado",
      pct: Math.round(pct * 10000) / 100,
      eur: 0,
    });
  } else if (input.condition === "obra_nueva") {
    const pct = adj.condition_obra_nueva ?? 0.18;
    totalMultiplier += pct;
    adjustments.push({
      label: "Obra nueva",
      pct: Math.round(pct * 10000) / 100,
      eur: 0,
    });
  }

  // Energy cert
  if (input.energy_cert) {
    const key = `energy_${input.energy_cert.toUpperCase()}`;
    const pct = adj[key] ?? 0;
    if (Math.abs(pct) > 0.001) {
      totalMultiplier += pct;
      adjustments.push({
        label: `Cert. energética ${input.energy_cert.toUpperCase()}`,
        pct: Math.round(pct * 10000) / 100,
        eur: 0,
      });
    }
  }

  // Rooms adjustment (vs barrio average)
  if (barrio?.avg_rooms) {
    const roomDiff = input.rooms - barrio.avg_rooms;
    if (Math.abs(roomDiff) >= 0.5) {
      const pct = roomDiff * (adj.room_premium_per_unit ?? 0.02);
      totalMultiplier += pct;
      adjustments.push({
        label: `Habitaciones (${input.rooms} vs media ${barrio.avg_rooms.toFixed(1)})`,
        pct: Math.round(pct * 10000) / 100,
        eur: 0,
      });
    }
  }

  // ── Final calculation ───────────────────────────
  const adjustedSqm = baseSqm * totalMultiplier;
  const estimatedPrice = Math.round(adjustedSqm * input.size_sqm);
  const basePrice = Math.round(baseSqm * input.size_sqm);

  // Fill EUR values in adjustments
  for (const a of adjustments) {
    a.eur = Math.round((a.pct / 100) * basePrice);
  }

  // Confidence bands using std deviation
  const coeffOfVar = stdSqm / baseSqm;
  const bandWidth = Math.max(0.08, Math.min(0.25, coeffOfVar * 1.3));
  // Widen if few comparables
  const widthAdjusted =
    comparablesCount < 10 ? bandWidth * 1.3 : bandWidth;

  const lowerBound = Math.round(estimatedPrice * (1 - widthAdjusted));
  const upperBound = Math.round(estimatedPrice * (1 + widthAdjusted));
  const confidencePct = Math.round(widthAdjusted * 200 * 10) / 10;

  return {
    estimated_price: estimatedPrice,
    lower_bound: lowerBound,
    upper_bound: upperBound,
    price_per_sqm: Math.round(adjustedSqm),
    confidence_pct: confidencePct,
    adjustments,
    base_price: basePrice,
    model_info: {
      r2: null,
      mae: null,
      mape: null,
      training_samples: model.training_samples,
      training_date: model.training_date,
      source,
      comparables: comparablesCount,
    },
  };
}

/* ── POST handler ──────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PropertyInput;

    // Basic validation
    if (!body.distrito || !body.barrio || !body.size_sqm) {
      return NextResponse.json(
        { detail: "Faltan campos obligatorios: distrito, barrio, size_sqm" },
        { status: 400 }
      );
    }

    const data = await getMetrics();
    if (!data?.valuation_model) {
      return NextResponse.json(
        { detail: "Modelo de valoración no disponible" },
        { status: 503 }
      );
    }

    const result = valuate(body, data.valuation_model);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { detail: `Error: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 500 }
    );
  }
}
