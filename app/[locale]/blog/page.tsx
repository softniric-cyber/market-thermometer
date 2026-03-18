import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllBlogPosts } from "@/lib/blog/registry";
import { Link } from "@/i18n/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import PostCard from "@/components/blog/PostCard";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "blog",
  });

  return {
    title: `${t("title")} — madridhome.tech`,
    description: t("subtitle"),
    alternates: {
      canonical: "/blog",
      languages: {
        es: "/es/blog",
        en: "/en/blog",
      },
    },
    openGraph: {
      title: `${t("title")} | madridhome.tech`,
      description: t("subtitle"),
      url: "https://madridhome.tech/blog",
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "blog",
  });

  const posts = await getAllBlogPosts(params.locale);

  // Group by category
  const groups: Record<string, typeof posts> = {};
  for (const p of posts) {
    (groups[p.category] ??= []).push(p);
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: "Blog" }]} />

      <header className="mb-8 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("title")}
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          {t("subtitle")}
        </p>
      </header>

      {Object.entries(groups).map(([category, categoryPosts]) => (
        <section key={category} className="mb-8">
          <h2 className="text-slate-300 font-semibold text-sm mb-3">
            {category}
          </h2>
          <div className="space-y-3">
            {categoryPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}

      {posts.length === 0 && (
        <p className="text-slate-500 text-sm">
          {t("no_articles")}
        </p>
      )}

      <Footer generatedAt={new Date().toISOString()} />
    </main>
  );
}
