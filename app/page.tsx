import { readFile } from "fs/promises";
import { join } from "path";
import type { MetricsData } from "@/lib/types";

import Thermometer from "@/components/Thermometer";
import KpiCards from "@/components/KpiCards";
import DistrictTable from "@/components/DistrictTable";
import PriceTrendChart from "@/components/PriceTrendChart";
import AlertsBanner from "@/components/AlertsBanner";
import RentalYields from "@/components/RentalYields";
import Footer from "@/components/Footer";

// ISR: revalidar cada hora (3600s). Vercel sirve HTML cacheado
// y lo regenera en background cuando expira.
export const revalidate = 3600;

async function getMetrics(): Promise<MetricsData | null> {
  try {
    const filePath = join(process.cwd(), "public", "metrics.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as MetricsData;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Home() {
  const data = await getMetrics();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="text-white text-lg font-semibold mb-2">
            Precio vivienda Madrid — Datos no disponibles
          </h1>
          <p className="text-slate-400 text-sm">
            No se han podido cargar los indicadores de mercado. Inténtalo más
            tarde.
          </p>
        </div>
      </div>
    );
  }

  const medianSqm = data.zones.length
    ? Math.round(
        data.zones.reduce((s, z) => s + (z.price_per_sqm ?? 0), 0) /
          data.zones.filter((z) => z.price_per_sqm).length
      )
    : null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col items-center mb-10 animate-fade-in">
        <img
          src="/logo.png"
          alt="madridhome.tech — El termómetro del mercado inmobiliario de Madrid"
          className="h-40 sm:h-52 w-auto"
        />
      </header>

      {/* H1 SEO — visible pero discreto */}
      <h1 className="text-center text-slate-300 text-base sm:text-lg font-medium -mt-6 mb-1">
        Precio vivienda Madrid — Mercado inmobiliario en tiempo real
      </h1>
      <p className="text-center text-slate-500 text-sm mb-8">
        Datos actualizados el {formatDate(data.metadata.generated_at)}
        {medianSqm && <> · Mediana: <strong className="text-slate-400">{medianSqm.toLocaleString("es-ES")} €/m²</strong></>}
      </p>

      {/* Thermometer + Score */}
      <section className="flex justify-center mb-10 animate-fade-in animate-delay-1">
        <Thermometer score={data.market_score} />
      </section>

      {/* KPI Cards */}
      <section className="mb-8 animate-fade-in animate-delay-2">
        <KpiCards
          indicators={data.indicators}
          macro={data.macro}
          dbStats={{ ...data.db_stats, price_drop_stats: data.price_drop_stats }}
        />
      </section>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <section className="mb-8 animate-fade-in animate-delay-3">
          <AlertsBanner alerts={data.alerts} />
        </section>
      )}

      {/* Charts + Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Price Trend Chart */}
        <section className="animate-fade-in animate-delay-3">
          <h2 className="text-white font-semibold text-sm mb-3">
            Evolución precio vivienda Madrid (€/m²)
          </h2>
          <PriceTrendChart data={data.trends.market} />
        </section>

        {/* Rental Yields */}
        <section className="animate-fade-in animate-delay-4">
          <h2 className="text-white font-semibold text-sm mb-3">
            Rentabilidad alquiler por barrio en Madrid
          </h2>
          <RentalYields yields={data.rental_yields} />
        </section>
      </div>

      {/* District Table */}
      <section className="mb-8 animate-fade-in animate-delay-4">
        <h2 className="text-white font-semibold text-sm mb-3">
          Precio medio por distrito en Madrid
        </h2>
        <DistrictTable zones={data.zones} />
      </section>

      {/* Footer */}
      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
