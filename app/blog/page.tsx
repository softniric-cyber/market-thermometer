import type { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog/registry";
import Breadcrumb from "@/components/Breadcrumb";
import PostCard from "@/components/blog/PostCard";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Mercado inmobiliario Madrid",
  description:
    "Informes semanales, rankings de distritos y análisis del mercado inmobiliario de Madrid con datos actualizados a diario.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Mercado inmobiliario Madrid | madridhome.tech",
    description:
      "Artículos y análisis sobre el mercado inmobiliario madrileño.",
    url: "https://madridhome.tech/blog",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllBlogPosts();

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
          Blog del mercado inmobiliario de Madrid
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Informes, rankings y análisis con datos actualizados a diario
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
          No hay artículos disponibles todavía.
        </p>
      )}

      <Footer generatedAt={new Date().toISOString()} />
    </main>
  );
}
