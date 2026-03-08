"use client";

import type { RentalYield } from "@/lib/types";
import { fmtPct, fmtEur } from "@/lib/utils";

interface Props {
  yields: RentalYield[];
}

export default function RentalYields({ yields }: Props) {
  if (!yields.length) return null;

  const maxYield = Math.max(...yields.map((y) => y.gross_yield ?? 0));

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-white font-semibold text-sm">Rentabilidad bruta alquiler</h3>
        <p className="text-slate-400 text-xs mt-0.5">
          Top barrios por yield (renta anual / precio venta)
        </p>
      </div>
      <div className="divide-y divide-slate-700/20">
        {yields.slice(0, 10).map((y) => {
          const barW = maxYield > 0 ? ((y.gross_yield ?? 0) / maxYield) * 100 : 0;
          return (
            <div key={y.barrio} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">{y.barrio}</div>
                <div className="text-slate-500 text-[10px]">{y.distrito}</div>
              </div>
              <div className="w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full bg-emerald-500/60"
                  style={{ width: `${barW}%` }}
                />
              </div>
              <div className="text-emerald-400 font-mono text-xs font-semibold w-14 text-right">
                {fmtPct(y.gross_yield)}
              </div>
              <div className="text-slate-500 text-[10px] w-16 text-right hidden md:block">
                {y.rent_median ? `${fmtEur(y.rent_median)}/m` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
