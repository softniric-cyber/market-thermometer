"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = { es: "ES", en: "EN" };

export default function LanguageSwitch() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-800/80 border border-slate-700/60 px-1 py-0.5 text-xs backdrop-blur">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
            l === locale
              ? "bg-teal-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
