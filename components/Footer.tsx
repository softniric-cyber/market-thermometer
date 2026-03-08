"use client";

import { timeAgo } from "@/lib/utils";

interface Props {
  generatedAt: string;
}

export default function Footer({ generatedAt }: Props) {
  const ago = timeAgo(generatedAt);
  const isStale = (() => {
    const diffH = (Date.now() - new Date(generatedAt).getTime()) / 3_600_000;
    return diffH > 48;
  })();

  return (
    <footer className="mt-12 border-t border-slate-800 pt-6 pb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Datos actualizados {ago}</span>
          {isStale && (
            <span className="inline-block bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px]">
              datos antiguos
            </span>
          )}
        </div>
        <div className="text-center sm:text-right">
          <span>Fuente: datos agregados de mercado inmobiliario Madrid</span>
          <br />
          <span className="text-slate-600">
            Los datos mostrados son orientativos y no constituyen asesoramiento financiero
          </span>
        </div>
      </div>
    </footer>
  );
}
