// ============================================
// FUNCIONES PURAS DE CÁLCULO — DASHBOARD
// Sin side-effects. Reciben datos, retornan resultados.
// ============================================

import type {
  Inventory,
  Customer,
  Delivery,
  Payment,
  InventoryMovement,
  DailyMetric,
  Alert,
  Insight,
  ActivityItem,
  RotationDay,
  TrendDataPoint,
} from "./types";

// ============================================
// HELPERS
// ============================================

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  const name = date.toLocaleDateString("es-EC", { month: "short", year: "numeric" });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ============================================
// VENTAS
// ============================================

export type SalesResult = {
  salesToday: number;
  salesYesterday: number;
  sales7dAvg: number;
  salesThisMonth: number;
  salesLastMonth: number;
  salesChangePercent: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  averagePrice: number;
};

export function calculateSales(deliveries: Delivery[]): SalesResult {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = daysAgo(1);
  const sevenDaysAgo = daysAgo(7);

  const thisMonthKey = getMonthKey(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(lastMonth);

  let salesToday = 0;
  let revenueToday = 0;
  let salesYesterday = 0;
  let salesThisMonth = 0;
  let revenueThisMonth = 0;
  let salesLastMonth = 0;
  let revenueLastMonth = 0;
  let sales7d = 0;
  let totalRevenue = 0;
  let totalSalesUnits = 0;

  for (const d of deliveries) {
    const date = new Date(d.date);
    const netSales = d.delivered - d.returned;
    const mk = getMonthKey(date);

    if (isSameDay(date, now)) {
      salesToday += netSales;
      revenueToday += d.total;
    }

    if (isSameDay(date, yesterday)) {
      salesYesterday += netSales;
    }

    if (date >= sevenDaysAgo) {
      sales7d += netSales;
    }

    if (mk === thisMonthKey) {
      salesThisMonth += netSales;
      revenueThisMonth += d.total;
    }

    if (mk === lastMonthKey) {
      salesLastMonth += netSales;
      revenueLastMonth += d.total;
    }

    totalRevenue += d.total;
    totalSalesUnits += d.delivered;
  }

  const sales7dAvg = sales7d > 0 ? Math.round(sales7d / 7) : 0;

  let salesChangePercent = 0;
  if (salesLastMonth > 0) {
    salesChangePercent = Number(
      (((salesThisMonth - salesLastMonth) / salesLastMonth) * 100).toFixed(1)
    );
  }

  // Precio promedio real derivado de datos, NO hardcodeado
  const averagePrice =
    totalSalesUnits > 0 ? Number((totalRevenue / totalSalesUnits).toFixed(2)) : 0;

  return {
    salesToday,
    salesYesterday,
    sales7dAvg,
    salesThisMonth,
    salesLastMonth,
    salesChangePercent,
    revenueToday,
    revenueThisMonth,
    revenueLastMonth,
    averagePrice,
  };
}

// ============================================
// CAPACIDAD
// ============================================

export type CapacityResult = {
  full: number;
  reserved: number;
  capacityAvailable: number;
  totalSystem: number;
  borrowed: number;
  borrowedPercent: number;
  empty: number;
};

export function calculateCapacity(
  inventory: Inventory,
  customers: Customer[]
): CapacityResult {
  const borrowed = customers.reduce(
    (acc, c) => acc + (c.borrowedContainers || 0),
    0
  );
  const reserved = inventory.reservedForNextDay || 0;
  const totalSystem = inventory.full + inventory.empty + borrowed + reserved;
  const capacityAvailable = inventory.full;
  const borrowedPercent =
    totalSystem > 0 ? Math.round((borrowed / totalSystem) * 100) : 0;

  return {
    full: inventory.full,
    reserved,
    capacityAvailable,
    totalSystem,
    borrowed,
    borrowedPercent,
    empty: inventory.empty,
  };
}

// ============================================
// ROTACIÓN
// ============================================

export function calculateRotation(
  deliveredToday: number,
  totalSystem: number
): { rotation: number; level: "high" | "medium" | "low" } {
  const rotation = totalSystem > 0 ? Number((deliveredToday / totalSystem).toFixed(1)) : 0;

  let level: "high" | "medium" | "low" = "low";
  if (rotation >= 1.5) level = "high";
  else if (rotation >= 0.5) level = "medium";

  return { rotation, level };
}

// ============================================
// POTENCIAL DE INGRESO
// ============================================

export function calculatePotentialRevenue(
  capacityAvailable: number,
  averagePrice: number
): number {
  return Number((capacityAvailable * averagePrice).toFixed(2));
}

// ============================================
// TENDENCIA (últimos 6 meses)
// ============================================

export function calculateTrend(
  deliveries: Delivery[],
  months: number = 6
): TrendDataPoint[] {
  const now = new Date();
  const points: TrendDataPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = getMonthKey(target);
    const label = getMonthLabel(target);

    let totalDeliveries = 0;
    let totalRevenue = 0;

    for (const d of deliveries) {
      const dk = getMonthKey(new Date(d.date));
      if (dk === mk) {
        totalDeliveries += d.delivered - d.returned;
        totalRevenue += d.total;
      }
    }

    points.push({
      month: mk,
      label,
      deliveries: totalDeliveries,
      revenue: totalRevenue,
    });
  }

  return points;
}

