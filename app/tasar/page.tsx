import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ValuationForm from "@/components/ValuationForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tasador online de viviendas en Madrid — Valoración gratuita",
  description:
    "Calcula gratis el precio estimado de tu piso en Madrid. Valoración basada en IA con datos de mercado actualizados: comparables por barrio, ajustes por características y bandas de confianza.",
  keywords: [
    "tasador madrid",
    "valorar piso madrid",
    "cuánto vale mi piso",
    "calculadora precio vivienda madrid",
    "tasación online madrid",
    "valoración piso gratis",
  ],
  alternates: { canonical: "/tasar" },
  openGraph: {
    title: "Tasador online de viviendas en Madrid — Valoración gratuita",
    description:
      "Calcula el precio de tu piso en Madrid con IA. Datos de mercado actualizados a diario.",
    url: "https://madridhome.tech/tasar",
    type: "website",
  },
};

/* ── JSON-LD WebApplication ───────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Tasador de viviendas Madrid — madridhome.tech",
  description:
    "Herramienta gratuita de valoración de viviendas en Madrid basada en inteligencia artificial y datos reales de mercado.",
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

export default function TasarPage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Tasador" }]} />

      {/* Header */}
      <header className="mt-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Tasador de viviendas en Madrid
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl">
          Introduce las características de tu piso y obtén una valoración
          instantánea basada en nuestro modelo de IA, entrenado con miles de
          anuncios reales del mercado madrileño.
        </p>
      </header>

      {/* Form + Results */}
      <ValuationForm />

      {/* SEO content */}
      <section className="mt-16 prose prose-invert prose-sm max-w-none">
        <h2 className="text-slate-300 font-semibold text-base">
          ¿Cómo funciona el tasador?
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Nuestro modelo de inteligencia artificial analiza miles de propiedades
          en venta en Madrid para estimar el precio más probable de tu vivienda.
          Utiliza un algoritmo de Random Forest con 200 árboles de decisión,
          entrenado con datos reales y reentrenado automáticamente cada semana
          para reflejar las condiciones actuales del mercado.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          La valoración tiene en cuenta la ubicación (distrito y barrio), la
          superficie, el número de habitaciones, la planta, si cuenta con
          ascensor y orientación exterior. Adicionalmente, se aplican ajustes
          por características como terraza, garaje, estado de reforma y
          certificado energético, basados en las primas de mercado habituales en
          Madrid.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          El resultado incluye una banda de confianza (percentil 10-90) que
          refleja la dispersión real de precios en la zona. A mayor número de
          propiedades comparables disponibles, más estrecha será la banda y más
          fiable la estimación.
        </p>
      </section>

      <Footer generatedAt={new Date().toISOString()} />
    </main>
  );
}
