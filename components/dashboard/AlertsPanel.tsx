import React from "react";
import { AlertTriangle, Info, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Alert } from "@/lib/types";

type AlertsPanelProps = {
  alerts: Alert[];
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const isCritical = alert.level === "critical";
        const isWarning = alert.level === "warning";

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl flex items-center justify-between gap-4 font-bold border transition-all animate-in fade-in slide-in-from-top-4 ${
              isCritical
                ? "bg-error-container text-on-error-container border-error/50 shadow-md shadow-error/10"
                : isWarning
                ? "bg-orange-500/10 text-orange-700 border-orange-500/40"
                : "bg-blue-500/10 text-blue-700 border-blue-500/40"
            }`}
          >
            <div className="flex items-center gap-3">
              {isCritical ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm leading-tight">{alert.message}</span>
            </div>

            {alert.href && alert.action && (
              <Link
                href={alert.href}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 ${
                  isCritical
                    ? "bg-error text-white hover:bg-error/90 shadow-md shadow-error/20"
                    : isWarning
                    ? "bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200"
                    : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
                }`}
              >
                {alert.action}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
