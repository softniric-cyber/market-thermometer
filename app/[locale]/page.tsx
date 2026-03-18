import { readFile } from "fs/promises";
import { join } from "path";
import type { MetricsData } from "@/lib/types";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { fmtDate } from "@/lib/utils";
import Thermometer from "@/components/Thermometer";
import KpiCards from "@/components/KpiCards";
import DistrictTable from "@/components/DistrictTable";
import PriceTrendChart from "@/components/PriceTrendChart";
import AlertsBanner from "@/components/AlertsBanner";
import RentalYields from "@/components/RentalYields";
import NewPostBanner from "@/components/NewPostBanner";
import NewsSection from "@/components/NewsSection";
import type { NewsItem } from "@/components/NewsSection";
import Footer from "@/components/Footer";
import { getAllBlogPosts } from "@/lib/blog/registry";

// ISR: revalidar cada hora (3600s). Vercel sirve HTML cacheado
// y lo regenera en background cuando expira.
export const revalidate = 3600;

async function getMetrics(): Promise<MetricsData | null> {
  try {
    const filePath = join(process.cwd(), "public", "metrics.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

async function getNews(): Promise<NewsItem[]> {
  try {
    const filePath = join(process.cwd(), "content", "news.json");
    const raw = await readFile(filePath, "utf-8");
    const items = JSON.parse(raw) as NewsItem[];
    // Sort newest first, take top 3
    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  } catch {
    return [];
  }
}

export default async function Home({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });
  const tc = await getTranslations({
    locale: params.locale,
    namespace: "common",
  });
  const data = await getMetrics();
  const news = await getNews();
  const allPosts = await getAllBlogPosts(params.locale);
  // Only show MDX posts in the banner (exclude auto-generated data posts)
  const latestMdxPost = allPosts.find((p) => p.type === "mdx") ?? null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="text-white text-lg font-semibold mb-2">
            {tc("madrid")} — {tc("data_not_available")}
          </h1>
          <p className="text-slate-400 text-sm">
            {tc("try_later")}
          </p>
        </div>
      </div>
    );
  }

  const medianSqm = data.zones.length
    ? Math.round(
        data.zones.reduce((s, z) => s + (z.price_per_sqm ?? 0), 0) /
          data.zones.filter((z) => z.price_per_sqm).length
      )
    : null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col items-center mb-10 animate-fade-in">
        <img
          src="/logo.png"
          alt="madridhome.tech — El termómetro del mercado inmobiliario de Madrid"
          className="h-40 sm:h-52 w-auto"
        />
      </header>

      {/* H1 SEO — visible pero discreto */}
      <h1 className="text-center text-slate-300 text-base sm:text-lg font-medium -mt-6 mb-1">
        {tc("madrid")} — {t("price_history")}
      </h1>
      <p className="text-center text-slate-500 text-sm mb-8">
        {tc("data_updated_on", {
          date: fmtDate(data.metadata.generated_at, params.locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        })}
        {medianSqm && (
          <>
            {" · "}
            Mediana:{" "}
            <strong className="text-slate-400">
              {medianSqm.toLocaleString(
                params.locale === "en" ? "en-GB" : "es-ES"
              )}{" "}
              €/m²
            </strong>
          </>
        )}
      </p>

      {/* Thermometer + Score */}
      <section className="flex justify-center mb-10 animate-fade-in animate-delay-1">
        <Thermometer score={data.market_score} />
      </section>

      {/* New post banner */}
      {latestMdxPost && (
        <NewPostBanner slug={latestMdxPost.slug} title={latestMdxPost.title} />
      )}

      {/* KPI Cards */}
      <section className="mb-8 animate-fade-in animate-delay-2">
        <KpiCards
          indicators={data.indicators}
          macro={data.macro}
          dbStats={{ ...data.db_stats, price_drop_stats: data.price_drop_stats }}
        />
      </section>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section className="mb-8 animate-fade-in animate-delay-3">
          <AlertsBanner alerts={data.alerts} />
        </section>
      )}

      {/* Charts + Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Price Trend Chart */}
        <section className="animate-fade-in animate-delay-3">
          <h2 className="text-white font-semibold text-sm mb-3">
            {t("price_history")}
          </h2>
          <PriceTrendChart data={data.trends.market} />
        </section>

        {/* News */}
        {news.length > 0 && (
          <section className="animate-fade-in animate-delay-4">
            <NewsSection news={news} />
          </section>
        )}

        {/* Rental Yields */}
        <section className="animate-fade-in animate-delay-4">
          <h2 className="text-white font-semibold text-sm mb-3">
            {t("rental_by_barrio")}
          </h2>
          <RentalYields yields={data.rental_yields} />
        </section>

      </div>

      {/* District Table */}
      <section className="mb-8 animate-fade-in animate-delay-4">
        <h2 className="text-white font-semibold text-sm mb-3">
          {t("avg_by_district")}
        </h2>
        <DistrictTable zones={data.zones} />
      </section>

      {/* Tasador CTA */}
      <section className="mb-6">
        <Link
          href="/tasar"
          className="block rounded-xl bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border border-cyan-500/30 px-6 py-5 hover:from-cyan-600/30 hover:to-cyan-500/20 transition-all group"
        >
          <p className="text-white font-semibold text-base group-hover:text-cyan-300 transition-colors">
            {t("tasador_cta_title")}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {t("tasador_cta_subtitle")}
          </p>
        </Link>
      </section>

      {/* Blog + FAQ links */}
      <section className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/blog"
          className="inline-block px-5 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-slate-200 text-sm hover:bg-cyan-500/20 hover:text-white transition-colors"
        >
          {t("blog_link")}
        </Link>
        <Link
          href="/preguntas-frecuentes"
          className="inline-block px-5 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          {t("faq_link")}
        </Link>
      </section>

      {/* Footer */}
      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
