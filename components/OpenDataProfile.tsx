"use client";

import type { OpenDataProfile as OpenDataProfileType } from "@/lib/opendata";

interface Props {
  data: OpenDataProfileType;
  year?: number | null;
  /** "distrito" o "barrio" — para el título de la sección */
  scope?: string;
}

interface ProfileItem {
  label: string;
  icon: string;
  value: string;
  sublabel?: string;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

function fmtDec(n: number | null | undefined, d = 1): string {
  if (n == null) return "—";
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${fmtDec(n, 1)}%`;
}

function fmtEur(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${fmtNum(n)}\u00a0€`;
}

export default function OpenDataProfile({ data, year, scope }: Props) {
  const items: ProfileItem[] = [];

  if (data.poblacion != null) {
    items.push({
      label: "Población",
      icon: "👥",
      value: fmtNum(data.poblacion),
      sublabel: "habitantes",
    });
  }

  if (data.edad_media != null) {
    items.push({
      label: "Edad media",
      icon: "📅",
      value: `${fmtDec(data.edad_media)} años`,
    });
  }

  if (data.pct_extranjeros != null) {
    items.push({
      label: "Extranjeros",
      icon: "🌍",
      value: fmtPct(data.pct_extranjeros),
      sublabel: "de la población",
    });
  }

  if (data.renta_media_hogar != null) {
    items.push({
      label: "Renta por hogar",
      icon: "💰",
      value: fmtEur(data.renta_media_hogar),
      sublabel: "media anual",
    });
  }

  if (data.renta_media_persona != null) {
    items.push({
      label: "Renta per cápita",
      icon: "👤",
      value: fmtEur(data.renta_media_persona),
      sublabel: "media anual",
    });
  }

  if (data.pct_estudios_superiores != null) {
    items.push({
      label: "Estudios superiores",
      icon: "🎓",
      value: fmtPct(data.pct_estudios_superiores),
      sublabel: "de la población",
    });
  }

  if (data.densidad_hab_ha != null) {
    items.push({
      label: "Densidad",
      icon: "🏙️",
      value: `${fmtNum(data.densidad_hab_ha)} hab/ha`,
    });
  }

  if (data.tamano_medio_hogar != null) {
    items.push({
      label: "Tamaño hogar",
      icon: "🏠",
      value: `${fmtDec(data.tamano_medio_hogar)} personas`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3">
        Perfil socioeconómico{scope ? ` de ${scope}` : ""}
        {year && (
          <span className="text-slate-500 font-normal text-xs ml-2">
            ({year})
          </span>
        )}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-slate-400 text-xs">{item.label}</span>
            </div>
            <div className="text-white text-lg font-semibold">{item.value}</div>
            {item.sublabel && (
              <div className="text-slate-500 text-xs mt-0.5">
                {item.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-[10px] mt-2">
        Fuente: Ayuntamiento de Madrid — Panel de indicadores de distritos y
        barrios
      </p>
    </div>
  );
}
