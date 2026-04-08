import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getAllReportSlugs, getMonthlyReport, formatMonthYear } from "@/lib/reports";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "report" });
  return {
    title: t("index_title"),
    description: t("index_desc"),
    alternates: {
      canonical: `/${locale}/informe`,
      languages: { es: "/es/informe", en: "/en/informe" },
    },
  };
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

export default async function ReportIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "report" });
  const slugs = await getAllReportSlugs();

  const reports = (
    await Promise.all(slugs.map((s) => getMonthlyReport(s)))
  ).filter(Boolean);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-block"
        >
          ← {locale === "en" ? "Home" : "Inicio"}
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">
          {t("index_title")}
        </h1>
        <p className="text-slate-400 mb-8">{t("index_desc")}</p>

        <div className="space-y-4">
          {reports.map((r) => {
            if (!r) return null;
            const monthYear = formatMonthYear(r.month, r.year, locale);
            return (
              <Link
                key={r.slug}
                href={`/informe/${r.slug}`}
                className="block bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-600/50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {monthYear}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {r.avg_sqm.toLocaleString(
                        locale === "en" ? "en-GB" : "es-ES"
                      )}{" "}
                      €/m² ·{" "}
                      {r.total_listings.toLocaleString(
                        locale === "en" ? "en-GB" : "es-ES"
                      )}{" "}
                      {locale === "en" ? "listings" : "anuncios"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-bold ${trendColor(r.market_change_pct)}`}
                    >
                      {fmtPct(r.market_change_pct)}
                    </span>
                    <span className="text-slate-500 text-xl">→</span>
                  </div>
                </div>
                {r.top_risers.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    📈 {r.top_risers[0].name} ({fmtPct(r.top_risers[0].change_pct)})
                    {r.top_risers[1] && ` · ${r.top_risers[1].name} (${fmtPct(r.top_risers[1].change_pct)})`}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {reports.length === 0 && (
          <p className="text-slate-500 text-center py-10">{t("no_data")}</p>
        )}

        <div className="mt-10">
          <Footer generatedAt={reports[0]?.generated_at ?? new Date().toISOString()} />
        </div>
      </div>
    </main>
  );
}
