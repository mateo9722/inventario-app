import React from "react";
import type { ReactNode } from "react";

type KPIItemProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  color: string; // tailwind color class prefix e.g. "primary", "orange-500"
  trend?: { value: number; label: string };
};

export default function KPIItem({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
}: KPIItemProps) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-2 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest`}>
            <div className={`w-9 h-9 rounded-xl bg-${color}/10 flex items-center justify-center text-${color} group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            {title}
          </div>
        </div>

        <p className="text-4xl font-black text-on-surface font-[var(--font-manrope)] leading-none mb-1">
          {value}
        </p>
        <p className="text-[11px] font-medium text-on-surface-variant mt-1 leading-tight">
          {subtitle}
        </p>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-black ${
                trend.value > 0
                  ? "text-emerald-600"
                  : trend.value < 0
                  ? "text-error"
                  : "text-on-surface-variant"
              }`}
            >
              {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "—"}{" "}
              {Math.abs(trend.value)}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              {trend.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
