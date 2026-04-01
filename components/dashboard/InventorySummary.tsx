import React from "react";
import { Droplets, Package } from "lucide-react";

type InventorySummaryProps = {
  full: number;
  empty: number;
  borrowed: number;
  reserved: number;
  total: number;
};

export default function InventorySummary({
  full,
  empty,
  borrowed,
  reserved,
  total,
}: InventorySummaryProps) {
  const safeTotal = total > 0 ? total : 1;
  const fullPct = Math.round(((full + reserved) / safeTotal) * 100);
  const emptyPct = Math.round((empty / safeTotal) * 100);
  const borrowedPct = Math.round((borrowed / safeTotal) * 100);

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Inventario Físico
        </h3>
        <span className="text-xs font-black text-on-surface bg-surface-container-low px-3 py-1 rounded-lg border border-outline-variant/30">
          Total: {total}
        </span>
      </div>

      {/* Barra proporcional */}
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface-container-high">
        {fullPct > 0 && (
          <div
            className="bg-primary rounded-l-full transition-all duration-500"
            style={{ width: `${fullPct}%` }}
            title={`Llenos: ${fullPct}%`}
          />
        )}
        {emptyPct > 0 && (
          <div
            className="bg-slate-400 transition-all duration-500"
            style={{ width: `${emptyPct}%` }}
            title={`Vacíos: ${emptyPct}%`}
          />
        )}
        {borrowedPct > 0 && (
          <div
            className="bg-orange-400 rounded-r-full transition-all duration-500"
            style={{ width: `${borrowedPct}%` }}
            title={`Clientes: ${borrowedPct}%`}
          />
        )}
      </div>

      {/* Leyendas */}
      <div className="grid grid-cols-3 gap-3">
        {/* Llenos */}
        <div className="flex flex-col bg-primary/5 border border-primary/20 rounded-2xl p-4 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Llenos
            </span>
          </div>
          <span className="text-2xl font-black text-on-surface font-[var(--font-manrope)] leading-none">
            {full}
          </span>
          {reserved > 0 && (
            <span className="text-[9px] font-bold text-primary mt-1">
              +{reserved} preparados
            </span>
          )}
          <span className="text-[9px] font-medium text-on-surface-variant mt-1">
            Listos para vender
          </span>
        </div>

        {/* Vacíos */}
        <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Vacíos
            </span>
          </div>
          <span className="text-2xl font-black text-on-surface font-[var(--font-manrope)] leading-none">
            {empty}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant mt-1">
            Listos para recargar
          </span>
        </div>

        {/* En Clientes */}
        <div className="flex flex-col bg-orange-50 border border-orange-200 rounded-2xl p-4 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Clientes
            </span>
          </div>
          <span className="text-2xl font-black text-on-surface font-[var(--font-manrope)] leading-none">
            {borrowed}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant mt-1">
            Pendientes retorno
          </span>
        </div>
      </div>
    </div>
  );
}
