// ============================================
// TIPOS CENTRALIZADOS DEL SISTEMA
// ============================================

// --- Inventario ---

export type Inventory = {
  full: number;
  empty: number;
  reservedForNextDay: number;
  total: number;
};

export type MovementType =
  | "delivery_internal"
  | "delivery_external"
  | "refill"
  | "refill_deferred"
  | "purchase"
  | "loss"
  | "adjustment"
  | "inventory_reset"
  | "shift_opening"
  | "AUDITORIA"
  | "DEVOLUCION";

export type InventoryMovement = {
  id: number;
  type: MovementType;
  fullChange: number;
  emptyChange: number;
  reservedChange?: number;
  previousTotal?: number;
  newTotal?: number;
  difference?: number;
  customerName?: string;
  affectsTotal: boolean;
  reference?: string;
  date: string;
};

export type DailyMetric = {
  id: string;
  closedAt: string;
  delivered: number;
  total: number;
  rotation: number;
  closedManually: boolean;
};

// --- Clientes ---

export interface Customer {
  id: number;
  name: string;
  address: string;
  phone: string;
  balance: number;
  borrowedContainers: number;
  allowContainerLoan: boolean;
  avatarUrl?: string;
  tags?: string[];
  isWide?: boolean;
}

// --- Entregas ---

export interface Delivery {
  id: number;
  customerId: number;
  customerName: string;
  delivered: number;
  returned: number;
  missing: number;
  total: number; // Monto cobrado (precio variable por cliente)
  date: string;
  usedLoan: boolean;
}

// --- Pagos ---

export type PaymentMethod = "cash" | "transfer";

export type Payment = {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  previousBalance: number;
  newBalance: number;
  proofImageUrl?: string;
  date: string;
};

// --- Dashboard ---

export type AlertLevel = "critical" | "warning" | "info";

export type Alert = {
  id: string;
  level: AlertLevel;
  message: string;
  action?: string; // label del CTA
  href?: string;   // link al módulo
};

export type InsightType = "success" | "warning" | "info" | "danger";

export type Insight = {
  id: string;
  type: InsightType;
  title: string;
  description: string;
};

export type ActivityType = "delivery" | "refill" | "return" | "payment" | "purchase" | "loss" | "audit" | "adjustment";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  amount?: number;
};

export type RotationDay = {
  date: string;
  label: string;
  rotation: number;
  delivered: number;
};

export type TrendDataPoint = {
  month: string;
  label: string;
  deliveries: number;
  revenue: number;
};

export type DashboardData = {
  // Inventario
  total: number;
  full: number;
  empty: number;
  borrowed: number;
  reserved: number;

  // Operación del día
  deliveredToday: number;
  returnedToday: number;
  rotation: number;

  // Ventas (botellones netos)
  salesToday: number;
  sales7dAvg: number;
  salesThisMonth: number;
  salesLastMonth: number;
  salesChangePercent: number;

  // Revenue (dinero real — NO precio fijo)
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;

  // Capacidad
  capacityAvailable: number;
  borrowedPercent: number;

  // Potencial de ingreso
  averagePrice: number;
  potentialRevenue: number;

  // Derivados
  alerts: Alert[];
  insights: Insight[];
  recentActivity: ActivityItem[];
  rotationHistory: RotationDay[];
  trendData: TrendDataPoint[];

  // Meta
  isLoading: boolean;
};
