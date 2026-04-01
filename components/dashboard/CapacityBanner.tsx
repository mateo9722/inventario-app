import React from "react";
import { Package, AlertTriangle } from "lucide-react";
import Link from "next/link";

type CapacityBannerProps = {
  capacityAvailable: number;
  potentialRevenue: number;
  averagePrice: number;
};

export default function CapacityBanner({
  capacityAvailable,
  potentialRevenue,
  averagePrice,
}: CapacityBannerProps) {
  const isCritical = capacityAvailable === 0;
  const isLow = capacityAvailable > 0 && capacityAvailable < 5;

  if (isCritical) {
    return (
      <div className="bg-error/10 border-2 border-error/30 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="text-lg font-black text-error font-[var(--font-manrope)]">
              No puedes vender más hoy
            </p>
            <p className="text-sm font-medium text-error/80">
              Recarga botellones vacíos o espera devoluciones de clientes.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/inventory"
          className="shrink-0 px-6 py-3 rounded-xl bg-error text-white text-sm font-bold hover:bg-error/90 shadow-lg shadow-error/20 active:scale-95 transition-all uppercase tracking-widest"
        >
          Ir a Inventario
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-sm transition-all ${
        isLow
          ? "bg-orange-500/5 border-orange-400/30"
          : "bg-primary/5 border-primary/20"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isLow ? "bg-orange-500/15 text-orange-600" : "bg-primary/10 text-primary"
          }`}
        >
          <Package className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">
            Capacidad disponible
          </p>
          <p className={`text-2xl font-black font-[var(--font-manrope)] leading-none ${
            isLow ? "text-orange-600" : "text-primary"
          }`}>
            Puedes vender{" "}
            <span className="text-3xl">{capacityAvailable}</span> botellones hoy
          </p>
        </div>
      </div>

      {potentialRevenue > 0 && averagePrice > 0 && (
        <div className={`shrink-0 px-5 py-3 rounded-2xl border flex flex-col items-end ${
          isLow
            ? "bg-orange-50 border-orange-200"
            : "bg-primary/5 border-primary/20"
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Potencial de ingreso
          </span>
          <span className={`text-xl font-black font-[var(--font-manrope)] leading-tight ${
            isLow ? "text-orange-600" : "text-primary"
          }`}>
            ${potentialRevenue.toFixed(2)}
          </span>
          <span className="text-[9px] font-medium text-on-surface-variant">
            Precio prom. ${averagePrice.toFixed(2)}/ud.
          </span>
        </div>
      )}
    </div>
  );
}
