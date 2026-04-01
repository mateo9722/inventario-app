import React from "react";
import { LayoutDashboard } from "lucide-react";

type DashboardHeaderProps = {
  alertCount: number;
  capacityAvailable: number;
};

export default function DashboardHeader({
  alertCount,
  capacityAvailable,
}: DashboardHeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  let statusColor = "bg-emerald-500";
  let statusText = "Operación normal";

  if (alertCount > 0 && capacityAvailable === 0) {
    statusColor = "bg-error";
    statusText = "Atención requerida";
  } else if (alertCount > 0) {
    statusColor = "bg-orange-400";
    statusText = "Revisar alertas";
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-[var(--font-manrope)] flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          Centro de Control
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">
          {capitalizedDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2.5 rounded-2xl border border-outline-variant/30 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor} ${alertCount > 0 ? "animate-pulse" : ""}`} />
          <span className="text-xs font-bold text-on-surface uppercase tracking-widest">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
