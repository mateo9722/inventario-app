"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  Trash2,
  Settings2,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Droplets,
  User
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ============================================
// TIPOS DE DATOS
// ============================================

type Inventory = {
  full: number;
  empty: number;
  reservedForNextDay: number;
  total: number;
};

type MovementType = "delivery_internal" | "delivery_external" | "refill" | "refill_deferred" | "purchase" | "loss" | "adjustment" | "inventory_reset" | "shift_opening" | "AUDITORIA" | "DEVOLUCION";

type InventoryMovement = {
  id: number;
  type: MovementType;
  fullChange: number;
  emptyChange: number;
  reservedChange?: number;
  previousTotal?: number; // nuevo para auditoría
  newTotal?: number; // nuevo para auditoría
  difference?: number; // nuevo para auditoría
  customerName?: string; // nuevo para devoluciones independientes
  affectsTotal: boolean;
  reference?: string;
  date: string;
};

type DailyMetric = {
  id: string; // unique (ej: timestamp o uuid)
  closedAt: string; // ISO timestamp del cierre
  delivered: number;
  total: number;
  rotation: number;
  closedManually: boolean;
};

interface Customer {
  id: number;
  name: string;
  borrowedContainers: number;
}

const INVENTORY_KEY = "@hydroflow_inventory";
const MOVEMENTS_KEY = "@hydroflow_inventory_movements";
const CUSTOMERS_KEY = "@hydroflow_customers";
const DAILY_METRICS_KEY = "@hydroflow_inventory_daily_metrics";

