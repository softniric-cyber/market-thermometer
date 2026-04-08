"use client";

import { Link } from "@/i18n/navigation";
import { toBarrioSlug } from "@/lib/barrios";

export interface RankingRow {
  barrio: string;
  distrito: string;
  value: string;
  extra?: string;
  badge?: { text: string; color: string };
}

export default function RankingTable({
  rows,
  valueLabel,
  extraLabel,
  locale,
}: {
  rows: RankingRow[];
  valueLabel: string;
  extraLabel?: string;
  locale: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
            <th className="py-3 px-2 text-left w-10">#</th>
            <th className="py-3 px-3 text-left">Barrio</th>
            <th className="py-3 px-3 text-left">Distrito</th>
            <th className="py-3 px-3 text-right">{valueLabel}</th>
            {extraLabel && (
              <th className="py-3 px-3 text-right hidden sm:table-cell">
                {extraLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.barrio}
              className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-2 text-slate-500 font-mono">{i + 1}</td>
              <td className="py-3 px-3">
                <Link
                  href={`/barrio/${toBarrioSlug(row.barrio)}`}
                  locale={locale}
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {row.barrio}
                </Link>
                {row.badge && (
                  <span
                    className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${row.badge.color}`}
                  >
                    {row.badge.text}
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-slate-400">{row.distrito}</td>
              <td className="py-3 px-3 text-right font-semibold text-slate-200">
                {row.value}
              </td>
              {extraLabel && (
                <td className="py-3 px-3 text-right text-slate-400 hidden sm:table-cell">
                  {row.extra ?? "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
