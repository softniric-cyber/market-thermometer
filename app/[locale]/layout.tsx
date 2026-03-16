import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Analytics } from "@vercel/analytics/react";
import { locales, type Locale } from "@/i18n/config";
import LanguageSwitch from "@/components/LanguageSwitch";

const SITE_URL = "https://madridhome.tech";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t("home_title")} | madridhome.tech`,
      template: "%s | madridhome.tech",
    },
    description: t("home_description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { es: "/es", en: "/en" },
    },
    openGraph: {
      title: t("home_title"),
      description: t("home_description"),
      url: SITE_URL,
      siteName: "madridhome.tech",
      locale: locale === "en" ? "en_GB" : "es_ES",
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "madridhome.tech",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home_title"),
      description: t("home_description"),
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
}

function getJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "madridhome.tech",
        url: SITE_URL,
        description:
          locale === "en"
            ? "Madrid real estate market thermometer with data updated daily."
            : "Termómetro del mercado inmobiliario de Madrid con datos actualizados a diario.",
        inLanguage: locale,
      },
      {
        "@type": "Dataset",
        name:
          locale === "en"
            ? "Madrid real estate market indicators"
            : "Indicadores del mercado inmobiliario de Madrid",
        description:
          locale === "en"
            ? "Average price by district, weekly €/m² evolution, rental yield by neighborhood, and market alerts in Madrid."
            : "Precio medio por distrito, evolución semanal del €/m², rentabilidad del alquiler por barrio, y alertas de mercado en la ciudad de Madrid.",
        url: SITE_URL,
        license: "https://creativecommons.org/licenses/by-nc/4.0/",
        temporalCoverage: "2026/..",
        spatialCoverage: {
          "@type": "Place",
          name: locale === "en" ? "Madrid, Spain" : "Madrid, España",
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
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getJsonLd(locale)),
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <div className="fixed top-3 right-3 z-50">
            <LanguageSwitch />
          </div>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
