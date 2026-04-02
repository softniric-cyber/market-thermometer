import type { MetricsData, BarrioData, BarrioTrend, TrendPoint } from "@/lib/types";
import type { NotarialGapEntry } from "@/lib/districts";

// --------------------------------------------------------------------------
// Full map of 139 barrios — [distrito, barrio]
// --------------------------------------------------------------------------
export const BARRIO_LIST: ReadonlyArray<readonly [string, string]> = [
  // Arganzuela
  ["Arganzuela", "Acacias"], ["Arganzuela", "Chopera"], ["Arganzuela", "Delicias"],
  ["Arganzuela", "Imperial"], ["Arganzuela", "Legazpi"], ["Arganzuela", "Palos de la Frontera"],
  // Barajas
  ["Barajas", "Aeropuerto"], ["Barajas", "Alameda de Osuna"],
  ["Barajas", "Campo de las Naciones"], ["Barajas", "Casco Histórico de Barajas"], ["Barajas", "Timón"],
  // Carabanchel
  ["Carabanchel", "Abrantes"], ["Carabanchel", "Buena Vista"], ["Carabanchel", "Comillas"],
  ["Carabanchel", "Opañel"], ["Carabanchel", "PAU de Carabanchel"], ["Carabanchel", "Puerta Bonita"],
  ["Carabanchel", "San Isidro"], ["Carabanchel", "Vista Alegre"],
  // Centro
  ["Centro", "Chueca-Justicia"], ["Centro", "Huertas-Cortes"], ["Centro", "Lavapiés-Embajadores"],
  ["Centro", "Malasaña-Universidad"], ["Centro", "Palacio"], ["Centro", "Sol"],
  // Chamartín
  ["Chamartín", "Bernabéu-Hispanoamérica"], ["Chamartín", "Castilla"], ["Chamartín", "Ciudad Jardín"],
  ["Chamartín", "El Viso"], ["Chamartín", "Nueva España"], ["Chamartín", "Prosperidad"],
  // Chamberí
  ["Chamberí", "Almagro"], ["Chamberí", "Arapiles"], ["Chamberí", "Gaztambide"],
  ["Chamberí", "Nuevos Ministerios-Ríos Rosas"], ["Chamberí", "Trafalgar"], ["Chamberí", "Vallehermoso"],
  // Ciudad Lineal
  ["Ciudad Lineal", "Atalaya"], ["Ciudad Lineal", "Colina"], ["Ciudad Lineal", "Concepción"],
  ["Ciudad Lineal", "Costillares"], ["Ciudad Lineal", "Pueblo Nuevo"], ["Ciudad Lineal", "Quintana"],
  ["Ciudad Lineal", "San Juan Bautista"], ["Ciudad Lineal", "San Pascual"], ["Ciudad Lineal", "Ventas"],
  // Fuencarral-El Pardo
  ["Fuencarral-El Pardo", "Arroyo del Fresno"], ["Fuencarral-El Pardo", "El Pardo"],
  ["Fuencarral-El Pardo", "Fuentelarreina"], ["Fuencarral-El Pardo", "La Paz"],
  ["Fuencarral-El Pardo", "Las Tablas"], ["Fuencarral-El Pardo", "Mirasierra"],
  ["Fuencarral-El Pardo", "Montecarmelo"], ["Fuencarral-El Pardo", "Peñagrande"],
  ["Fuencarral-El Pardo", "Pilar"], ["Fuencarral-El Pardo", "Tres Olivos-Valverde"],
  // Hortaleza
  ["Hortaleza", "Apóstol Santiago"], ["Hortaleza", "Canillas"], ["Hortaleza", "Conde Orgaz-Piovera"],
  ["Hortaleza", "Palomas"], ["Hortaleza", "Pinar del Rey"], ["Hortaleza", "Sanchinarro"],
  ["Hortaleza", "Valdebebas-Valdefuentes"], ["Hortaleza", "Virgen del Cortijo-Manoteras"],
  // Latina
  ["Latina", "Águilas"], ["Latina", "Aluche"], ["Latina", "Campamento"],
  ["Latina", "Cuatro Vientos"], ["Latina", "Los Cármenes"], ["Latina", "Lucero"],
  ["Latina", "Puerta del Ángel"],
  // Moncloa-Aravaca
  ["Moncloa-Aravaca", "Aravaca"], ["Moncloa-Aravaca", "Argüelles"], ["Moncloa-Aravaca", "Casa de Campo"],
  ["Moncloa-Aravaca", "Ciudad Universitaria"], ["Moncloa-Aravaca", "El Plantío"],
  ["Moncloa-Aravaca", "Valdemarín"], ["Moncloa-Aravaca", "Valdezarza"],
  // Moratalaz
  ["Moratalaz", "Fontarrón"], ["Moratalaz", "Horcajo"], ["Moratalaz", "Marroquina"],
  ["Moratalaz", "Media Legua"], ["Moratalaz", "Pavones"], ["Moratalaz", "Vinateros"],
  // Puente de Vallecas
  ["Puente de Vallecas", "Entrevías"], ["Puente de Vallecas", "Numancia"],
  ["Puente de Vallecas", "Palomeras Bajas"], ["Puente de Vallecas", "Palomeras Sureste"],
  ["Puente de Vallecas", "Portazgo"], ["Puente de Vallecas", "San Diego"],
  // Retiro
  ["Retiro", "Adelfas"], ["Retiro", "Estrella"], ["Retiro", "Ibiza"],
  ["Retiro", "Jerónimos"], ["Retiro", "Niño Jesús"], ["Retiro", "Pacífico"],
  // Salamanca
  ["Salamanca", "Castellana"], ["Salamanca", "Fuente del Berro"], ["Salamanca", "Goya"],
  ["Salamanca", "Guindalera"], ["Salamanca", "Lista"], ["Salamanca", "Recoletos"],
  // San Blas-Canillejas
  ["San Blas-Canillejas", "Amposta"], ["San Blas-Canillejas", "Arcos"],
  ["San Blas-Canillejas", "Canillejas"], ["San Blas-Canillejas", "Hellín"],
  ["San Blas-Canillejas", "Rejas"], ["San Blas-Canillejas", "Rosas"],
  ["San Blas-Canillejas", "Salvador"], ["San Blas-Canillejas", "Simancas"],
  // Tetuán
  ["Tetuán", "Bellas Vistas"], ["Tetuán", "Berruguete"], ["Tetuán", "Cuatro Caminos"],
  ["Tetuán", "Cuzco-Castillejos"], ["Tetuán", "Valdeacederas"], ["Tetuán", "Ventilla-Almenara"],
  // Usera
  ["Usera", "12 de Octubre-Orcasur"], ["Usera", "Almendrales"], ["Usera", "Moscardó"],
  ["Usera", "Orcasitas"], ["Usera", "Pradolongo"], ["Usera", "San Fermín"], ["Usera", "Zofío"],
  // Vicálvaro
  ["Vicálvaro", "Ambroz"], ["Vicálvaro", "Casco Histórico de Vicálvaro"],
  ["Vicálvaro", "El Cañaveral"], ["Vicálvaro", "Los Ahijones"], ["Vicálvaro", "Los Berrocales"],
  ["Vicálvaro", "Los Cerros"], ["Vicálvaro", "Valdebernardo-Valderrivas"],
  // Villa de Vallecas
  ["Villa de Vallecas", "Casco Histórico de Vallecas"],
  ["Villa de Vallecas", "Ensanche de Vallecas-La Gavia"],
  ["Villa de Vallecas", "Santa Eugenia"], ["Villa de Vallecas", "Valdecarros"],
  // Villaverde
  ["Villaverde", "Butarque"], ["Villaverde", "Los Ángeles"], ["Villaverde", "Los Rosales"],
  ["Villaverde", "San Cristóbal"], ["Villaverde", "Villaverde Alto"],
] as const;

