import { NextResponse } from "next/server";

/**
 * Postal code → Madrid district mapping.
 * Source: Portal del Notariado ArcGIS API (agol_precio_m2, Layer 4: Código Postal)
 * Covers all 21 Madrid districts with postal codes 28001–28055.
 */
const CP_TO_DISTRICT: Record<string, string> = {
  "28001": "Salamanca",
  "28002": "Chamartín",
  "28003": "Chamberí",
  "28004": "Centro",
  "28005": "Arganzuela",
  "28006": "Salamanca",
  "28007": "Retiro",
  "28008": "Moncloa-Aravaca",
  "28009": "Retiro",
  "28010": "Chamberí",
  "28011": "Latina",
  "28012": "Centro",
  "28013": "Centro",
  "28014": "Retiro",
  "28015": "Chamberí",
  "28016": "Chamartín",
  "28017": "Ciudad Lineal",
  "28018": "Puente de Vallecas",
  "28019": "Carabanchel",
  "28020": "Tetuán",
  "28021": "Villaverde",
  "28022": "Ciudad Lineal",
  "28023": "Moncloa-Aravaca",
  "28024": "Usera",
  "28025": "Carabanchel",
  "28026": "Carabanchel",
  "28027": "Ciudad Lineal",
  "28028": "Salamanca",
  "28029": "Tetuán",
  "28030": "Moratalaz",
  "28031": "Puente de Vallecas",
  "28032": "Moratalaz",
  "28033": "Ciudad Lineal",
  "28034": "Fuencarral-El Pardo",
  "28035": "Fuencarral-El Pardo",
  "28036": "Chamartín",
  "28037": "San Blas-Canillejas",
  "28038": "Puente de Vallecas",
  "28039": "Hortaleza",
  "28040": "Moncloa-Aravaca",
  "28041": "Usera",
  "28042": "Hortaleza",
  "28043": "Hortaleza",
  "28044": "Latina",
  "28045": "Arganzuela",
  "28046": "Chamartín",
  "28047": "Latina",
  "28048": "Fuencarral-El Pardo",
  "28049": "Fuencarral-El Pardo",
  "28050": "Barajas",
  "28051": "Vicálvaro",
  "28052": "Vicálvaro",
  "28053": "Villa de Vallecas",
  "28054": "Latina",
  "28055": "San Blas-Canillejas",
};

const ARCGIS_URL =
  "https://services-eu1.arcgis.com/UpPGybwp9RK4YtZj/arcgis/rest/services/agol_precio_m2/FeatureServer/4/query";

export const revalidate = 86400; // Cache 24 h (data updates quarterly)

export async function GET() {
  try {
    const params = new URLSearchParams({
      f: "json",
      outFields: "cp,precio_m2",
      where:
        "(tipo_construccion_id = 99) AND (clase_finca_urbana_id = 99) AND (cp >= '28001') AND (cp <= '28055')",
      returnGeometry: "false",
    });

    const res = await fetch(`${ARCGIS_URL}?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`ArcGIS error: ${res.status}`);

    const data = await res.json();
    const features: { attributes: { cp: string; precio_m2: number | null } }[] =
      data.features ?? [];

    // Aggregate: sum and count per district
    const agg: Record<string, { sum: number; count: number }> = {};

    for (const { attributes } of features) {
      const { cp, precio_m2 } = attributes;
      if (!cp || precio_m2 == null || precio_m2 <= 0) continue;
      const district = CP_TO_DISTRICT[cp];
      if (!district) continue;
      if (!agg[district]) agg[district] = { sum: 0, count: 0 };
      agg[district].sum += precio_m2;
      agg[district].count += 1;
    }

    // Build result: district → rounded average price_m2
    const result: Record<string, number> = {};
    for (const [district, { sum, count }] of Object.entries(agg)) {
      result[district] = Math.round(sum / count);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
      },
    });
  } catch (err) {
    console.error("[notarial-prices] fetch failed:", err);
    return NextResponse.json(
      { error: "No se pudieron obtener los datos del Portal del Notariado" },
      { status: 503 }
    );
  }
}
