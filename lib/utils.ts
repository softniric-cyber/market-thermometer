type LocaleStr = "es-ES" | "en-GB" | string;

function loc(locale?: string): LocaleStr {
  return locale === "en" ? "en-GB" : "es-ES";
}

/** Format number as euros: 650000 → "650.000 €" */
export function fmtEur(n: number | null | undefined, locale?: string): string {
  if (n == null) return "—";
  return n.toLocaleString(loc(locale), { maximumFractionDigits: 0 }) + " €";
}

/** Format as €/m² */
export function fmtEurSqm(n: number | null | undefined, locale?: string): string {
  if (n == null) return "—";
  return n.toLocaleString(loc(locale), { maximumFractionDigits: 0 }) + " €/m²";
}

/** Format percentage: 23.5 → "23,5%" */
export function fmtPct(n: number | null | undefined, decimals = 1, locale?: string): string {
  if (n == null) return "—";
  return n.toLocaleString(loc(locale), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%";
}

/** Format number with thousands separator */
export function fmtNum(n: number | null | undefined, locale?: string): string {
  if (n == null) return "—";
  return n.toLocaleString(loc(locale), { maximumFractionDigits: 0 });
}

/** Relative time: "hace 3 horas" / "3 hours ago" */
export function timeAgo(isoDate: string, locale?: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  const en = locale === "en";

  if (mins < 1) return en ? "just now" : "justo ahora";
  if (mins < 60) return en ? `${mins} min ago` : `hace ${mins} min`;
  if (hours < 24) return en ? `${hours}h ago` : `hace ${hours}h`;
  if (days === 1) return en ? "1 day ago" : "hace 1 día";
  return en ? `${days} days ago` : `hace ${days} días`;
}

/** Format date locale-aware */
export function fmtDate(
  iso: string,
  locale?: string,
  opts?: Intl.DateTimeFormatOptions
): string {
  try {
    return new Date(iso).toLocaleDateString(
      loc(locale),
      opts ?? { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

/** Trend arrow */
export function trendIcon(trend?: string | null): string {
  if (trend === "up") return "▲";
  if (trend === "down") return "▼";
  return "—";
}

/** Trend color class */
export function trendColor(
  trend?: string | null,
  invertGood = false
): string {
  const good = invertGood ? "down" : "up";
  const bad = invertGood ? "up" : "down";
  if (trend === good) return "text-emerald-400";
  if (trend === bad) return "text-red-400";
  return "text-slate-400";
}

/** Score → color for thermometer */
export function scoreColor(score: number | null): string {
  if (score == null) return "#64748b";
  if (score >= 75) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export function scoreBg(score: number | null): string {
  if (score == null) return "bg-slate-700";
  if (score >= 75) return "bg-emerald-500/20";
  if (score >= 40) return "bg-amber-500/20";
  return "bg-red-500/20";
}
