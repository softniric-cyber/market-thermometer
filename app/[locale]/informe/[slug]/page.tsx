import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import {
  getMonthlyReport,
  getAllReportSlugs,
  formatMonthYear,
} from "@/lib/reports";
import { toSlug } from "@/lib/districts";
import Footer from "@/components/Footer";

export const revalidate = 3600;

/* ── Static params ────────────────────────────────────────────── */
export async function generateStaticParams() {
  const slugs = await getAllReportSlugs();
  return locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

/* ── SEO metadata ─────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "report" });
  const report = await getMonthlyReport(slug);
  if (!report) return {};

  const monthYear = formatMonthYear(report.month, report.year, locale);
  return {
    title: t("page_title", { monthYear }),
    description: t("page_desc", { monthYear }),
    alternates: {
      canonical: `/${locale}/informe/${slug}`,
      languages: { es: `/es/informe/${slug}`, en: `/en/informe/${slug}` },
    },
  };
}

/* ── Helpers ──────────────────────────────────────────────────── */
function fmt(n: number, locale: string): string {
  return n.toLocaleString(locale === "en" ? "en-GB" : "es-ES");
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function trendColor(pct: number | null): string {
  if (pct == null) return "text-slate-400";
  if (pct > 2) return "text-rose-400";
  if (pct > 0) return "text-amber-400";
  if (pct < -2) return "text-emerald-400";
  return "text-sky-400";
}

function trendBg(pct: number | null): string {
  if (pct == null) return "bg-slate-800/50";
  if (pct > 2) return "bg-rose-950/30";
  if (pct > 0) return "bg-amber-950/30";
  return "bg-emerald-950/30";
}

/* ── Page ─────────────────────────────────────────────────────── */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "report" });
  const report = await getMonthlyReport(slug);
  if (!report) notFound();

  const monthYear = formatMonthYear(report.month, report.year, locale);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href="/informe"
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-block"
        >
          {t("back_to_reports")}
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t("heading")}
          </h1>
          <p className="text-xl text-slate-400">
            {t("subtitle", { monthYear })}
          </p>
        </header>

        {/* Market Overview KPIs */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("market_overview")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">{t("avg_sqm")}</p>
              <p className="text-2xl font-bold text-white">
                {fmt(report.avg_sqm, locale)} €/m²
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">{t("mom_change")}</p>
              <p
                className={`text-2xl font-bold ${trendColor(report.market_change_pct)}`}
              >
                {fmtPct(report.market_change_pct)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">
                {t("total_listings")}
              </p>
              <p className="text-2xl font-bold text-white">
                {fmt(report.total_listings, locale)}
              </p>
            </div>
          </div>
        </section>

        {/* Top Risers & Fallers */}
        {report.top_risers.length > 0 && (
          <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                📈 {t("top_risers")}
              </h2>
              <div className="space-y-2">
                {report.top_risers.map((d, i) => (
                  <Link
                    key={d.name}
                    href={`/distrito/${toSlug(d.name)}`}
                    className={`block rounded-lg p-4 border border-slate-700/30 hover:border-cyan-600/50 transition ${trendBg(d.change_pct)}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">
                        {i + 1}. {d.name}
                      </span>
                      <span
                        className={`font-bold ${trendColor(d.change_pct)}`}
                      >
                        {fmtPct(d.change_pct)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {fmt(d.price_per_sqm, locale)} €/m²
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                📉 {t("top_fallers")}
              </h2>
              <div className="space-y-2">
                {report.top_fallers.map((d, i) => (
                  <Link
                    key={d.name}
                    href={`/distrito/${toSlug(d.name)}`}
                    className={`block rounded-lg p-4 border border-slate-700/30 hover:border-cyan-600/50 transition ${trendBg(d.change_pct)}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">
                        {i + 1}. {d.name}
                      </span>
                      <span
                        className={`font-bold ${trendColor(d.change_pct)}`}
                      >
                        {fmtPct(d.change_pct)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {fmt(d.price_per_sqm, locale)} €/m²
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Highlights */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("highlights")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: t("most_expensive"),
                d: report.most_expensive,
                value: `${fmt(report.most_expensive.price_per_sqm, locale)} €/m²`,
                emoji: "💎",
              },
              {
                label: t("cheapest"),
                d: report.cheapest,
                value: `${fmt(report.cheapest.price_per_sqm, locale)} €/m²`,
                emoji: "🏷️",
              },
              {
                label: t("fastest"),
                d: report.fastest_selling,
                value: `${report.fastest_selling.days_to_sell ?? "—"} ${t("days_suffix")}`,
                emoji: "⚡",
              },
              {
                label: t("slowest"),
                d: report.slowest_selling,
                value: `${report.slowest_selling.days_to_sell ?? "—"} ${t("days_suffix")}`,
                emoji: "🐢",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/distrito/${toSlug(item.d.name)}`}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-600/50 transition"
              >
                <p className="text-xs text-slate-400 mb-1">
                  {item.emoji} {item.label}
                </p>
                <p className="font-bold text-white text-sm">{item.d.name}</p>
                <p className="text-xs text-slate-300 mt-1">{item.value}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Full district table */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("district_table_title")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs">
                  <th className="text-left py-3 px-2">{t("district")}</th>
                  <th className="text-right py-3 px-2">{t("price_sqm")}</th>
                  <th className="text-right py-3 px-2">{t("change")}</th>
                  <th className="text-right py-3 px-2">{t("active")}</th>
                  <th className="text-right py-3 px-2">{t("days")}</th>
                </tr>
              </thead>
              <tbody>
                {report.districts.map((d) => (
                  <tr
                    key={d.name}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30"
                  >
                    <td className="py-2.5 px-2">
                      <Link
                        href={`/distrito/${toSlug(d.name)}`}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {d.name}
                      </Link>
                    </td>
                    <td className="text-right py-2.5 px-2 font-medium text-white">
                      {fmt(d.price_per_sqm, locale)}
                    </td>
                    <td
                      className={`text-right py-2.5 px-2 font-medium ${trendColor(d.change_pct)}`}
                    >
                      {fmtPct(d.change_pct)}
                    </td>
                    <td className="text-right py-2.5 px-2 text-slate-300">
                      {fmt(d.active_count, locale)}
                    </td>
                    <td className="text-right py-2.5 px-2 text-slate-300">
                      {d.days_to_sell ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Methodology */}
        <p className="text-xs text-slate-500 border-t border-slate-800 pt-4 mb-10">
          {t("methodology")}
        </p>

        <Footer generatedAt={report.generated_at} />
      </div>
    </main>
  );
}
