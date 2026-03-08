"use client";

import type { Alert } from "@/lib/types";

interface Props {
  alerts: Alert[];
}

const levelStyles: Record<string, { bg: string; border: string; icon: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "🔴" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "🟡" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "🔵" },
};

export default function AlertsBanner({ alerts }: Props) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-white font-semibold text-sm mb-2">Alertas de mercado</h3>
      {alerts.map((alert, i) => {
        const style = levelStyles[alert.level] ?? levelStyles.info;
        return (
          <div
            key={i}
            className={`rounded-lg ${style.bg} border ${style.border} px-4 py-2.5 flex items-start gap-3`}
          >
            <span className="text-sm mt-0.5">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium">{alert.title}</span>
              <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