// ============================================
// ALERTAS OPERATIVAS
// ============================================

export function generateAlerts(
  capacity: CapacityResult,
  inventory: Inventory
): Alert[] {
  const alerts: Alert[] = [];

  if (capacity.full === 0 && capacity.reserved === 0) {
    alerts.push({
      id: "no-stock",
      level: "critical",
      message: "No tienes botellones disponibles para vender. Recarga o compra stock ahora.",
      action: "Ir a Inventario",
      href: "/dashboard/inventory",
    });
  } else if (capacity.full > 0 && capacity.full < 5) {
    alerts.push({
      id: "low-stock",
      level: "critical",
      message: `Solo quedan ${capacity.full} botellones listos. Stock crítico.`,
      action: "Recargar ahora",
      href: "/dashboard/inventory",
    });
  }

  if (capacity.borrowedPercent > 70) {
    alerts.push({
      id: "high-borrowed",
      level: "warning",
      message: `${capacity.borrowedPercent}% de tus envases están en clientes. Gestiona devoluciones.`,
      action: "Ver Inventario",
      href: "/dashboard/inventory",
    });
  }

  if (inventory.empty === 0 && capacity.full < 10) {
    alerts.push({
      id: "no-empty",
      level: "warning",
      message: "No tienes botellones vacíos para recargar. Espera devoluciones.",
    });
  }

  return alerts;
}

// ============================================
// INSIGHTS ACCIONABLES
// ============================================

export function generateInsights(params: {
  salesChangePercent: number;
  salesToday: number;
  salesYesterday: number;
  sales7dAvg: number;
  borrowed: number;
  capacityAvailable: number;
  rotation: number;
  totalSystem: number;
  empty: number;
  full: number;
  potentialRevenue: number;
}): Insight[] {
  const insights: Insight[] = [];

  // Comparación mensual
  if (params.salesChangePercent !== 0 && params.sales7dAvg > 0) {
    if (params.salesChangePercent < 0) {
      insights.push({
        id: "sales-down",
        type: "warning",
        title: `Ventas bajaron ${Math.abs(params.salesChangePercent)}% este mes`,
        description:
          "Revisa clientes inactivos o ajusta tu estrategia de rutas para recuperar volumen.",
      });
    } else if (params.salesChangePercent > 10) {
      insights.push({
        id: "sales-up",
        type: "success",
        title: `Ventas subieron ${params.salesChangePercent}% este mes`,
        description:
          "¡Buen ritmo! Asegúrate de tener inventario suficiente para mantener la tendencia.",
      });
    }
  }

  // Envases en clientes recuperables
  if (params.borrowed > 0 && params.capacityAvailable < params.sales7dAvg) {
    insights.push({
      id: "recover-borrowed",
      type: "info",
      title: `${params.borrowed} envases están en clientes`,
      description: `Recuperarlos puede aumentar tu capacidad de venta en ${params.borrowed} botellones adicionales.`,
    });
  }

  // Alta rotación con stock apretado
  if (params.rotation >= 1 && params.full < 10 && params.totalSystem > 0) {
    insights.push({
      id: "high-rotation",
      type: "info",
      title: "Alta rotación con stock limitado",
      description:
        "Considera comprar más envases para capitalizar la demanda actual.",
    });
  }

  // Vacíos acumulados
  if (params.empty > params.full * 2 && params.empty > 5) {
    insights.push({
      id: "many-empty",
      type: "warning",
      title: `${params.empty} botellones vacíos esperando recarga`,
      description:
        "Tienes muchos vacíos sin recargar. Llenarlos ahora aumenta tu stock disponible.",
    });
  }

  // Potencial de ingreso relevante
  if (params.potentialRevenue > 0 && params.capacityAvailable > 5) {
    insights.push({
      id: "potential-revenue",
      type: "success",
      title: `Potencial de ingreso: $${params.potentialRevenue.toFixed(2)} hoy`,
      description: `Con ${params.capacityAvailable} botellones disponibles y un precio promedio, podrías generar este ingreso adicional.`,
    });
  }

  // Hoy vs ayer
  if (params.salesToday > 0 && params.salesYesterday > 0) {
    const diff = params.salesToday - params.salesYesterday;
    if (diff > 0) {
      insights.push({
        id: "today-vs-yesterday",
        type: "success",
        title: `Hoy llevas ${diff} botellones más que ayer`,
        description: "Buen ritmo. Mantén la cadencia.",
      });
    }
  }

  return insights;
}

