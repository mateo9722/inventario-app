"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { RotationDay } from "@/lib/types";

type RotationHistoryProps = {
  data: RotationDay[];
};

export default function RotationHistory({ data }: RotationHistoryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
          <RotateCcw className="w-4 h-4 text-primary" />
          Rotación — Últimos 7 días
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
          <RotateCcw className="w-8 h-8 mb-2" />
          <p className="text-sm font-bold">Sin historial de rotación</p>
          <p className="text-xs font-medium mt-1">
            Se registrará al cerrar turnos operativos.
          </p>
        </div>
      </div>
    );
  }

  const maxRotation = Math.max(...data.map((d) => d.rotation), 1);

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
      <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-6">
        <RotateCcw className="w-4 h-4 text-primary" />
        Rotación — Últimos 7 días
      </h3>

      <div className="flex items-end justify-between gap-2 h-36">
        {data.map((day, i) => {
          const heightPct = Math.max((day.rotation / maxRotation) * 100, 4);
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1 relative group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap z-10 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                  <p>{day.rotation}x rotación</p>
                  <p className="text-surface/70 font-medium">
                    {day.delivered} despachos
                  </p>
                </div>
              )}

              {/* Bar */}
              <div
                className={`w-full max-w-[40px] rounded-t-xl transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? "bg-primary shadow-lg shadow-primary/20"
                    : "bg-primary/60 hover:bg-primary/80"
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Value label */}
              <span className="text-xs font-black text-on-surface mt-2 font-[var(--font-manrope)]">
                {day.rotation}x
              </span>

              {/* Day label */}
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
