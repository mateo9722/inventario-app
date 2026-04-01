import React from "react";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";

type SalesPerformanceProps = {
  salesToday: number;
  sales7dAvg: number;
  salesThisMonth: number;
  salesLastMonth: number;
  salesChangePercent: number;
  revenueToday: number;
  revenueThisMonth: number;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("es-EC", { style: "currency", currency: "USD" });

export default function SalesPerformance({
  salesToday,
  sales7dAvg,
  salesThisMonth,
  salesLastMonth,
  salesChangePercent,
  revenueToday,
  revenueThisMonth,
}: SalesPerformanceProps) {
  const isUp = salesChangePercent > 0;
  const isDown = salesChangePercent < 0;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-secondary" />
          Rendimiento de Ventas
        </h3>
        {salesChangePercent !== 0 && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
              isUp
                ? "bg-emerald-500/10 text-emerald-600"
                : isDown
                ? "bg-error/10 text-error"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isDown ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            {isUp ? "+" : ""}
            {salesChangePercent}% vs mes anterior
          </div>
        )}
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Ingresos hoy
          </span>
          <span className="text-2xl font-black text-secondary font-[var(--font-manrope)] leading-tight">
            {formatCurrency(revenueToday)}
          </span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Ingresos este mes
          </span>
          <span className="text-2xl font-black text-on-surface font-[var(--font-manrope)] leading-tight">
            {formatCurrency(revenueThisMonth)}
          </span>
        </div>
      </div>

      {/* Sales units row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
          <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Ventas hoy
          </span>
          <span className="text-xl font-black text-on-surface font-[var(--font-manrope)]">
            {salesToday}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant">
            botellones netos
          </span>
        </div>
        <div className="flex flex-col bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
          <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Prom. 7 días
          </span>
          <span className="text-xl font-black text-on-surface font-[var(--font-manrope)]">
            {sales7dAvg}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant">
            por día
          </span>
        </div>
        <div className="flex flex-col bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
          <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Este mes
          </span>
          <span className="text-xl font-black text-on-surface font-[var(--font-manrope)]">
            {salesThisMonth}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant">
            {salesLastMonth > 0 ? `vs ${salesLastMonth} anterior` : "botellones"}
          </span>
        </div>
      </div>
    </div>
  );
}
