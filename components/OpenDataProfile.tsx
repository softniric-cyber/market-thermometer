"use client";

import type { OpenDataProfile as OpenDataProfileType } from "@/lib/opendata";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  data: OpenDataProfileType;
  year?: number | null;
  /** "distrito" o "barrio" — para el título de la sección */
  scope?: string;
}

interface ProfileItem {
  labelKey: string;
  icon: string;
  value: string;
  sublabelKey?: string;
}

function fmtNum(n: number | null | undefined, locale: string): string {
  if (n == null) return "—";
  const localeStr = locale === "en" ? "en-GB" : "es-ES";
  return n.toLocaleString(localeStr, { maximumFractionDigits: 0 });
}

function fmtDec(n: number | null | undefined, locale: string, d = 1): string {
  if (n == null) return "—";
  const localeStr = locale === "en" ? "en-GB" : "es-ES";
  return n.toLocaleString(localeStr, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function fmtPct(n: number | null | undefined, locale: string): string {
  if (n == null) return "—";
  return `${fmtDec(n, locale, 1)}%`;
}

function fmtEur(n: number | null | undefined, locale: string): string {
  if (n == null) return "—";
  return `${fmtNum(n, locale)}\u00a0€`;
}

export default function OpenDataProfile({ data, year, scope }: Props) {
  const t = useTranslations("opendata");
  const locale = useLocale();
  const items: ProfileItem[] = [];

  if (data.poblacion != null) {
    items.push({
      labelKey: "population",
      icon: "👥",
      value: fmtNum(data.poblacion, locale),
      sublabelKey: "population_sublabel",
    });
  }

  if (data.edad_media != null) {
    items.push({
      labelKey: "median_age",
      icon: "📅",
      value: `${fmtDec(data.edad_media, locale)} ${t("median_age_suffix")}`,
    });
  }

  // Guard: only show if it's a valid percentage (≤ 100)
  if (data.pct_extranjeros != null && data.pct_extranjeros <= 100) {
    items.push({
      labelKey: "foreigners",
      icon: "🌍",
      value: fmtPct(data.pct_extranjeros, locale),
      sublabelKey: "foreigners_sublabel",
    });
  }

  if (data.renta_media_hogar != null) {
    items.push({
      labelKey: "household_income",
      icon: "💰",
      value: fmtEur(data.renta_media_hogar, locale),
      sublabelKey: "household_income_sublabel",
    });
  }

  if (data.renta_media_persona != null) {
    items.push({
      labelKey: "per_capita_income",
      icon: "👤",
      value: fmtEur(data.renta_media_persona, locale),
      sublabelKey: "per_capita_income_sublabel",
    });
  }

  // Guard: only show if it's a valid percentage (≤ 100)
  if (data.pct_estudios_superiores != null && data.pct_estudios_superiores <= 100) {
    items.push({
      labelKey: "higher_education",
      icon: "🎓",
      value: fmtPct(data.pct_estudios_superiores, locale),
      sublabelKey: "higher_education_sublabel",
    });
  }

  if (data.densidad_hab_ha != null) {
    items.push({
      labelKey: "density",
      icon: "🏙️",
      value: `${fmtNum(data.densidad_hab_ha, locale)} ${t("density_suffix")}`,
    });
  }

  if (data.tamano_medio_hogar != null) {
    items.push({
      labelKey: "household_size",
      icon: "🏠",
      value: `${fmtDec(data.tamano_medio_hogar, locale)} ${t("household_size_suffix")}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3">
        {scope ? t("profile_with_scope", { scope }) : t("profile_title")}
        {year && (
          <span className="text-slate-500 font-normal text-xs ml-2">
            ({year})
          </span>
        )}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.labelKey}
            className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{item.icon}</span>
              <span className="text-slate-400 text-xs">{t(item.labelKey)}</span>
            </div>
            <div className="text-white text-lg font-semibold">{item.value}</div>
            {item.sublabelKey && (
              <div className="text-slate-500 text-xs mt-0.5">
                {t(item.sublabelKey)}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-[10px] mt-2">
        {t("source")}
      </p>
    </div>
  );
}
