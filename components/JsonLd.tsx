/**
 * JSON-LD structured data components for SEO rich snippets.
 *
 * Uses Schema.org types:
 * - WebSite + Dataset    → home page (market overview)
 * - Place + Dataset      → district pages
 * - Place + Dataset      → barrio pages
 *
 * Google can show price ranges, update frequency, and location
 * directly in search results via these structured annotations.
 */

/* ── Home page: WebSite + Dataset ────────────────────────────── */
export function HomeJsonLd({
  locale,
  medianSqm,
  zonesCount,
  generatedAt,
}: {
  locale: string;
  medianSqm: number | null;
  zonesCount: number;
  generatedAt: string;
}) {
  const isEs = locale === "es";
  const url = `https://madridhome.tech/${locale}`;

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "madridhome.tech",
    url: "https://madridhome.tech",
    description: isEs
      ? "Análisis del mercado inmobiliario de Madrid: precio por metro cuadrado por distrito y barrio, actualizado semanalmente."
      : "Madrid real estate market analysis: price per square metre by district and neighbourhood, updated weekly.",
    inLanguage: isEs ? "es-ES" : "en-GB",
  };

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: isEs
      ? "Precios de vivienda en Madrid por distrito y barrio"
      : "Madrid housing prices by district and neighbourhood",
    description: isEs
      ? `Datos de ${zonesCount} distritos de Madrid. Mediana: ${medianSqm?.toLocaleString("es-ES") ?? "—"} €/m².`
      : `Data from ${zonesCount} Madrid districts. Median: ${medianSqm?.toLocaleString("en-GB") ?? "—"} €/sqm.`,
    url,
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    temporalCoverage: `2026-01-01/${new Date().toISOString().slice(0, 10)}`,
    spatialCoverage: {
      "@type": "Place",
      name: "Madrid, Spain",
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.4168,
        longitude: -3.7038,
      },
    },
    dateModified: generatedAt,
    creator: {
      "@type": "Organization",
      name: "madridhome.tech",
      url: "https://madridhome.tech",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }}
      />
    </>
  );
}

/* ── District page: Place + RealEstateAgent observation ──────── */
export function DistrictJsonLd({
  locale,
  slug,
  name,
  medianPrice,
  pricePerSqm,
  activeCount,
  generatedAt,
}: {
  locale: string;
  slug: string;
  name: string;
  medianPrice: number | null;
  pricePerSqm: number | null;
  activeCount: number;
  generatedAt: string;
}) {
  const isEs = locale === "es";
  const url = `https://madridhome.tech/${locale}/distrito/${slug}`;
  const fmtPrice = (n: number | null) =>
    n != null ? n.toLocaleString(isEs ? "es-ES" : "en-GB") : "—";

  const data = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${name}, Madrid`,
    description: isEs
      ? `Mercado inmobiliario en ${name} (Madrid): ${fmtPrice(pricePerSqm)} €/m², ${activeCount} pisos en venta.`
      : `Real estate market in ${name} (Madrid): ${fmtPrice(pricePerSqm)} €/sqm, ${activeCount} properties for sale.`,
    url,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.4168,
      longitude: -3.7038,
    },
    containedInPlace: {
      "@type": "City",
      name: "Madrid",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: isEs ? "Precio por m²" : "Price per sqm",
        value: pricePerSqm ?? 0,
        unitCode: "EUR",
      },
      {
        "@type": "PropertyValue",
        name: isEs ? "Precio mediano" : "Median price",
        value: medianPrice ?? 0,
        unitCode: "EUR",
      },
      {
        "@type": "PropertyValue",
        name: isEs ? "Pisos en venta" : "Properties for sale",
        value: activeCount,
      },
    ],
    dateModified: generatedAt,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Barrio page: Place with parent district ─────────────────── */
export function BarrioJsonLd({
  locale,
  slug,
  barrio,
  distrito,
  pricePerSqm,
  medianPrice,
  activeCount,
  generatedAt,
}: {
  locale: string;
  slug: string;
  barrio: string;
  distrito: string;
  pricePerSqm: number | null;
  medianPrice: number | null;
  activeCount: number;
  generatedAt: string;
}) {
  const isEs = locale === "es";
  const url = `https://madridhome.tech/${locale}/barrio/${slug}`;
  const fmtPrice = (n: number | null) =>
    n != null ? n.toLocaleString(isEs ? "es-ES" : "en-GB") : "—";

  const data = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${barrio}, ${distrito}, Madrid`,
    description: isEs
      ? `Precios en el barrio ${barrio} (${distrito}, Madrid): ${fmtPrice(pricePerSqm)} €/m², ${activeCount} pisos en venta.`
      : `Prices in ${barrio} neighbourhood (${distrito}, Madrid): ${fmtPrice(pricePerSqm)} €/sqm, ${activeCount} properties for sale.`,
    url,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.4168,
      longitude: -3.7038,
    },
    containedInPlace: {
      "@type": "Place",
      name: `${distrito}, Madrid`,
      containedInPlace: {
        "@type": "City",
        name: "Madrid",
      },
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: isEs ? "Precio por m²" : "Price per sqm",
        value: pricePerSqm ?? 0,
        unitCode: "EUR",
      },
      ...(medianPrice
        ? [
            {
              "@type": "PropertyValue",
              name: isEs ? "Precio mediano" : "Median price",
              value: medianPrice,
              unitCode: "EUR",
            },
          ]
        : []),
      {
        "@type": "PropertyValue",
        name: isEs ? "Pisos en venta" : "Properties for sale",
        value: activeCount,
      },
    ],
    dateModified: generatedAt,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