export default function InventoryPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Estado Principal
  const [inventory, setInventory] = useState<Inventory>({ full: 0, empty: 0, reservedForNextDay: 0, total: 0 });
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);

  // Modales
  type ModalActionType = MovementType | null;
  const [actionType, setActionType] = useState<ModalActionType>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditStep, setAuditStep] = useState<1 | 2 | 3 | 4>(1);
  const [auditInputFull, setAuditInputFull] = useState<string>("");
  const [auditInputEmpty, setAuditInputEmpty] = useState<string>("");
  
  // Devoluciones
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedCustomerForReturn, setSelectedCustomerForReturn] = useState<Customer | null>(null);
  const [returnAmountInput, setReturnAmountInput] = useState<string>("");
  
  // Inputs Formularios
  const [amountInput, setAmountInput] = useState<string>("");
  const [lossSource, setLossSource] = useState<"full" | "empty">("full"); // para pérdidas
  const [newFullInput, setNewFullInput] = useState<string>(""); // para ajuste
  const [newEmptyInput, setNewEmptyInput] = useState<string>(""); // para ajuste / reset
  const [referenceInput, setReferenceInput] = useState<string>("");
  const [isReservedForNextDay, setIsReservedForNextDay] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ============================================
  // CARGA DE DATOS (Mount)
  // ============================================
  useEffect(() => {
    setIsMounted(true);

    const storedInventory = localStorage.getItem(INVENTORY_KEY);
    const storedCustomers = localStorage.getItem(CUSTOMERS_KEY);
    let loadedCustomers: Customer[] = [];
    
    if (storedCustomers) {
      try {
        loadedCustomers = JSON.parse(storedCustomers);
        setCustomers(loadedCustomers);
      } catch (err) {
        console.error("Error parsing customers", err);
      }
    }

    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory);
        const calcBorrowed = loadedCustomers.reduce((acc, c) => acc + (c.borrowedContainers || 0), 0);
        let migratedTotal = parsed.total;

        // Migración inicial única exigida por negocio
        if (migratedTotal === undefined) {
           migratedTotal = (parsed.full || 0) + (parsed.empty || 0) + (parsed.reservedForNextDay || 0) + calcBorrowed;
        }

        setInventory({
           full: parsed.full || 0,
           empty: parsed.empty || 0,
           reservedForNextDay: parsed.reservedForNextDay || 0,
           total: migratedTotal
        });
      } catch (err) {
        console.error("Error parsing inventory", err);
      }
    }

    const storedMovements = localStorage.getItem(MOVEMENTS_KEY);
    if (storedMovements) {
      try {
        setMovements(JSON.parse(storedMovements));
      } catch (err) {
        console.error("Error parsing movements", err);
      }
    }

    // Only load deliveries if needed natively
    const storedDeliveries = localStorage.getItem("@hydroflow_deliveries");
    if (storedDeliveries) {
      try {
        setDeliveries(JSON.parse(storedDeliveries));
      } catch (err) {}
    }

    const storedMetrics = localStorage.getItem(DAILY_METRICS_KEY);
    if (storedMetrics) {
      try {
        setMetrics(JSON.parse(storedMetrics));
      } catch (err) {}
    }
  }, []);

  // Guarda Reactiva
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
    }
  }, [inventory, movements, isMounted]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ============================================
  // CIERRE AUTOMÁTICO (Fallback de Medianoche)
  // ============================================
  useEffect(() => {
    if (!isMounted || !deliveries.length) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const lastClosedChecked = metrics.length > 0 ? new Date(metrics[0].closedAt).getTime() : 0;
    
    // Solo entregas que aún no están en un bloque cerrado
    const unclosedDeliveries = deliveries.filter(d => d.date && new Date(d.date).getTime() > lastClosedChecked);

    // Agrupamos esas entregas por fechas originales (YYYY-MM-DD)
    const groups: Record<string, typeof unclosedDeliveries> = {};
    unclosedDeliveries.forEach(d => {
      const gDate = d.date.split("T")[0];
      if (!groups[gDate]) groups[gDate] = [];
      groups[gDate].push(d);
    });

    const autoMetrics: DailyMetric[] = [];
    
    // Toda fecha que sea < a Hoy significa que ayer (o días pasados) no se procesó el cierre manual
    Object.keys(groups).sort().forEach(gDate => {
      if (gDate < todayStr) {
        const sumDeli = groups[gDate].reduce((acc, curr) => acc + (curr.delivered || 0), 0);
        if (sumDeli > 0) {
          // Tomar un proxy del estado físico del sistema
          const proxyTotal = inventory.full + inventory.empty + customers.reduce((acc, c) => acc + (c.borrowedContainers || 0), 0);
          autoMetrics.push({
            id: `auto-${gDate}-${Date.now()}`,
            closedAt: `${gDate}T23:59:59.999Z`, // Fallback de cierre falso a media noche
            delivered: sumDeli,
            total: proxyTotal,
            rotation: proxyTotal > 0 ? Number((sumDeli / proxyTotal).toFixed(1)) : 0,
            closedManually: false
          });
        }
      }
    });

    if (autoMetrics.length > 0) {
      setMetrics(prev => {
        const merged = [...autoMetrics.reverse(), ...prev].sort((a,b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
        localStorage.setItem(DAILY_METRICS_KEY, JSON.stringify(merged));
        return merged;
      });
    }
  }, [isMounted, deliveries, metrics, inventory, customers]);

  // Agrupación de Historial (Mensual)
  const groupedMetrics = React.useMemo(() => {
    try {
      const groups: { [key: string]: { label: string, metrics: DailyMetric[], avgRot: number, totalDelivered: number } } = {};
      
      if (!Array.isArray(metrics)) return [];

      metrics.forEach(m => {
        if (!m || !m.closedAt) return; // Safeguard 
        const d = new Date(m.closedAt);
        if (isNaN(d.getTime())) return; // Safeguard valid date

        const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (!groups[monthKey]) {
          const monthName = d.toLocaleDateString("es-EC", { month: "long", year: "numeric" });
          groups[monthKey] = {
            label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            metrics: [], avgRot: 0, totalDelivered: 0
          };
        }
        groups[monthKey].metrics.push(m);
        groups[monthKey].totalDelivered += (m.delivered || 0);
      });

      Object.values(groups).forEach(g => {
        if (g.metrics.length > 0) {
          const sumRot = g.metrics.reduce((acc, curr) => acc + (curr.rotation || 0), 0);
          g.avgRot = Number((sumRot / g.metrics.length).toFixed(1));
        }
      });

      return Object.values(groups).sort((a,b) => {
        const dateA = a.metrics[0]?.closedAt || "";
        const dateB = b.metrics[0]?.closedAt || "";
        return dateB.localeCompare(dateA);
      });
    } catch (e) {
      console.error("Error validando la agrupación de métricas:", e);
      return [];
    }
  }, [metrics]);

  if (!isMounted) return null;

  // ============================================
  // CÁLCULOS Y ALERTAS
  // ============================================

  const borrowed = customers.reduce((acc, c) => acc + (c.borrowedContainers || 0), 0);
  const reservedForNextDay = inventory.reservedForNextDay || 0;
  const totalSystem = inventory.full + inventory.empty + borrowed + reservedForNextDay;
  const availableStock = inventory.full + reservedForNextDay;

  // USO DEL INVENTARIO HOY (POR TURNO OPERATIVO)
  const lastClosedAtTime = metrics.length > 0 ? new Date(metrics[0].closedAt).getTime() : 0;
  
  const currentTurnDeliveries = deliveries.filter(d => {
    if (!d.date) return false;
    return new Date(d.date).getTime() > lastClosedAtTime;
  });

  const deliveredToday = currentTurnDeliveries.reduce((sum, d) => sum + (d.delivered || 0), 0);
  const rotation = totalSystem > 0 ? (deliveredToday / totalSystem).toFixed(1) : "0";
  const numRotation = Number(rotation);



  // Validación Global en tiempo real (Notificación silenciosa por consola si hay corrupción en memoria)
  if (totalSystem !== inventory.total && inventory.total !== 0) {
    console.error("Inconsistencia crítica en inventario: la suma de partes no coincide con el total físico.");
  }

  // Sistema de alertas escalonadas (Priorizadas)
  let alertMode: "critical" | "warning" | "info" | "purple" | null = null;
  let alertMessage = "";

  if (customers.length === 0 && borrowed > 0) {
    alertMode = "critical";
    alertMessage = "Inconsistencia: Existen envases prestados fantasmas sin clientes asignados.";
  } else if (availableStock < 10 && availableStock > 0) {
    alertMode = "critical";
    alertMessage = "Stock crítico de botellones utilizables en planta.";
  } else if (numRotation < 1 && deliveredToday > 0) {
    alertMode = "warning";
    alertMessage = "Inventario poco utilizado hoy (baja rotación).";
  } else if (totalSystem > 0 && (borrowed / totalSystem) > 0.7) {
    alertMode = "warning";
    alertMessage = "Muchos envases retenidos en clientes.";
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenAction = (type: MovementType) => {
    setAmountInput("");
    setReferenceInput("");
    setLossSource("full");
    setNewFullInput(inventory.full.toString());
    setNewEmptyInput(inventory.empty.toString());
    setIsReservedForNextDay(false);
    setErrorMsg("");
    setActionType(type);
  };

  const handleCloseModal = () => {
    setActionType(null);
    setErrorMsg("");
  };

  const handleConfirmAction = () => {
    setErrorMsg("");
    let fullChange = 0;
    let emptyChange = 0;
    let reservedChange = 0;
    let finalType: MovementType = actionType!;
    const amount = parseInt(amountInput, 10);

    // Validar monto
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("El monto debe ser numérico y mayor a 0.");
      return;
    }

    if (actionType === "refill") {
      if (inventory.empty < amount) {
        setErrorMsg("No hay suficientes botellones vacíos disponibles para recargar esa cantidad.");
        return;
      }
      emptyChange = -amount;
      if (isReservedForNextDay) {
        fullChange = 0; // Se transfiere a reserva, no a llenos directos
        reservedChange = amount;
        finalType = "refill_deferred";
      } else {
        fullChange = amount;
      }
    } 
    else if (actionType === "purchase") {
      fullChange = amount;
    } 
    else if (actionType === "loss") {
      if (lossSource === "full") {
        if (inventory.full < amount) {
          setErrorMsg("No hay suficientes botellones llenos para dar de baja.");
          return;
        }
        fullChange = -amount;
      } else {
        if (inventory.empty < amount) {
          setErrorMsg("No hay suficientes botellones vacíos para dar de baja.");
          return;
        }
        emptyChange = -amount;
      }
    }

    // Efectuar Mutación estricta de estado
    let currentFull = inventory.full;
    let currentEmpty = inventory.empty;
    let currentReserved = inventory.reservedForNextDay || 0;
    let currentTotal = inventory.total;

    if (actionType === "refill") {
      currentEmpty -= amount;
      if (isReservedForNextDay) {
        currentReserved += amount;
      } else {
        currentFull += amount;
      }
    } else if (actionType === "purchase") {
      currentFull += amount;
      currentTotal += amount;
    } else if (actionType === "loss") {
      if (lossSource === "full") {
        currentFull -= amount;
      } else {
        currentEmpty -= amount;
      }
      currentTotal -= amount;
    }

    // Control Seguro Global (Guardian de máquina de estados)
    const totalCheck = currentFull + currentEmpty + currentReserved + borrowed;
    if (totalCheck !== currentTotal) {
      console.error(`Inconsistencia detectada. Se esperaba ${currentTotal}, se computó ${totalCheck}`);
      setErrorMsg("Error del sistema: La operación rompería el balance físico de los envases (Total alterado).");
      return;
    }

    if (currentFull < 0 || currentEmpty < 0 || currentReserved < 0 || currentTotal < 0) {
      setErrorMsg("Error Crítico: La operación generaría un estado de inventario negativo.");
      return;
    }

    setInventory({ full: currentFull, empty: currentEmpty, reservedForNextDay: currentReserved, total: currentTotal });

    let affectsTotal = false;
    if (actionType === "purchase" || actionType === "loss") {
       affectsTotal = true;
    }

    // Pushing Log
    const newMovement: InventoryMovement = {
      id: Date.now(),
      type: finalType,
      fullChange,
      emptyChange,
      reservedChange: reservedChange !== 0 ? reservedChange : undefined,
      affectsTotal,
      reference: referenceInput.trim() || undefined,
      date: new Date().toISOString()
    };

    setMovements(prev => [newMovement, ...prev]);
    setSuccessMsg("Movimiento registrado con éxito.");
    handleCloseModal();
  };

  const handleConfirmAudit = () => {
    setErrorMsg("");
    const inputFull = parseInt(auditInputFull, 10);
    const inputEmpty = parseInt(auditInputEmpty, 10);

    if (isNaN(inputFull) || inputFull < 0 || isNaN(inputEmpty) || inputEmpty < 0) {
      setErrorMsg("Ingresa valores numéricos absolutos mayores o iguales a 0.");
      return;
    }

    const currentReserved = inventory.reservedForNextDay || 0;
    const newTotal = inputFull + inputEmpty + borrowed + currentReserved;
    const oldTotal = inventory.total;
    const diff = newTotal - oldTotal;

    setInventory({
       full: inputFull,
       empty: inputEmpty,
       reservedForNextDay: currentReserved,
       total: newTotal
    });

    const newMovement: InventoryMovement = {
      id: Date.now(),
      type: "AUDITORIA",
      fullChange: inputFull - inventory.full,
      emptyChange: inputEmpty - inventory.empty,
      previousTotal: oldTotal,
      newTotal: newTotal,
      difference: diff,
      affectsTotal: true,
      reference: "Ajuste General / Auditoría Confirmada",
      date: new Date().toISOString()
    };

    setMovements(prev => [newMovement, ...prev]);
    setSuccessMsg("Auditoría guardada. Inventario calibrado exitosamente.");
    
    // Close modal
    setIsAuditModalOpen(false);
    setAuditStep(1);
    setAuditInputFull("");
    setAuditInputEmpty("");
  };

  const handleConfirmReturn = () => {
    setErrorMsg("");
    if (!selectedCustomerForReturn) return;

    const returned = parseInt(returnAmountInput, 10);
    if (isNaN(returned) || returned <= 0) {
      setErrorMsg("El monto debe ser numérico y mayor a 0.");
      return;
    }

    if (returned > selectedCustomerForReturn.borrowedContainers) {
      setErrorMsg(`No puede devolver más de lo que debe (${selectedCustomerForReturn.borrowedContainers}).`);
      return;
    }

    // 1. Actualizar Cliente
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomerForReturn.id) {
        return { ...c, borrowedContainers: c.borrowedContainers - returned };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updatedCustomers));

    // 2. Actualizar Inventario (Sube Vacíos)
    setInventory(prev => ({
      ...prev,
      empty: prev.empty + returned
    }));

    // 3. Registrar Movimiento
    const newMovement: InventoryMovement = {
      id: Date.now(),
      type: "DEVOLUCION",
      fullChange: 0,
      emptyChange: returned,
      customerName: selectedCustomerForReturn.name,
      affectsTotal: false,
      reference: `${selectedCustomerForReturn.name} devolvió ${returned} envases`,
      date: new Date().toISOString()
    };

    setMovements(prev => [newMovement, ...prev]);
    setSuccessMsg("Devolución registrada exitosamente.");
    
    // Reset & Close
    setIsReturnModalOpen(false);
    setSelectedCustomerForReturn(null);
    setReturnAmountInput("");
  };

  const handleCloseShift = () => {
    if (deliveredToday === 0) {
      setErrorMsg("No hay actividad en el turno actual para cerrar.");
      return;
    }

    const newMetric: DailyMetric = {
      id: `manual-${Date.now()}`,
      closedAt: new Date().toISOString(),
      delivered: deliveredToday,
      total: totalSystem,
      rotation: numRotation,
      closedManually: true
    };

    setMetrics(prev => {
      const merged = [newMetric, ...prev];
      localStorage.setItem(DAILY_METRICS_KEY, JSON.stringify(merged));
      return merged;
    });

    if (inventory.reservedForNextDay && inventory.reservedForNextDay > 0) {
      const reserved = inventory.reservedForNextDay;
      setInventory(prev => ({
        ...prev,
        full: prev.full + reserved,
        reservedForNextDay: 0
      }));

      const newMovement: InventoryMovement = {
        id: Date.now() + 1,
        type: "shift_opening",
        fullChange: reserved,
        emptyChange: 0,
        affectsTotal: false,
        reference: "Ingreso de stock preparado del turno anterior",
        date: new Date().toISOString()
      };
      setMovements(prev => [newMovement, ...prev]);
    }

    setSuccessMsg("Jornada operativa cerrada y registrada exitosamente.");
  };

  // UI Helpers
  const getMovementVisuals = (mov: InventoryMovement) => {
    switch (mov.type) {
      case "delivery_internal": return { icon: <Package className="w-3.5 h-3.5" />, color: "bg-blue-500/10 text-blue-600 border border-blue-500/20", label: "Entrega (Préstamo)" };
      case "delivery_external": return { icon: <Package className="w-3.5 h-3.5" />, color: "bg-orange-500/10 text-orange-600 border border-orange-500/20", label: "Entrega (Venta)" };
      case "refill": return { icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20", label: "Recarga" };
      case "refill_deferred": return { icon: <Package className="w-3.5 h-3.5" />, color: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20", label: "Prod. Diferida" };
      case "purchase": return { icon: <ShoppingCart className="w-3.5 h-3.5" />, color: "bg-teal-500/10 text-teal-600 border border-teal-500/20", label: "Compra de Stock" };
      case "loss": return { icon: <Trash2 className="w-3.5 h-3.5" />, color: "bg-error/10 text-error border border-error/20", label: "Pérdida / Daño" };
      case "adjustment": return { icon: <Settings2 className="w-3.5 h-3.5" />, color: "bg-surface-container-high text-on-surface border border-outline-variant", label: "Ajuste Manual" };
      case "inventory_reset": return { icon: <Settings2 className="w-3.5 h-3.5" />, color: "bg-error/10 text-error border border-error/40", label: "Ajuste General" };
      case "AUDITORIA": return { icon: <Settings2 className="w-3.5 h-3.5" />, color: "bg-indigo-500/10 text-indigo-700 border border-indigo-500/30", label: "AUDITORÍA" };
      case "DEVOLUCION": return { icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-orange-500/10 text-orange-700 border border-orange-500/20", label: "DEVOLUCIÓN" };
      case "shift_opening": return { icon: <RotateCcw className="w-3.5 h-3.5" />, color: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20", label: "Apertura Diferida" };
      default: return { icon: <Info />, color: "bg-gray-100 text-gray-500", label: "Otro" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* HEADER Y ALERTAS */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-[var(--font-manrope)]">
            Centro de Inventario
          </h1>
          <p className="text-on-surface-variant font-medium">
            Control de stock, alertas en tiempo real y flujo de botellones.
          </p>
        </div>

        {/* ALERTA DINÁMICA */}
        {alertMode && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold border ${
            alertMode === "critical" ? "bg-error-container text-on-error-container border-error/50 shadow-md shadow-error/10" :
            alertMode === "warning" ? "bg-orange-500/10 text-orange-700 border-orange-500/50" :
            alertMode === "purple" ? "bg-purple-500/10 text-purple-700 border-purple-500/50 shadow-sm" :
            "bg-blue-500/10 text-blue-700 border-blue-500/50"
          } animate-in fade-in slide-in-from-top-4`}>
            {alertMode === "critical" ? <AlertTriangle className="w-6 h-6 shrink-0" /> : <Info className="w-6 h-6 shrink-0" />}
            <span>{alertMessage}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-secondary-container/50 border border-secondary/50 text-on-secondary-container p-4 rounded-xl flex items-center gap-3 font-bold animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            {successMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: MÉTRICAS Y ACCIONES */}
        <div className="lg:col-span-2 space-y-4">

          {/* NUEVO: USO DEL INVENTARIO HOY */}
          <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Uso del Inventario Hoy</span>
                <p className="text-sm font-medium text-on-surface mt-0.5">
                  El inventario físico circuló <span className="font-black text-primary">{numRotation} veces</span> hoy.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
               <div className="text-right">
                 <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Entregados hoy</span>
                 <p className="text-2xl font-black text-on-surface font-[var(--font-manrope)] leading-tight">{deliveredToday}</p>
                 <span className="text-[10px] text-primary/80 font-bold uppercase tracking-widest flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Turno En Curso</span>
               </div>
               
               <div className="h-10 w-px bg-outline-variant/50 hidden sm:block"></div>

               <button 
                 onClick={handleCloseShift}
                 disabled={deliveredToday === 0}
                 className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${deliveredToday > 0 ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:scale-95' : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed hidden'}`}
               >
                 Cerrar Turno
               </button>
            </div>
          </div>
          
          {/* Botón de cierre para móviles (Visible solo en pantallas pequeñas) */}
          <button 
             onClick={handleCloseShift}
             disabled={deliveredToday === 0}
             className={`w-full sm:hidden flex justify-center items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${deliveredToday > 0 ? 'bg-primary text-white shadow-md shadow-primary/20 active:scale-95' : 'hidden'}`}
          >
             Cerrar Turno Operativo
          </button>

          {/* HISTORIAL DE ROTACIÓN (ÚLTIMOS 7 TURNOS) */}
          {metrics.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col mb-4 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Historial de Rotación
                </h3>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  Ver Completo <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar pb-2">
                <div className="flex gap-3">
                  {metrics.slice(0, 7).map(m => (
                    <div key={m.id} className="min-w-[130px] sm:min-w-[150px] bg-surface-container-low p-4 rounded-2xl flex flex-col border border-outline-variant/30 relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-default">
                      <div className={`absolute top-0 left-0 w-full h-1 ${m.closedManually ? 'bg-primary' : 'bg-purple-400'}`} />
                      
                      <span className="text-[9px] uppercase font-black text-on-surface-variant/70 tracking-widest mt-1 mb-3 bg-surface-container px-2 py-0.5 rounded-md inline-flex self-start">
                         {m.closedAt && !isNaN(new Date(m.closedAt).getTime()) ? new Date(m.closedAt).toLocaleDateString("es-EC", { weekday: 'short', day: '2-digit', month: 'short' }) : 'Fecha inv.'}
                      </span>
                      
                      <p className="text-2xl font-black text-on-surface font-[var(--font-manrope)] flex items-end gap-1 -mb-1">
                        {m.rotation}x
                      </p>
                      <span className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest mb-2">Rotación</span>
                      
                      <div className="flex flex-col gap-1 mt-2 border-t border-outline-variant/30 pt-3">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
                           <Package className="w-3.5 h-3.5 text-primary/70" />
                           {m.delivered} <span className="text-[9px] font-bold uppercase mt-0.5">despachos</span>
                         </div>
                         <div className="text-[10px] text-on-surface-variant/70 font-bold flex items-center gap-1 uppercase tracking-wider">
                           <div className="w-1 h-1 rounded-full bg-surface-container-highest" />
                           {m.closedAt && !isNaN(new Date(m.closedAt).getTime()) ? new Date(m.closedAt).toLocaleTimeString("es-EC", { hour: 'numeric', minute: '2-digit' }) : '-:-'}
                         </div>
                      </div>

                      <div className={`mt-3 self-start px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${m.closedManually ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-purple-500/10 text-purple-700 border border-purple-500/20'}`}>
                         {m.closedManually ? 'Cierre Manual' : 'Auto Recovered'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KPI MAESTRO */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" /> Inventario Global Total
              </span>
              <div className="flex flex-col mt-1">
                <p className="text-5xl font-black text-on-surface font-[var(--font-manrope)]">{totalSystem}</p>
                <span className="text-[13px] font-bold text-on-surface mt-1.5 uppercase tracking-wider">Envases físicos totales</span>
                <span className="text-[11px] font-medium text-on-surface-variant leading-tight mt-0.5">(No cambia con entregas ni recargas)</span>
                
                <button 
                   onClick={() => {
                      setIsAuditModalOpen(true);
                      setAuditStep(1);
                      setAuditInputFull(inventory.full.toString());
                      setAuditInputEmpty(inventory.empty.toString());
                   }}
                   className="mt-4 w-fit flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface-container-low hover:bg-slate-100 text-on-surface text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm"
                >
                   <Settings2 className="w-4 h-4" /> Auditar inventario
                </button>
              </div>
            </div>
            <div className="flex bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/50">
               <div className="flex flex-col items-center justify-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/80">Retención en Clientes</span>
                 <span className="text-xl font-black text-orange-600">{totalSystem > 0 ? Math.round((borrowed / totalSystem) * 100) : 0}%</span>
               </div>
            </div>
          </div>
          
          {/* CARDS DE MÉTRICAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-surface-container-lowest border-t-4 border-primary p-5 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest mb-3">
                  <Droplets className="w-4 h-4 text-primary" />
                  Llenos Disponibles
                </div>
                <p className="text-4xl font-black text-on-surface font-[var(--font-manrope)] mb-2">{inventory.full}</p>
                <div className="mt-2 space-y-1">
                   <span className="text-[10px] font-bold text-primary block bg-primary/10 w-fit px-2 py-0.5 rounded uppercase tracking-wider">Listos para salir a ruta</span>
                   <span className="text-[10px] font-medium text-on-surface-variant block uppercase tracking-wider">Disponibles para entregar ahora</span>
                </div>
              </div>
              
              {reservedForNextDay > 0 && (
                <div className="mt-4 bg-indigo-50 text-indigo-700 p-2.5 rounded-xl border border-indigo-200/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600">
                      <Package className="w-3 h-3 shrink-0" />
                      Preparados para siguiente turno:
                    </div>
                    <span className="font-black text-indigo-900 text-sm">{reservedForNextDay}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-indigo-600/80 border-t border-indigo-200/50 pt-1.5">
                    <span>Total usable:</span>
                    <span className="text-indigo-900 font-extrabold">{inventory.full + reservedForNextDay}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-surface-container-lowest border-t-4 border-slate-400 p-5 rounded-3xl shadow-sm hover:-translate-y-1 transition-transform relative flex flex-col justify-between">
              <div>
                 <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest mb-3">
                   <div className="w-4 h-4 rounded-full border-2 border-slate-400 shrink-0" />
                   Vacíos en Planta
                 </div>
                 <p className="text-4xl font-black text-on-surface font-[var(--font-manrope)] mb-2">{inventory.empty}</p>
              </div>
              <div className="mt-2 space-y-1">
                 <span className="text-[10px] font-bold text-slate-700 block bg-slate-100 w-fit px-2 py-0.5 rounded uppercase tracking-wider">Listos para recargar</span>
                 <span className="text-[10px] font-medium text-on-surface-variant block uppercase tracking-wider">Disponibles para producción</span>
              </div>
            </div>

            <button 
              onClick={() => setIsReturnModalOpen(true)}
              className="bg-surface-container-lowest border-t-4 border-orange-400 p-5 rounded-3xl shadow-sm hover:-translate-y-1 hover:shadow-md hover:ring-2 hover:ring-orange-400/20 transition-all flex flex-col justify-between text-left group"
            >
              <div>
                 <div className="flex items-center gap-2 text-on-surface-variant font-bold uppercase text-[10px] tracking-widest mb-3">
                   <Package className="w-4 h-4 text-orange-500" />
                   En Clientes
                 </div>
                 <div className="flex items-center gap-4">
                   <p className="text-4xl font-black text-on-surface font-[var(--font-manrope)] relative mb-2">
                     {borrowed}
                     <span className="absolute -top-1 -right-2 flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                     </span>
                   </p>
                   <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Registrar Devolución <ArrowUpRight className="w-3.5 h-3.5" />
                   </div>
                 </div>
              </div>
              <div className="mt-2 space-y-1">
                 <span className="text-[10px] font-bold text-orange-700 block bg-orange-50 w-fit px-2 py-0.5 rounded uppercase tracking-wider">Envases fuera de planta</span>
                 <span className="text-[10px] font-medium text-on-surface-variant block uppercase tracking-wider">Haz click para recibir vacíos</span>
              </div>
            </button>
          </div>

          {/* PANEL DE ACCIONES Rápidas */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30">
             <h2 className="text-lg font-black font-[var(--font-manrope)] mb-4">Acciones Manuales</h2>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 relative mb-4">
             <button onClick={() => handleOpenAction("refill")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-outline-variant shadow-sm hover:shadow-md transition-all group">
                <RotateCcw className="w-6 h-6 group-hover:-rotate-180 transition-transform duration-500" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Recargar</span>
             </button>
             <button onClick={() => handleOpenAction("purchase")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-teal-50 text-teal-700 hover:text-teal-800 border border-outline-variant shadow-sm hover:shadow-md transition-all group">
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Comprar</span>
             </button>
             <button onClick={() => handleOpenAction("loss")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-error-container text-error hover:text-error-hover border border-outline-variant shadow-sm hover:shadow-md transition-all group">
                <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center">Pérdida</span>
             </button>
          </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="lg:col-span-1 bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/30 flex flex-col h-[700px]">
          <h2 className="text-lg font-black font-[var(--font-manrope)] flex items-center gap-2 mb-6">
            Historial de Movimientos
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {movements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                <Package className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium">Aún no hay movimientos.</p>
              </div>
            ) : (
              [...movements].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(mov => {
                const vis = getMovementVisuals(mov);
                
                return (
                  <div key={mov.id} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:-translate-y-0.5 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${vis.color}`}>
                        {vis.icon} {vis.label}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/70 font-bold uppercase tracking-widest">
                        {new Date(mov.date).toLocaleDateString("es-EC", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>

                    {mov.type === "AUDITORIA" ? (
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-outline-variant/30">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Conteo físico</span>
                          <span className={`text-base font-black flex items-center ${(mov.difference || 0) > 0 ? "text-emerald-600" : (mov.difference || 0) < 0 ? "text-error" : "text-on-surface-variant"}`}>
                            {(mov.difference || 0) > 0 ? "+" : ""}{mov.difference}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant bg-surface-container/50 px-3 py-1.5 rounded-lg w-fit">
                          <span>Antes:</span>
                          <span className="font-bold text-on-surface">{mov.previousTotal}</span>
                          <span className="mx-1 font-black text-on-surface-variant/40">→</span>
                          <span>Después:</span>
                          <span className="font-bold text-on-surface">{mov.newTotal}</span>
                        </div>
                      </div>
                    ) : mov.type === "DEVOLUCION" ? (
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-outline-variant/30">
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">{mov.customerName}</span>
                            <span className="text-emerald-600 font-black text-sm">+{mov.emptyChange} Vacíos</span>
                         </div>
                         <p className="text-[10px] text-on-surface-variant font-medium leading-tight">Devolución manual de envases prestados.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 border-t border-outline-variant/30 pt-3">
                        {mov.fullChange !== 0 && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Llenos</span>
                            <span className={`font-black flex items-center text-sm ${mov.fullChange > 0 ? "text-emerald-600" : "text-error"}`}>
                              {mov.fullChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(mov.fullChange)}
                            </span>
                          </div>
                        )}
                        {mov.emptyChange !== 0 && (
                           <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Vacíos</span>
                           <span className={`font-black flex items-center text-sm ${mov.emptyChange > 0 ? "text-emerald-600" : "text-error"}`}>
                             {mov.emptyChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                             {Math.abs(mov.emptyChange)}
                           </span>
                         </div>
                        )}
                        {mov.reservedChange !== undefined && mov.reservedChange !== 0 && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">Preparados</span>
                            <span className={`font-black flex items-center text-sm ${mov.reservedChange > 0 ? "text-indigo-600" : "text-error"}`}>
                              {mov.reservedChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {Math.abs(mov.reservedChange)}
                            </span>
                          </div>
                        )}

                        {mov.affectsTotal && (
                           <div className="ml-auto text-[9px] font-black uppercase bg-surface-container border border-outline-variant/30 text-on-surface-variant px-2 py-1 rounded-md">
                             Cambia Total
                           </div>
                        )}
                      </div>
                    )}

                    {mov.reference && (
                      <p className="mt-2 text-[10px] text-on-surface-variant bg-surface-container p-1.5 rounded-md font-medium">
                        Ref: {mov.reference}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL MULTIUSOS DE ACCIÓN */}
      <Dialog open={!!actionType} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-xs bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-on-surface font-[var(--font-manrope)] flex items-center gap-3">
              {actionType === "refill" && <><RotateCcw className="w-5 h-5 text-emerald-600" /> Rellenar Llenos</>}
              {actionType === "purchase" && <><ShoppingCart className="w-5 h-5 text-teal-600" /> Sumar Llenos (Comprados)</>}
              {actionType === "loss" && <><Trash2 className="w-5 h-5 text-error" /> Registrar Pérdida (Roto/Botado)</>}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <p className="text-xs text-on-surface-variant mb-4 font-medium">
              {actionType === "refill" && "Convierte botellones vacíos en llenos (Entrada de planta)."}
              {actionType === "purchase" && "Ingresa botellones llenos nuevos, inyectando stock."}
              {actionType === "loss" && "Elimina botellones del sistema por daño físico o extravío."}
            </p>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container text-[11px] p-3 rounded-xl flex items-start gap-2 font-bold animate-in zoom-in-95 mb-4 leading-tight">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cantidad (Unidades)</label>
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Ej. 20"
                  className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-lg font-black text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {actionType === "refill" && (
                <label className="flex items-center gap-3 p-3 mt-1 cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition-colors">
                  <div className="relative flex items-center shrink-0">
                    <input 
                      type="checkbox" 
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-indigo-200 checked:border-indigo-600 checked:bg-indigo-600 transition-all"
                      checked={isReservedForNextDay}
                      onChange={(e) => setIsReservedForNextDay(e.target.checked)}
                    />
                    <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-indigo-900 leading-tight">Guardar para el siguiente turno</span>
                    <span className="text-[10px] text-indigo-600/80 font-medium leading-tight">No suma a stock actual hasta cerrar operativo.</span>
                  </div>
                </label>
              )}

              {/* Si es Loss, elegir de dónde */}
              {actionType === "loss" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tipo de envase perdido</label>
                  <select 
                    value={lossSource}
                    onChange={(e) => setLossSource(e.target.value as "full" | "empty")}
                    className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="full">Botellones Llenos</option>
                    <option value="empty">Botellones Vacíos</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Referencia / Nota (Opcional)</label>
                <input 
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="Ej. Daño en bodega"
                  className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <button 
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmAction}
              className={`px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg active:scale-95 transition-all
                ${actionType === "loss" ? "bg-error hover:bg-error/90 shadow-error/30 hover:shadow-error/50" : "bg-primary hover:bg-primary/90 shadow-primary/30 hover:shadow-primary/50"}
              `}
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AUDITORÍA (WIZARD) */}
      <Dialog open={isAuditModalOpen} onOpenChange={(open) => !open && setIsAuditModalOpen(false)}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-extrabold text-on-surface font-[var(--font-manrope)] flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-primary" /> Auditoría de inventario
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container text-[11px] p-3 rounded-xl flex items-start gap-2 font-bold animate-in zoom-in-95 mb-4 leading-tight">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {auditStep === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                <p className="text-sm font-bold text-primary mb-2">Vamos a contar los botellones reales en tu negocio.</p>
                <p className="text-xs font-medium text-on-surface-variant">Estamos contando lo que realmente existe. Este proceso no cambiará nada hasta que confirmes el conteo final.</p>
              </div>
              <DialogFooter className="mt-4">
                <button 
                  onClick={() => setAuditStep(2)}
                  className="w-full px-6 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  Iniciar conteo
                </button>
              </DialogFooter>
            </div>
          )}

          {auditStep === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Botellones Llenos</label>
                  <input 
                    type="number" min="0" step="1"
                    value={auditInputFull}
                    onChange={(e) => setAuditInputFull(e.target.value)}
                    className="flex h-14 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2 text-2xl font-black text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                    placeholder="0"
                  />
                 </div>
                 <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Botellones Vacíos</label>
                  <input 
                    type="number" min="0" step="1"
                    value={auditInputEmpty}
                    onChange={(e) => setAuditInputEmpty(e.target.value)}
                    className="flex h-14 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2 text-2xl font-black text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center"
                    placeholder="0"
                  />
                 </div>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-surface-container rounded-2xl border border-outline-variant/30">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">En clientes <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded ml-1">Solo lectura</span></span>
                    <span className="text-sm font-black text-orange-700">{borrowed}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Preparados <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded ml-1">Solo lectura</span></span>
                    <span className="text-sm font-black text-indigo-700">{inventory.reservedForNextDay || 0}</span>
                 </div>
              </div>

              <DialogFooter className="mt-2 flex gap-2 sm:justify-between w-full">
                <button 
                  onClick={() => setAuditStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Volver
                </button>
                <button 
                  onClick={() => {
                     setErrorMsg("");
                     const full = parseInt(auditInputFull, 10);
                     const empty = parseInt(auditInputEmpty, 10);
                     if (isNaN(full) || isNaN(empty) || full < 0 || empty < 0) {
                        setErrorMsg("Los valores deben ser números válidos mayores o iguales a 0.");
                        return;
                     }
                     if (full + empty < borrowed) {
                        setErrorMsg("No puedes tener menos envases físicos que los prestados.");
                        return;
                     }
                     setAuditStep(3);
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95 transition-all"
                >
                  Continuar
                </button>
              </DialogFooter>
            </div>
          )}

          {auditStep === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sistema actual</span>
                    <span className="text-lg font-black text-on-surface-variant">{inventory.total}</span>
                 </div>
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline-variant/50">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Conteo físico</span>
                    <span className="text-xl font-black text-primary">{parseInt(auditInputFull, 10) + parseInt(auditInputEmpty, 10) + borrowed + (inventory.reservedForNextDay || 0)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Diferencia</span>
                    <span className={`text-xl font-black ${(parseInt(auditInputFull, 10) + parseInt(auditInputEmpty, 10) + borrowed + (inventory.reservedForNextDay || 0)) - inventory.total > 0 ? 'text-emerald-600' : (parseInt(auditInputFull, 10) + parseInt(auditInputEmpty, 10) + borrowed + (inventory.reservedForNextDay || 0)) - inventory.total < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                      {((parseInt(auditInputFull, 10) + parseInt(auditInputEmpty, 10) + borrowed + (inventory.reservedForNextDay || 0)) - inventory.total) > 0 ? "+" : ""}{(parseInt(auditInputFull, 10) + parseInt(auditInputEmpty, 10) + borrowed + (inventory.reservedForNextDay || 0)) - inventory.total} botellones
                    </span>
                 </div>
              </div>
              <p className="text-xs font-medium text-center text-on-surface-variant mt-2">
                 Esto representa tu inventario físico real.
              </p>
              <DialogFooter className="mt-2 flex gap-2 sm:justify-between w-full">
                <button 
                  onClick={() => setAuditStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Atrás
                </button>
                <button 
                  onClick={() => setAuditStep(4)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95 transition-all"
                >
                  Siguiente paso
                </button>
              </DialogFooter>
            </div>
          )}

          {auditStep === 4 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4">
              <div className="bg-error/10 border border-error/20 p-5 rounded-2xl text-center">
                 <AlertTriangle className="w-8 h-8 text-error mx-auto mb-3" />
                 <h3 className="text-base font-black text-error mb-2 uppercase tracking-wide">¿Deseas aplicar este ajuste?</h3>
                 <p className="text-xs font-medium text-error-hover">El sistema se ajustará a este conteo. Todo movimiento posterior partirá desde esta nueva realidad.</p>
              </div>

              <DialogFooter className="mt-4 flex gap-2 w-full">
                <button 
                  onClick={() => setIsAuditModalOpen(false)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmAudit}
                  className="w-full px-6 py-3 rounded-xl text-sm font-black bg-error text-white hover:bg-error/90 shadow-lg shadow-error/20 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Confirmar Ajuste
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL HISTORIAL COMPLETO */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-6 pb-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest z-10">
            <div>
              <DialogTitle className="font-[var(--font-manrope)] text-xl font-black text-on-surface mb-1 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" /> Historial Completo
              </DialogTitle>
              <p className="text-xs font-semibold text-on-surface-variant">
                Métricas de rotación y despachos agrupados por mes.
              </p>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar bg-surface-container-lowest flex-1 space-y-6">
            {groupedMetrics.length === 0 ? (
              <div className="text-center text-on-surface-variant/50 py-10 font-bold text-sm">
                No hay registros acumulados.
              </div>
            ) : (
              groupedMetrics.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur-sm z-10 py-2 border-b border-outline-variant/30">
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest">{group.label}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        Rotación Prom: <span className="text-primary">{group.avgRot}x</span>
                      </span>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                        Total Entregado: <span className="text-primary">{group.totalDelivered}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {group.metrics.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-on-surface">
                            {m.closedAt && !isNaN(new Date(m.closedAt).getTime()) ? new Date(m.closedAt).toLocaleDateString("es-EC", { weekday: 'short', day: '2-digit', month: 'short' }) : 'Fecha inv.'}
                          </span>
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">
                            {m.closedAt && !isNaN(new Date(m.closedAt).getTime()) ? new Date(m.closedAt).toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit' }) : '-:-'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-black text-on-surface flex items-center gap-1 justify-end">{m.rotation}x</span>
                            <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">Rotación</span>
                          </div>
                          <div className="w-px h-6 bg-outline-variant/40" />
                          <div className="text-right min-w-[3rem]">
                            <span className="text-sm font-black text-on-surface">{m.delivered}</span>
                            <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest block">Despachos</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex justify-end">
             <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95"
              >
                Cerrar
              </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DEVOLUCIONES (Independiente) */}
      <Dialog open={isReturnModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsReturnModalOpen(false);
          setSelectedCustomerForReturn(null);
          setReturnAmountInput("");
          setErrorMsg("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-6 flex flex-col max-h-[85vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-extrabold text-on-surface font-[var(--font-manrope)] flex items-center gap-3">
              <RotateCcw className="w-6 h-6 text-orange-600" /> Registrar Devolución
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="bg-error-container text-on-error-container text-[11px] p-3 rounded-xl flex items-start gap-2 font-bold animate-in zoom-in-95 mb-4 leading-tight">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {!selectedCustomerForReturn ? (
            <div className="flex flex-col gap-4 overflow-hidden">
               <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                  <p className="text-sm font-bold text-orange-900 leading-tight">Selecciona un cliente para recibir envases vacíos.</p>
                  <p className="text-[11px] text-orange-700/80 font-medium mt-1">Solo se muestran clientes con préstamos pendientes.</p>
               </div>
               
               <div className="overflow-y-auto custom-scrollbar space-y-2 pr-1 max-h-[400px]">
                  {customers.filter(c => c.borrowedContainers > 0).length === 0 ? (
                    <div className="py-10 text-center">
                       <p className="text-sm font-bold text-on-surface-variant opacity-40">No hay envases pendientes en calle.</p>
                    </div>
                  ) : (
                    customers.filter(c => (c.borrowedContainers || 0) > 0).map(c => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedCustomerForReturn(c)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                      >
                         <div className="flex flex-col items-start text-left">
                            <span className="text-sm font-black text-on-surface group-hover:text-orange-900">{c.name}</span>
                            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Pendiente: {c.borrowedContainers}</span>
                         </div>
                         <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-on-surface-variant group-hover:text-orange-600 transition-colors shadow-sm focus:outline-none">
                            <ArrowUpRight className="w-4 h-4" />
                         </div>
                      </button>
                    ))
                  )}
               </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4">
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                     <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-black text-on-surface leading-tight text-left">{selectedCustomerForReturn.name}</span>
                     <span className="text-[10px] text-orange-700 font-bold uppercase tracking-widest text-left">Debe {selectedCustomerForReturn.borrowedContainers} botellones</span>
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant text-left">¿Cuántos envases devuelve?</label>
                  <input 
                    type="number"
                    min="1"
                    max={selectedCustomerForReturn.borrowedContainers}
                    value={returnAmountInput}
                    onChange={(e) => setReturnAmountInput(e.target.value)}
                    placeholder={`Máx. ${selectedCustomerForReturn.borrowedContainers}`}
                    className="flex h-16 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2 text-3xl font-black text-on-surface focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-center"
                    autoFocus
                  />
               </div>

               <DialogFooter className="mt-2 flex gap-2 w-full">
                  <button 
                    onClick={() => setSelectedCustomerForReturn(null)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                  >
                    Atrás
                  </button>
                  <button 
                    onClick={handleConfirmReturn}
                    className="w-full px-6 py-3 rounded-xl text-sm font-black bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Confirmar
                  </button>
               </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
