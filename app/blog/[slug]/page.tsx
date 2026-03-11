import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBlogSlugs, getBlogPost, getAllBlogPosts } from "@/lib/blog/registry";
import Breadcrumb from "@/components/Breadcrumb";
import Footer from "@/components/Footer";

export const revalidate = 3600;

/* ── Static params for all blog posts ─────────────────────── */
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

/* ── Dynamic metadata per post ────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} — madridhome.tech`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} — madridhome.tech`,
      description: post.description,
      url: `https://madridhome.tech/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

/* ── JSON-LD Article ──────────────────────────────────────── */
function articleJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    url: `https://madridhome.tech/blog/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "madridhome.tech",
      url: "https://madridhome.tech",
    },
    publisher: {
      "@type": "Organization",
      name: "madridhome.tech",
      url: "https://madridhome.tech",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://madridhome.tech/blog/${post.slug}`,
    },
  };
}

/* ── Page component ───────────────────────────────────────── */
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  // Get other posts for "related" section
  const allPosts = await getAllBlogPosts();
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  const formattedDate = (() => {
    try {
      return new Date(post.publishedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return post.publishedAt;
    }
  })();

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      {/* Header */}
      <header className="mb-8 mt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">
            {post.category}
          </span>
          {post.type === "auto" && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Datos en vivo
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Actualizado el {formattedDate}
        </p>
      </header>

      {/* Post content */}
      <article
        className="prose prose-invert prose-sm max-w-none
          prose-headings:text-slate-200 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-100
          prose-table:border-collapse prose-table:w-full
          prose-th:text-left prose-th:text-slate-400 prose-th:text-xs prose-th:font-medium prose-th:uppercase prose-th:tracking-wider prose-th:py-2 prose-th:px-3 prose-th:border-b prose-th:border-slate-700
          prose-td:text-slate-300 prose-td:text-sm prose-td:py-2 prose-td:px-3 prose-td:border-b prose-td:border-slate-800
          prose-ul:text-slate-300 prose-li:text-slate-300
          prose-em:text-slate-400"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-slate-800">
          <h2 className="text-slate-300 font-semibold text-sm mb-4">
            Otros artículos
          </h2>
          <div className="space-y-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="block rounded-lg bg-slate-800/40 border border-slate-700/40 px-4 py-3 hover:bg-slate-700/40 hover:border-cyan-500/30 transition-all"
              >
                <p className="text-slate-200 text-sm font-medium">
                  {r.title}
                </p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-1">
                  {r.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors"
        >
          ← Volver al blog
        </Link>
      </div>

      <Footer generatedAt={post.publishedAt} />
    </main>
  );
}
