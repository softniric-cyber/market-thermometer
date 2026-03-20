import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllNews } from "@/lib/news";
import NewsSection from "@/components/NewsSection";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("news");
  return {
    title: `${t("all_title")} — madridhome.tech`,
    description: t("all_description"),
  };
}

export default async function NoticiasPage() {
  const t = await getTranslations("news");
  const news = await getAllNews();

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-block transition-colors"
        >
          ← {t("back_home")}
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">
          📰 {t("all_title")}
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          {t("all_description")}
        </p>

        <NewsSection news={news} limit={Infinity} showSeeAll={false} />
      </div>
    </main>
  );
}
