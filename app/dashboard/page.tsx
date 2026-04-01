"use client";

import React from "react";
import { useDashboardData } from "@/hooks/useDashboardData";

// Componentes puros — solo reciben datos via props
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import CapacityBanner from "@/components/dashboard/CapacityBanner";
import KPIGrid from "@/components/dashboard/KPIGrid";
import SalesPerformance from "@/components/dashboard/SalesPerformance";
import InventorySummary from "@/components/dashboard/InventorySummary";
import TrendChart from "@/components/dashboard/TrendChart";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RotationHistory from "@/components/dashboard/RotationHistory";

// ============================================
// DASHBOARD PAGE — SOLO COMPOSICIÓN
// Cero lógica. Cero cálculos. Cero localStorage.
// ============================================

export default function DashboardPage() {
  const data = useDashboardData();

  if (data.isLoading) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
          Cargando dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header con estado del sistema */}
      <DashboardHeader
        alertCount={data.alerts.length}
        capacityAvailable={data.capacityAvailable}
      />

      {/* 2. Alertas operativas (si existen) */}
      <AlertsPanel alerts={data.alerts} />

      {/* 3. Banner de capacidad — PROTAGONISTA */}
      <CapacityBanner
        capacityAvailable={data.capacityAvailable}
        potentialRevenue={data.potentialRevenue}
        averagePrice={data.averagePrice}
      />

      {/* 4. KPIs principales */}
      <KPIGrid
        capacityAvailable={data.capacityAvailable}
        reserved={data.reserved}
        borrowed={data.borrowed}
        deliveredToday={data.deliveredToday}
        rotation={data.rotation}
      />

      {/* 5. Ventas + Inventario lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesPerformance
          salesToday={data.salesToday}
          sales7dAvg={data.sales7dAvg}
          salesThisMonth={data.salesThisMonth}
          salesLastMonth={data.salesLastMonth}
          salesChangePercent={data.salesChangePercent}
          revenueToday={data.revenueToday}
          revenueThisMonth={data.revenueThisMonth}
        />
        <InventorySummary
          full={data.full}
          empty={data.empty}
          borrowed={data.borrowed}
          reserved={data.reserved}
          total={data.total}
        />
      </div>

      {/* 6. Gráfico de tendencia (6 meses) */}
      <TrendChart data={data.trendData} />

      {/* 7. Insights + Actividad reciente lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightsPanel insights={data.insights} />
        <RecentActivity items={data.recentActivity} />
      </div>

      {/* 8. Rotación histórica (7 días) */}
      <RotationHistory data={data.rotationHistory} />
    </div>
  );
}