// --------------------------------------------------------------------------
// Slug helpers
// --------------------------------------------------------------------------
export function toBarrioSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Returns { barrio, distrito } or null if the slug doesn't match any barrio. */
export function fromBarrioSlug(
  slug: string
): { barrio: string; distrito: string } | null {
  const match = BARRIO_LIST.find(([, b]) => toBarrioSlug(b) === slug);
  if (!match) return null;
  return { barrio: match[1], distrito: match[0] };
}

export function getAllBarrioSlugs(): string[] {
  return BARRIO_LIST.map(([, b]) => toBarrioSlug(b));
}

/** Returns all barrios belonging to a given district name. */
export function getBarriosForDistrict(
  distrito: string
): ReadonlyArray<readonly [string, string]> {
  return BARRIO_LIST.filter(([d]) => d === distrito);
}

// --------------------------------------------------------------------------
// Data aggregation
// --------------------------------------------------------------------------
export interface BarrioMetrics {
  barrio: string;
  distrito: string;
  slug: string;
  data: BarrioData | null;
  trends: TrendPoint[];
  madridAvgSqm: number | null;
  notarialGap: NotarialGapEntry | null;
}

export function getBarrioMetrics(
  barrio: string,
  distrito: string,
  metricsData: MetricsData
): BarrioMetrics {
  const data =
    (metricsData.barrios ?? []).find((b) => b.barrio === barrio) ?? null;

  const trends: TrendPoint[] = (metricsData.barrio_trends ?? [])
    .filter((t: BarrioTrend) => t.barrio === barrio)
    .map((t: BarrioTrend) => ({
      week: t.week,
      week_start: t.week_start,
      avg_sqm: t.median_price_sqm ?? undefined,
      n_listings: t.listing_count ?? undefined,
    }));

  const validSqm = (metricsData.barrios ?? [])
    .map((b) => b.price_per_sqm)
    .filter((v): v is number => v != null && v > 0);
  const madridAvgSqm =
    validSqm.length
      ? Math.round(validSqm.reduce((a, b) => a + b, 0) / validSqm.length)
      : null;

  // Notarial gap at district level (finest granularity available from Notariado)
  const notarialGap =
    ((metricsData.notarial_gap ?? []) as unknown as NotarialGapEntry[]).find(
      (g) => g.distrito === distrito
    ) ?? null;

  return {
    barrio,
    distrito,
    slug: toBarrioSlug(barrio),
    data,
    trends,
    madridAvgSqm,
    notarialGap,
  };
}
