import { readFile } from "fs/promises";
import { join } from "path";

/* ── Types ────────────────────────────────────────────────────── */
export interface DistrictSnapshot {
  name: string;
  price_per_sqm: number;
  prev_price_per_sqm: number | null;
  change_pct: number | null;
  median_price: number | null;
  active_count: number;
  days_to_sell: number | null;
}

export interface MonthlyReport {
  slug: string; // "2026-04"
  year: number;
  month: number; // 1-12
  generated_at: string;
  /* Market-level */
  avg_sqm: number;
  prev_avg_sqm: number | null;
  market_change_pct: number | null;
  total_listings: number;
  /* District breakdown */
  districts: DistrictSnapshot[];
  /* Highlights */
  top_risers: DistrictSnapshot[]; // top 3 price increases
  top_fallers: DistrictSnapshot[]; // top 3 price decreases (or smallest increases)
  most_expensive: DistrictSnapshot;
  cheapest: DistrictSnapshot;
  fastest_selling: DistrictSnapshot;
  slowest_selling: DistrictSnapshot;
}

/* ── Helpers ──────────────────────────────────────────────────── */
const REPORTS_DIR = join(process.cwd(), "content", "reports");

export async function getMonthlyReport(
  slug: string
): Promise<MonthlyReport | null> {
  try {
    const raw = await readFile(join(REPORTS_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw) as MonthlyReport;
  } catch {
    return null;
  }
}

export async function getAllReportSlugs(): Promise<string[]> {
  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(REPORTS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse(); // newest first
  } catch {
    return [];
  }
}

export function formatMonthYear(
  month: number,
  year: number,
  locale: string
): string {
  const date = new Date(year, month - 1, 1);
  const formatted = date.toLocaleString(locale === "en" ? "en-GB" : "es-ES", {
    month: "long",
    year: "numeric",
  });
  // Capitalise first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
