"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  Inventory,
  Customer,
  Delivery,
  Payment,
  InventoryMovement,
  DailyMetric,
  DashboardData,
} from "@/lib/types";
import {
  INVENTORY_KEY,
  MOVEMENTS_KEY,
  CUSTOMERS_KEY,
  DELIVERIES_KEY,
  PAYMENTS_KEY,
  DAILY_METRICS_KEY,
} from "@/lib/constants";
import {
  calculateSales,
  calculateCapacity,
  calculateRotation,
  calculatePotentialRevenue,
  calculateTrend,
  generateAlerts,
  generateInsights,
  getRecentActivity,
  getRotationHistory,
  getCurrentTurnDeliveries,
} from "@/lib/dashboard-calculations";

// ============================================
// HOOK CENTRAL DEL DASHBOARD
// ============================================
// Lee localStorage, calcula TODO con funciones puras,
// y expone un objeto DashboardData completo.
// ============================================

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<Inventory>({
    full: 0,
    empty: 0,
    reservedForNextDay: 0,
    total: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);

  // ============================================
  // CARGA DE DATOS
  // ============================================
  useEffect(() => {
    setInventory(
      safeParse<Inventory>(INVENTORY_KEY, {
        full: 0,
        empty: 0,
        reservedForNextDay: 0,
        total: 0,
      })
    );
    setCustomers(safeParse<Customer[]>(CUSTOMERS_KEY, []));
    setDeliveries(safeParse<Delivery[]>(DELIVERIES_KEY, []));
    setPayments(safeParse<Payment[]>(PAYMENTS_KEY, []));
    setMovements(safeParse<InventoryMovement[]>(MOVEMENTS_KEY, []));
    setMetrics(safeParse<DailyMetric[]>(DAILY_METRICS_KEY, []));
    setIsLoading(false);
  }, []);

  // ============================================
  // CÁLCULOS DERIVADOS (memo)
  // ============================================
  const dashboardData = useMemo<DashboardData>(() => {
    // 1. Capacidad e inventario físico
    const capacity = calculateCapacity(inventory, customers);

    // 2. Entregas del turno actual
    const currentTurn = getCurrentTurnDeliveries(deliveries, metrics);

    // 3. Rotación
    const { rotation } = calculateRotation(
      currentTurn.deliveredToday,
      capacity.totalSystem
    );

    // 4. Ventas y revenue (precio NO fijo, suma de delivery.total)
    const sales = calculateSales(deliveries);

    // 5. Potencial de ingreso
    const potentialRevenue = calculatePotentialRevenue(
      capacity.capacityAvailable,
      sales.averagePrice
    );

    // 6. Alertas
    const alerts = generateAlerts(capacity, inventory);

    // 7. Insights accionables
    const insights = generateInsights({
      salesChangePercent: sales.salesChangePercent,
      salesToday: sales.salesToday,
      salesYesterday: sales.salesYesterday,
      sales7dAvg: sales.sales7dAvg,
      borrowed: capacity.borrowed,
      capacityAvailable: capacity.capacityAvailable,
      rotation,
      totalSystem: capacity.totalSystem,
      empty: capacity.empty,
      full: capacity.full,
      potentialRevenue,
    });

    // 8. Actividad reciente
    const recentActivity = getRecentActivity(movements, deliveries, payments, 10);

    // 9. Rotación histórica
    const rotationHistory = getRotationHistory(metrics, 7);

    // 10. Tendencia
    const trendData = calculateTrend(deliveries, 6);

    return {
      // Inventario
      total: capacity.totalSystem,
      full: capacity.full,
      empty: capacity.empty,
      borrowed: capacity.borrowed,
      reserved: capacity.reserved,

      // Operación
      deliveredToday: currentTurn.deliveredToday,
      returnedToday: currentTurn.returnedToday,
      rotation,

      // Ventas
      salesToday: sales.salesToday,
      sales7dAvg: sales.sales7dAvg,
      salesThisMonth: sales.salesThisMonth,
      salesLastMonth: sales.salesLastMonth,
      salesChangePercent: sales.salesChangePercent,

      // Revenue
      revenueToday: sales.revenueToday,
      revenueThisMonth: sales.revenueThisMonth,
      revenueLastMonth: sales.revenueLastMonth,

      // Capacidad
      capacityAvailable: capacity.capacityAvailable,
      borrowedPercent: capacity.borrowedPercent,

      // Potencial
      averagePrice: sales.averagePrice,
      potentialRevenue,

      // Derivados
      alerts,
      insights,
      recentActivity,
      rotationHistory,
      trendData,

      // Meta
      isLoading,
    };
  }, [inventory, customers, deliveries, payments, movements, metrics, isLoading]);

  return dashboardData;
}
