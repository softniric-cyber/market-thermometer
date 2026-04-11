"use client";

import { timeAgo } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  generatedAt: string;
}

/** Scraping schedule: Monday (1) and Thursday (4) at 08:00 Madrid time */
const SCRAPE_DAYS = [1, 4]; // 0=Sun, 1=Mon, …, 4=Thu

function getNextUpdate(locale: string): string {
  const now = new Date();
  const candidate = new Date(now);
  // Walk forward up to 7 days to find next scrape day
  for (let i = 1; i <= 7; i++) {
    candidate.setDate(now.getDate() + i);
    if (SCRAPE_DAYS.includes(candidate.getDay())) {
      return candidate.toLocaleDateString(
        locale === "en" ? "en-GB" : "es-ES",
        { weekday: "long", day: "numeric", month: "long" }
      );
    }
  }
  return "";
}

export default function Footer({ generatedAt }: Props) {
  const t = useTranslations("footer");
  const locale = useLocale();
  const ago = timeAgo(generatedAt, locale);
  const diffH = (Date.now() - new Date(generatedAt).getTime()) / 3_600_000;
  const isStale = diffH > 96; // >4 days = stale (schedule is every 3-4 days)
  const nextUpdate = getNextUpdate(locale);

  return (
    <footer className="mt-12 border-t border-slate-800 pt-6 pb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{t("data_updated", { ago })}</span>
          {nextUpdate && (
            <span className="text-slate-400">
              · {t("next_update", { date: nextUpdate })}
            </span>
          )}
          {isStale && (
            <span className="inline-block bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px]">
              {t("old_data")}
            </span>
          )}
        </div>
        <div className="text-center sm:text-right">
          <span>{t("source")}</span>
          <br />
          <span className="text-slate-600">
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </footer>
  );
}
