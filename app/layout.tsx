import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://madridhome.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Precio vivienda Madrid — Termómetro del mercado inmobiliario | madridhome.tech",
    template: "%s | madridhome.tech",
  },
  description:
    "Consulta el precio de la vivienda en Madrid actualizado a diario. Score de mercado, precio medio por distrito, evolución €/m², rentabilidad alquiler y alertas del mercado inmobiliario madrileño.",
  keywords: [
    "precio vivienda Madrid",
    "mercado inmobiliario Madrid",
    "precio m2 Madrid",
    "pisos Madrid",
    "comprar piso Madrid",
    "precio metro cuadrado Madrid",
    "evolución precio vivienda Madrid",
    "rentabilidad alquiler Madrid",
    "indicadores inmobiliarios",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Precio vivienda Madrid — Termómetro inmobiliario en tiempo real",
    description:
      "Score de mercado, precio por distrito, tendencias y rentabilidad del alquiler en Madrid. Datos actualizados a diario.",
    url: SITE_URL,
    siteName: "madridhome.tech",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "madridhome.tech — Precio vivienda Madrid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Precio vivienda Madrid — madridhome.tech",
    description:
      "Termómetro del mercado inmobiliario de Madrid. Datos actualizados a diario.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

/* ── JSON-LD structured data ───────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "madridhome.tech",
      url: SITE_URL,
      description:
        "Termómetro del mercado inmobiliario de Madrid con datos actualizados a diario.",
      inLanguage: "es",
    },
    {
      "@type": "Dataset",
      name: "Indicadores del mercado inmobiliario de Madrid",
      description:
        "Precio medio por distrito, evolución semanal del €/m², rentabilidad del alquiler por barrio, y alertas de mercado en la ciudad de Madrid.",
      url: SITE_URL,
      license: "https://creativecommons.org/licenses/by-nc/4.0/",
      temporalCoverage: "2026/..",
      spatialCoverage: {
        "@type": "Place",
        name: "Madrid, España",
      },
      creator: {
        "@type": "Organization",
        name: "madridhome.tech",
        url: SITE_URL,
      },
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/api/metrics`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
