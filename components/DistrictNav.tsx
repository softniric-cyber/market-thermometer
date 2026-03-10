import Link from "next/link";
import { DISTRICTS, toSlug } from "@/lib/districts";
import type { Zone } from "@/lib/types";
import { fmtEurSqm } from "@/lib/utils";

interface Props {
  currentDistrict: string;
  zones: Zone[];
}

export default function DistrictNav({ currentDistrict, zones }: Props) {
  const zoneMap = new Map(zones.map((z) => [z.name, z]));

  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3">
        Todos los distritos de Madrid
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {DISTRICTS.map((name) => {
          const slug = toSlug(name);
          const zone = zoneMap.get(name);
          const isCurrent = name === currentDistrict;

          return (
            <Link
              key={slug}
              href={`/distrito/${slug}`}
              className={`rounded-lg px-3 py-2.5 text-sm transition-colors border ${
                isCurrent
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div className="font-medium truncate">{name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {fmtEurSqm(zone?.price_per_sqm)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
