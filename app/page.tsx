"use client";

import { useEffect, useState } from "react";
import type { MetricsData } from "@/lib/types";

import Thermometer from "@/components/Thermometer";
import KpiCards from "@/components/KpiCards";
import DistrictTable from "@/components/DistrictTable";
import PriceTrendChart from "@/components/PriceTrendChart";
import AlertsBanner from "@/components/AlertsBanner";
import RentalYields from "@/components/RentalYields";
import Footer from "@/components/Footer";

export default function Home() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/metrics");
        if (!res.ok) throw new Error("Datos no disponibles");
        const json: MetricsData = await res.json();
        setData(json);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Cargando datos de mercado...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-white text-lg font-semibold mb-2">Datos no disponibles</h2>
          <p className="text-slate-400 text-sm">
            {error ?? "No se han podido cargar los indicadores de mercado. Inténtalo más tarde."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-center mb-10 animate-fade-in">
        <img
          src="/logo.png"
          alt="madridhome.tech — El termómetro del mercado inmobiliario de Madrid"
          className="h-40 sm:h-52 w-auto"
        />
      </header>

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
          <PriceTrendChart data={data.trends.market} />
        </section>

        {/* Rental Yields */}
        <section className="animate-fade-in animate-delay-4">
          <RentalYields yields={data.rental_yields} />
        </section>
      </div>

      {/* District Table */}
      <section className="mb-8 animate-fade-in animate-delay-4">
        <DistrictTable zones={data.zones} />
      </section>

      {/* Footer */}
      <Footer generatedAt={data.metadata.generated_at} />
    </main>
  );
}
