import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ValuationForm from "@/components/ValuationForm";
import Footer from "@/components/Footer";
import { locales } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "valuation" });

  return {
    title: `${t("title")} — ${t("title").split(" ")[0]}`,
    description: t("subtitle"),
    keywords: [
      "tasador madrid",
      "valorar piso madrid",
      "cuánto vale mi piso",
      "calculadora precio vivienda madrid",
      "tasación online madrid",
      "valoración piso gratis",
    ],
    alternates: {
      canonical: "/tasar",
      languages: locales.reduce(
        (acc, loc) => {
          acc[loc === "en" ? "en-GB" : "es-ES"] = `/es/tasar`;
          return acc;
        },
        {} as Record<string, string>
      ),
    },
    openGraph: {
      title: `${t("title")} — Valoración gratuita`,
      description: t("subtitle"),
      url: "https://madridhome.tech/tasar",
      type: "website",
    },
  };
}

export default async function TasarPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "valuation" });

  /* ── JSON-LD WebApplication ───────────────────────────────── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${t("title")} — madridhome.tech`,
    description: t("subtitle"),
    url: "https://madridhome.tech/tasar",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    creator: {
      "@type": "Organization",
      name: "madridhome.tech",
      url: "https://madridhome.tech",
    },
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: t("title") }]} />

      {/* Header */}
      <header className="mt-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {t("title")}
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          {t("subtitle")}
        </p>
      </header>

      {/* Form + Results */}
      <ValuationForm />

      {/* SEO content */}
      <section className="mt-16 prose prose-invert prose-sm max-w-none">
        <h2 className="text-slate-300 font-semibold text-base">
          {t("how_it_works")}
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("how_it_works_p1")}
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("how_it_works_p2")}
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          {t("how_it_works_p3")}
        </p>
      </section>

      <Footer generatedAt={new Date().toISOString()} />
    </main>
  );
}
