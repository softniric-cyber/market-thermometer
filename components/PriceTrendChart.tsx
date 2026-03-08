"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

interface Props {
  data: TrendPoint[];
}

export default function PriceTrendChart({ data }: Props) {
  if (!data || data.length < 2) {
    return (
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6 text-slate-500 text-sm text-center">
        Datos insuficientes para mostrar tendencia
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map((pt) => ({
    week: pt.week_start
      ? new Date(pt.week_start).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
      : pt.week ?? "",
    eurSqm: pt.avg_sqm ? Math.round(pt.avg_sqm) : null,
    price: pt.avg_price ? Math.round(pt.avg_price) : null,
    count: pt.n_listings ?? 0,
  }));

  // Find min/max for Y axis
  const values = chartData.map((d) => d.eurSqm).filter(Boolean) as number[];
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yMin = Math.floor(minVal * 0.95 / 100) * 100;
  const yMax = Math.ceil(maxVal * 1.05 / 100) * 100;

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
      <div className="mb-3">
        <h3 className="text-white font-semibold text-sm">Tendencia €/m²</h3>
        <p className="text-slate-400 text-xs mt-0.5">Evolución semanal del precio por metro cuadrado</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="week"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => [
              `${value.toLocaleString("es-ES")} €/m²`,
              "Precio",
            ]}
          />
          <Line
            type="monotone"
            dataKey="eurSqm"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#06b6d4" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
