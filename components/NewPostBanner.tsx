"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  slug: string;
  title: string;
}

export default function NewPostBanner({ slug, title }: Props) {
  const t = useTranslations("common");

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex items-center gap-3 w-full rounded-xl px-4 py-3 mb-8
        bg-gradient-to-r from-cyan-500/15 via-cyan-400/10 to-transparent
        border border-cyan-500/30 hover:border-cyan-400/60
        hover:from-cyan-500/20 hover:via-cyan-400/15
        transition-all duration-200"
    >
      {/* Badge */}
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest
        bg-cyan-500 text-slate-900 px-2 py-0.5 rounded-full">
        {t("new_article")}
      </span>

      {/* Title */}
      <span className="text-cyan-100 text-sm font-medium leading-snug
        group-hover:text-white transition-colors line-clamp-1 flex-1">
        {title}
      </span>

      {/* CTA */}
      <span className="shrink-0 text-cyan-400 text-xs font-semibold
        group-hover:text-cyan-300 group-hover:translate-x-0.5
        transition-all duration-150">
        {t("read_article")}
      </span>
    </Link>
  );
}
