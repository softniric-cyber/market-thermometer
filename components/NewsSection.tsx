"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  date: string;
  source: string;
}

interface Props {
  news: NewsItem[];
  /** Max items to show (default 4). Pass Infinity for "all". */
  limit?: number;
  /** Show "Ver todo" link (default true) */
  showSeeAll?: boolean;
}

function timeAgo(dateStr: string, locale: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "es" ? "Hoy" : "Today";
  if (diffDays === 1) return locale === "es" ? "Ayer" : "Yesterday";
  if (diffDays < 7)
    return locale === "es" ? `Hace ${diffDays} días` : `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return locale === "es"
      ? `Hace ${weeks} sem.`
      : `${weeks}w ago`;
  }
  return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function NewsSection({
  news,
  limit = 4,
  showSeeAll = true,
}: Props) {
  const t = useTranslations("news");

  if (!news || news.length === 0) return null;

  const visible = limit === Infinity ? news : news.slice(0, limit);

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="text-lg">📰</span>
        {t("title")}
      </h3>

      <ul className="space-y-4">
        {visible.map((item, i) => (
          <li key={i}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <p className="text-cyan-100 text-sm font-medium leading-snug
                group-hover:text-cyan-300 transition-colors line-clamp-2">
                {item.title}
              </p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                {item.summary}
              </p>
              <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-2">
                <span className="text-cyan-500/70">{item.source}</span>
                <span>·</span>
                <span>{timeAgo(item.date, "es")}</span>
              </p>
            </a>
            {i < visible.length - 1 && (
              <hr className="border-slate-700/40 mt-4" />
            )}
          </li>
        ))}
      </ul>

      {showSeeAll && news.length > limit && (
        <Link
          href="/noticias"
          className="block text-center text-cyan-400 hover:text-cyan-300 text-xs
            font-medium mt-4 pt-3 border-t border-slate-700/40 transition-colors"
        >
          {t("see_all")} →
        </Link>
      )}
    </div>
  );
}
