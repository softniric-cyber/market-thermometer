"use client";

import { Link } from "@/i18n/navigation";
import type { BlogPostMeta } from "@/lib/blog/types";
import { fmtDate } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface Props {
  post: BlogPostMeta;
}

export default function PostCard({ post }: Props) {
  const t = useTranslations("blog");
  const locale = useLocale();

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-xl bg-slate-800/60 border border-slate-700/50 px-5 py-4 hover:bg-slate-700/40 hover:border-slate-600/60 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm hover:text-cyan-300 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
            {post.description}
          </p>
        </div>
        <span className="text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
          {post.category}
        </span>
      </div>
      <p className="text-slate-500 text-[10px] mt-3">
        {fmtDate(post.publishedAt, locale)}
        {post.type === "auto" && (
          <span className="ml-2 text-cyan-600">● {t("live_data")}</span>
        )}
      </p>
    </Link>
  );
}
