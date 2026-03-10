import type { BarrioMetrics } from "@/lib/barrios";
import { fmtEur, fmtEurSqm, fmtNum } from "@/lib/utils";

interface Props {
  metrics: BarrioMetrics;
}

interface KpiCard {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export default function BarrioKpiCards({ metrics }: Props) {
  const { data, madridAvgSqm } = metrics;

  const sqm = data?.price_per_sqm ?? null;
  const sqmVsMadrid =
    sqm && madridAvgSqm
      ? Math.round(((sqm - madridAvgSqm) / madridAvgSqm) * 100)
      : null;

  const cards: KpiCard[] = [
    {
      label: "Precio mediano",
      value: data?.median_price ? fmtEur(data.median_price) : "—",
      sub: data?.avg_rooms ? `${data.avg_rooms.toFixed(1)} hab. · ${data.avg_size_sqm?.toFixed(0) ?? "—"} m²` : undefined,
      color: "text-cyan-300",
    },
    {
      label: "Precio / m²",
      value: sqm ? fmtEurSqm(sqm) : "—",
      sub:
        sqmVsMadrid !== null
          ? sqmVsMadrid > 0
            ? `+${sqmVsMadrid}% vs media Madrid`
            : `${sqmVsMadrid}% vs media Madrid`
          : undefined,
      color: "text-indigo-300",
    },
    {
      label: "Pisos en venta",
      value: fmtNum(data?.active_count ?? null),
      sub: undefined,
      color: "text-slate-300",
    },
    {
      label: "Días en mercado",
      value: data?.avg_days_market != null ? `${data.avg_days_market}d` : "—",
      sub: undefined,
      color: "text-amber-300",
    },
    ...(data?.gross_yield != null
      ? [
          {
            label: "Rentabilidad alquiler",
            value: `${data.gross_yield.toFixed(1)}%`,
            sub: data.rent_median
              ? `Renta mediana: ${fmtEur(data.rent_median)}/mes`
              : undefined,
            color: "text-emerald-300",
          } satisfies KpiCard,
        ]
      : []),
  ];

  return (
    <div className={`grid gap-3 ${cards.length >= 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3"
        >
          <p className="text-slate-400 text-xs mb-1">{card.label}</p>
          <p className={`font-mono font-semibold text-lg ${card.color}`}>
            {card.value}
          </p>
          {card.sub && (
            <p className="text-slate-500 text-[10px] mt-0.5">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
