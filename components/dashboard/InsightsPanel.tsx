import React from "react";
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Insight } from "@/lib/types";

type InsightsPanelProps = {
  insights: Insight[];
};

const iconMap = {
  success: <CheckCircle2 className="w-4 h-4" />,
  warning: <TrendingDown className="w-4 h-4" />,
  info: <AlertCircle className="w-4 h-4" />,
  danger: <TrendingDown className="w-4 h-4" />,
};

const colorMap = {
  success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  warning: "bg-orange-500/10 text-orange-700 border-orange-400/20",
  info: "bg-primary/10 text-primary border-primary/20",
  danger: "bg-error/10 text-error border-error/20",
};

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-orange-400" />
          Insights del Negocio
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
          <Lightbulb className="w-10 h-10 mb-2" />
          <p className="text-sm font-bold">Sin insights aún</p>
          <p className="text-xs font-medium mt-1">
            Se generarán a medida que acumules datos de operación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col">
      <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-orange-400" />
        Insights del Negocio
      </h3>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              colorMap[insight.type]
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {iconMap[insight.type]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black leading-tight">
                {insight.title}
              </span>
              <span className="text-xs font-medium mt-1 leading-snug opacity-80">
                {insight.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
