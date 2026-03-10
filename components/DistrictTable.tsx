"use client";

import { useState } from "react";
import Link from "next/link";
import type { Zone } from "@/lib/types";
import { fmtEur, fmtEurSqm, fmtNum } from "@/lib/utils";
import { toSlug } from "@/lib/districts";

interface Props {
  zones: Zone[];
}

type SortKey = "name" | "median_price" | "price_per_sqm" | "active_count" | "days_to_sell";

export default function DistrictTable({ zones }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("price_per_sqm");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  };

  const sorted = [...zones].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    if (typeof va === "string" && typeof vb === "string")
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const cols: { key: SortKey; label: string; fmt: (z: Zone) => string; align?: string }[] = [
    { key: "name", label: "Distrito", fmt: (z) => z.name, align: "text-left" },
    { key: "price_per_sqm", label: "€/m²", fmt: (z) => fmtEurSqm(z.price_per_sqm) },
    { key: "median_price", label: "Precio mediano", fmt: (z) => fmtEur(z.median_price) },
    { key: "active_count", label: "Activos", fmt: (z) => fmtNum(z.active_count ?? null) },
    { key: "days_to_sell", label: "Días venta", fmt: (z) => z.days_to_sell != null ? `${z.days_to_sell}` : "—" },
  ];

  // Color bar for €/m²
  const maxSqm = Math.max(...zones.map((z) => z.price_per_sqm ?? 0));

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-white font-semibold text-sm">Precios por distrito</h3>
        <p className="text-slate-400 text-xs mt-0.5">21 distritos de Madrid — click para ordenar</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-700/30">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className={`px-4 py-2 cursor-pointer hover:text-white transition-colors select-none ${c.align ?? "text-right"}`}
                >
                  {c.label}
                  {sortKey === c.key && (
                    <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((zone, i) => {
              const barW = maxSqm > 0 ? ((zone.price_per_sqm ?? 0) / maxSqm) * 100 : 0;
              return (
                <tr
                  key={zone.name}
                  className={`border-b border-slate-700/20 hover:bg-slate-700/30 transition-colors ${
                    i % 2 === 0 ? "" : "bg-slate-800/30"
                  }`}
                >
                  <td className="px-4 py-2.5 text-left">
                    <Link
                      href={`/distrito/${toSlug(zone.name)}`}
                      className="text-white font-medium hover:text-cyan-300 transition-colors"
                    >
                      {zone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full bg-cyan-500/60"
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                      <span className="text-cyan-300 font-mono text-xs">
                        {fmtEurSqm(zone.price_per_sqm)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300 font-mono text-xs">
                    {fmtEur(zone.median_price)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400 text-xs">
                    {fmtNum(zone.active_count ?? null)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400 text-xs">
                    {zone.days_to_sell != null ? `${zone.days_to_sell}d` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
