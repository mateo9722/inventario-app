import React from "react";
import {
  Truck,
  RotateCcw,
  Package,
  Banknote,
  ShoppingCart,
  Trash2,
  Settings2,
  Clock,
} from "lucide-react";
import type { ActivityItem } from "@/lib/types";

type RecentActivityProps = {
  items: ActivityItem[];
};

const typeConfig: Record<
  ActivityItem["type"],
  { icon: React.ReactNode; color: string }
> = {
  delivery: {
    icon: <Truck className="w-3.5 h-3.5" />,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  refill: {
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  return: {
    icon: <Package className="w-3.5 h-3.5" />,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  payment: {
    icon: <Banknote className="w-3.5 h-3.5" />,
    color: "bg-secondary/10 text-secondary border-secondary/20",
  },
  purchase: {
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  loss: {
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: "bg-error/10 text-error border-error/20",
  },
  audit: {
    icon: <Settings2 className="w-3.5 h-3.5" />,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  adjustment: {
    icon: <Settings2 className="w-3.5 h-3.5" />,
    color: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
  },
};

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
  });
}

export default function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col">
        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          Actividad Reciente
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
          <Clock className="w-8 h-8 mb-2" />
          <p className="text-sm font-bold">Sin actividad reciente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col">
      <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        Actividad Reciente
      </h3>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {items.map((item) => {
          const config = typeConfig[item.type] || typeConfig.adjustment;

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}
              >
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface leading-tight truncate">
                  {item.title}
                </p>
                <p className="text-[11px] font-medium text-on-surface-variant leading-tight mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {formatTimeAgo(item.date)}
                </span>
                {item.amount !== undefined && item.amount > 0 && (
                  <span className="text-xs font-black text-secondary mt-0.5">
                    ${item.amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