// ============================================
// ACTIVIDAD RECIENTE (merge unificado)
// ============================================

export function getRecentActivity(
  movements: InventoryMovement[],
  deliveries: Delivery[],
  payments: Payment[],
  limit: number = 10
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const d of deliveries) {
    items.push({
      id: `del-${d.id}`,
      type: "delivery",
      title: `Entrega a ${d.customerName}`,
      description: `${d.delivered} entregados, ${d.returned} recogidos`,
      date: d.date,
      amount: d.total,
    });
  }

  for (const p of payments) {
    items.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `Pago de ${p.customerName}`,
      description: `$${p.amount.toFixed(2)} vía ${p.method === "cash" ? "efectivo" : "transferencia"}`,
      date: p.date,
      amount: p.amount,
    });
  }

  for (const m of movements) {
    let type: ActivityItem["type"] = "adjustment";
    let title = "Ajuste de inventario";
    let description = "";

    switch (m.type) {
      case "refill":
      case "refill_deferred":
        type = "refill";
        title = "Recarga de botellones";
        description = `${Math.abs(m.emptyChange)} vacíos → llenos`;
        break;
      case "purchase":
        type = "purchase";
        title = "Compra de stock";
        description = `+${m.fullChange} botellones nuevos`;
        break;
      case "loss":
        type = "loss";
        title = "Pérdida registrada";
        description = m.reference || "Botellones dados de baja";
        break;
      case "AUDITORIA":
        type = "audit";
        title = "Auditoría de inventario";
        description = m.difference
          ? `Diferencia: ${m.difference > 0 ? "+" : ""}${m.difference} envases`
          : "Inventario calibrado";
        break;
      case "DEVOLUCION":
        type = "return";
        title = `Devolución de ${m.customerName || "cliente"}`;
        description = `+${m.emptyChange} vacíos recuperados`;
        break;
      // Skip delivery movements—already captured from deliveries array
      case "delivery_internal":
      case "delivery_external":
        continue;
      default:
        description = m.reference || "Movimiento de inventario";
    }

    items.push({
      id: `mov-${m.id}`,
      type,
      title,
      description,
      date: m.date,
    });
  }

  // Ordenar por fecha descendente y limitar
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, limit);
}

// ============================================
// ROTACIÓN HISTÓRICA (últimos N días)
// ============================================

export function getRotationHistory(
  metrics: DailyMetric[],
  days: number = 7
): RotationDay[] {
  if (!metrics || metrics.length === 0) return [];

  const sorted = [...metrics]
    .filter((m) => m.closedAt && !isNaN(new Date(m.closedAt).getTime()))
    .sort(
      (a, b) =>
        new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
    );

  return sorted.slice(0, days).reverse().map((m) => {
    const d = new Date(m.closedAt);
    return {
      date: m.closedAt,
      label: d.toLocaleDateString("es-EC", {
        weekday: "short",
        day: "2-digit",
      }),
      rotation: m.rotation,
      delivered: m.delivered,
    };
  });
}

// ============================================
// ENTREGAS DEL TURNO ACTUAL
// ============================================

export function getCurrentTurnDeliveries(
  deliveries: Delivery[],
  metrics: DailyMetric[]
): { deliveredToday: number; returnedToday: number } {
  const lastClosedAt =
    metrics.length > 0 ? new Date(metrics[0].closedAt).getTime() : 0;

  // Las métricas deben estar ordenadas desc para que metrics[0] sea la más reciente
  const sortedMetrics = [...metrics]
    .filter((m) => m.closedAt && !isNaN(new Date(m.closedAt).getTime()))
    .sort(
      (a, b) =>
        new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
    );

  const effectiveLastClosed =
    sortedMetrics.length > 0
      ? new Date(sortedMetrics[0].closedAt).getTime()
      : 0;

  let deliveredToday = 0;
  let returnedToday = 0;

  for (const d of deliveries) {
    if (!d.date) continue;
    if (new Date(d.date).getTime() > effectiveLastClosed) {
      deliveredToday += d.delivered || 0;
      returnedToday += d.returned || 0;
    }
  }

  return { deliveredToday, returnedToday };
}
