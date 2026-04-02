"use client";

import { useEffect, useState, useMemo } from "react";
import type { Zone } from "@/lib/types";
import { toSlug } from "@/lib/districts";
import { useRouter } from "next/navigation";

// Lazy-load leaflet + react-leaflet (SSR-unsafe)
import dynamic from "next/dynamic";

/* ── Types for GeoJSON ────────────────────────────────────────── */
interface GeoFeature {
  type: "Feature";
  properties: { NOMBRE: string; CODIGO: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}
interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

/* ── Color scale (€/m²) ──────────────────────────────────────── */
function getColor(value: number, min: number, max: number): string {
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));

  // Green (cheap) → Yellow → Orange → Red (expensive)
  if (ratio < 0.25) {
    // green to yellow-green
    const t = ratio / 0.25;
    const r = Math.round(34 + t * (180 - 34));
    const g = Math.round(197 + t * (210 - 197));
    const b = Math.round(94 - t * 50);
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 0.5) {
    // yellow-green to yellow
    const t = (ratio - 0.25) / 0.25;
    const r = Math.round(180 + t * (250 - 180));
    const g = Math.round(210 - t * (210 - 200));
    const b = Math.round(44 - t * 10);
    return `rgb(${r},${g},${b})`;
  } else if (ratio < 0.75) {
    // yellow to orange
    const t = (ratio - 0.5) / 0.25;
    const r = Math.round(250 + t * (5));
    const g = Math.round(200 - t * 100);
    const b = Math.round(34 + t * 10);
    return `rgb(${r},${g},${b})`;
  } else {
    // orange to red
    const t = (ratio - 0.75) / 0.25;
    const r = 255;
    const g = Math.round(100 - t * 70);
    const b = Math.round(44 - t * 10);
    return `rgb(${r},${g},${b})`;
  }
}

/* ── Map inner component (loaded only client-side) ────────────── */
function MapInner({
  geojson,
  zones,
  locale,
  labels,
  notarialPrices,
}: {
  geojson: GeoCollection;
  zones: Zone[];
  locale: string;
  labels: {
    price_per_sqm: string;
    active: string;
    days: string;
    click_to_view: string;
  };
  notarialPrices: Record<string, number>;
}) {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const RL = require("react-leaflet") as any;
  const { MapContainer, TileLayer, GeoJSON: GeoJSONLayer } = RL;

  const router = useRouter();

  const priceMap = useMemo(() => {
    const m = new Map<string, Zone>();
    zones.forEach((z) => m.set(z.name, z));
    return m;
  }, [zones]);

  const validPrices = zones
    .map((z) => z.price_per_sqm)
    .filter((v): v is number => v != null && v > 0);
  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);

  const fmt = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-GB" : "es-ES");

  const style = (feature: any) => {
    const name = feature?.properties?.NOMBRE ?? "";
    const zone = priceMap.get(name);
    const price = zone?.price_per_sqm;
    return {
      fillColor: price ? getColor(price, minPrice, maxPrice) : "#374151",
      weight: 1.5,
      opacity: 1,
      color: "#1e293b",
      fillOpacity: 0.75,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature?.properties?.NOMBRE ?? "";
    const zone = priceMap.get(name);
    if (!zone) return;

    const notarialPrice = notarialPrices[name];
    const notarialLabel =
      locale === "en" ? "Notarial price (Notariado)" : "Precio notarial (Notariado)";
    const notarialRow = notarialPrice
      ? `${notarialLabel}: <strong>${fmt(notarialPrice)} €/m²</strong><br/>`
      : "";

    const tooltip = `
      <div style="font-family:system-ui;font-size:13px;line-height:1.5;">
        <strong style="font-size:14px;">${name}</strong><br/>
        ${labels.price_per_sqm}: <strong>${fmt(zone.price_per_sqm ?? 0)} €/m²</strong><br/>
        ${notarialRow}${labels.active}: ${fmt(zone.active_count ?? 0)}<br/>
        ${labels.days}: ${zone.days_to_sell ?? "—"}<br/>
        <em style="color:#94a3b8;font-size:11px;">${labels.click_to_view}</em>
      </div>
    `;
    layer.bindTooltip(tooltip, { sticky: true, className: "district-tooltip" });

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({ weight: 3, color: "#06b6d4", fillOpacity: 0.9 });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        e.target.setStyle(style(feature));
      },
      click: () => {
        const slug = toSlug(name);
        router.push(`/${locale}/distrito/${slug}`);
      },
    });
  };

  return (
    <MapContainer
      center={[40.43, -3.69]}
      zoom={11}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <GeoJSONLayer
        key="districts"
        data={geojson as any}
        style={style}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}

/* ── Dynamic wrapper (no SSR) ─────────────────────────────────── */
const LazyMap = dynamic<Parameters<typeof MapInner>[0]>(
  () => Promise.resolve(MapInner),
  { ssr: false }
);

/* ── Legend component ─────────────────────────────────────────── */
function Legend({
  min,
  max,
  locale,
}: {
  min: number;
  max: number;
  locale: string;
}) {
  const fmt = (n: number) =>
    n.toLocaleString(locale === "en" ? "en-GB" : "es-ES");

  return (
    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
      <span>{fmt(min)} €/m²</span>
      <div
        className="flex-1 h-3 rounded"
        style={{
          background:
            "linear-gradient(to right, rgb(34,197,94), rgb(250,200,34), rgb(255,100,44), rgb(255,30,34))",
        }}
      />
      <span>{fmt(max)} €/m²</span>
    </div>
  );
}

/* ── Main exported component ──────────────────────────────────── */
export default function DistrictHeatMap({
  zones,
  locale,
  labels,
}: {
  zones: Zone[];
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    price_per_sqm: string;
    active: string;
    days: string;
    click_to_view: string;
  };
}) {
  const [geojson, setGeojson] = useState<GeoCollection | null>(null);
  const [leafletCss, setLeafletCss] = useState(false);
  const [notarialPrices, setNotarialPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    setLeafletCss(true);

    // Load GeoJSON
    fetch("/madrid-districts.geojson")
      .then((r) => r.json())
      .then((data) => setGeojson(data))
      .catch(() => {});

    // Load notarial prices from Portal del Notariado (via API route)
    fetch("/api/notarial-prices")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setNotarialPrices(data);
      })
      .catch(() => {});
  }, []);

  const validPrices = zones
    .map((z) => z.price_per_sqm)
    .filter((v): v is number => v != null && v > 0);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : 10000;

  if (!geojson || !leafletCss) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <div className="h-[400px] flex items-center justify-center text-slate-500 text-sm">
          Cargando mapa…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="h-[420px] sm:h-[480px]">
        <LazyMap
          geojson={geojson}
          zones={zones}
          locale={locale}
          labels={{
            price_per_sqm: labels.price_per_sqm,
            active: labels.active,
            days: labels.days,
            click_to_view: labels.click_to_view,
          }}
          notarialPrices={notarialPrices}
        />
      </div>
      <Legend min={minPrice} max={maxPrice} locale={locale} />
      <style jsx global>{`
        .district-tooltip {
          background: #0f172a !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          color: #e2e8f0 !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }
        .district-tooltip::before {
          border-top-color: #334155 !important;
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: #94a3b8 !important;
          border-color: #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
          color: #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
}
