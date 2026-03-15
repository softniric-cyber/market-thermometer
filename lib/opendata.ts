import { readFile } from "fs/promises";
import { join } from "path";

/* ── Interfaces ─────────────────────────────────────────────── */

export interface OpenDataProfile {
  poblacion?: number | null;
  edad_media?: number | null;
  pct_extranjeros?: number | null;
  densidad_hab_ha?: number | null;
  renta_media_hogar?: number | null;
  renta_media_persona?: number | null;
  pct_estudios_superiores?: number | null;
  tamano_medio_hogar?: number | null;
  tasa_natalidad?: number | null;
}

export interface BarrioOpenDataProfile extends OpenDataProfile {
  distrito: string;
}

export interface OpenDataRoot {
  metadata: {
    source: string;
    url: string;
    year: number;
    generated_at: string;
  };
  distritos: Record<string, OpenDataProfile>;
  barrios: Record<string, BarrioOpenDataProfile>;
}

/* ── Loader ──────────────────────────────────────────────────── */

let _cache: OpenDataRoot | null = null;

async function loadOpenData(): Promise<OpenDataRoot | null> {
  if (_cache) return _cache;
  try {
    const filePath = join(process.cwd(), "public", "district_opendata.json");
    const raw = await readFile(filePath, "utf-8");
    _cache = JSON.parse(raw) as OpenDataRoot;
    return _cache;
  } catch {
    return null;
  }
}

/* ── Public API ──────────────────────────────────────────────── */

export async function getDistrictOpenData(
  name: string
): Promise<OpenDataProfile | null> {
  const data = await loadOpenData();
  return data?.distritos[name] ?? null;
}

export async function getBarrioOpenData(
  name: string
): Promise<BarrioOpenDataProfile | null> {
  const data = await loadOpenData();
  return data?.barrios[name] ?? null;
}

export async function getOpenDataYear(): Promise<number | null> {
  const data = await loadOpenData();
  return data?.metadata.year ?? null;
}
