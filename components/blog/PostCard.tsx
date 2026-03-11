import Link from "next/link";
import type { BlogPostMeta } from "@/lib/blog/types";

interface Props {
  post: BlogPostMeta;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PostCard({ post }: Props) {
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
        {formatDate(post.publishedAt)}
        {post.type === "auto" && (
          <span className="ml-2 text-cyan-600">● Datos en vivo</span>
        )}
      </p>
    </Link>
  );
}
