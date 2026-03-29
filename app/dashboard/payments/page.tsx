"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  AlertCircle,
  CheckCircle2,
  User,
  Package,
  Search,
  CircleDollarSign,
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

interface Customer {
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

type PaymentMethod = "cash" | "transfer";

type Payment = {
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

const CUSTOMERS_KEY = "@hydroflow_customers";
const PAYMENTS_KEY = "@hydroflow_payments";
const SETTINGS_KEY = "@hydroflow_settings";

// Helper re-utilizable
const formatCurrency = (value: number) =>
  value.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
  });

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(200);

  // Buscar clientes
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [amountInput, setAmountInput] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(() => {
    // Hoy en formato YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editGoalInput, setEditGoalInput] = useState<string>("");

  // Highlight State for Scroll Action
  const [highlightedCustomerId, setHighlightedCustomerId] = useState<number | null>(null);

  // ============================================
  // EFECTOS (CARGA)
  // ============================================

  useEffect(() => {
    setIsMounted(true);

    const storedCustomers = localStorage.getItem(CUSTOMERS_KEY);
    if (storedCustomers) {
      try {
        setCustomers(JSON.parse(storedCustomers));
      } catch (err) {
        console.error("Error parsing customers", err);
      }
    }

    const storedPayments = localStorage.getItem(PAYMENTS_KEY);
    if (storedPayments) {
      try {
        setPayments(JSON.parse(storedPayments));
      } catch (err) {
        console.error("Error parsing payments", err);
      }
    }

    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (typeof parsed.weeklyGoal === "number") {
          setWeeklyGoal(parsed.weeklyGoal);
        }
      } catch (err) {
        console.error("Error parsing settings", err);
      }
    }
  }, []);

  // Guardar en Storage de forma reactiva a cambios
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
    }
  }, [customers, payments, isMounted]);

  // Limpiar mensajes de éxito a los 3 segundos
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ============================================
  // LÓGICA DE NEGOCIO Y CÁLCULOS
  // ============================================

  const totalGlobalDebt = customers.reduce((acc, curr) => acc + curr.balance, 0);

  // Lógica Semanal
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyPayments = payments.filter((p) => {
    const paymentDate = new Date(p.date);
    return paymentDate >= startOfWeek;
  });

  const weeklyCollected = weeklyPayments.reduce((acc, p) => acc + p.amount, 0);
  const progress = weeklyGoal > 0 ? Math.min((weeklyCollected / weeklyGoal) * 100, 100) : 0;
  const amountMissing = Math.max(weeklyGoal - weeklyCollected, 0);

  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.balance - a.balance);

  let progressColor = "bg-error";
  let progressText = "Bajo rendimiento";

  if (progress >= 100) {
    progressColor = "bg-secondary";
    progressText = "Meta alcanzada 🎉";
  } else if (progress >= 80) {
    progressColor = "bg-secondary";
    progressText = "Meta casi alcanzada";
  } else if (progress >= 40) {
    progressColor = "bg-orange-400";
    progressText = "Buen progreso";
  }

  const handleScrollToCustomer = (customerId: number) => {
    const el = document.getElementById(`customer-card-${customerId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedCustomerId(customerId);
      setTimeout(() => setHighlightedCustomerId(null), 2000);
    }
  };

  const handleOpenModal = (customer: Customer) => {
    if (customer.balance <= 0) return;

    setSelectedCustomer(customer);
    setAmountInput("");
    setMethod("cash");
    setReference("");
    setNote("");
    setErrorMsg("");
    setDateStr(new Date().toISOString().split("T")[0]);
    setIsModalOpen(true);
  };

  const currentAmount = parseFloat(amountInput) || 0;
  // Calculo preview safe real-time
  const newBalancePreview = selectedCustomer
    ? Math.max(selectedCustomer.balance - currentAmount, 0)
    : 0;

  const handleConfirmPayment = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedCustomer) return;

    const amount = parseFloat(amountInput);

    // Validaciones
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("El monto debe ser mayor a 0.");
      return;
    }
    if (amount > selectedCustomer.balance) {
      setErrorMsg("El monto no puede ser mayor a la deuda actual.");
      return;
    }
    if (method === "transfer" && !reference.trim()) {
      setErrorMsg("Por favor, ingresa el número de referencia para la transferencia.");
      return;
    }

    // 1. Calcular
    const previousBalance = selectedCustomer.balance;
    const newBalance = Math.max(previousBalance - amount, 0);

    // 2. Actualizar customers SIN mutar
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selectedCustomer.id
          ? { ...c, balance: newBalance }
          : c
      )
    );

    // 3. Crear Payment
    const paymentDate = new Date(dateStr);
    // Para no poner siempre a medianoche, pero respetar el día escogido:
    // Si la fecha es hoy, usar Date.now() para hora real, si es pasada, poner hora arbitraria
    const todayStr = new Date().toISOString().split("T")[0];
    const finalIsoDate = dateStr === todayStr
      ? new Date().toISOString()
      : paymentDate.toISOString();

    const newPayment: Payment = {
      id: Date.now(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount,
      method,
      reference: method === "transfer" ? reference.trim() : undefined,
      note: note.trim() || undefined,
      previousBalance,
      newBalance,
      date: finalIsoDate,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // 4. UX Post Pago
    setSuccessMsg(`Pago registrado. Nueva deuda: ${formatCurrency(newBalance)}`);
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-[var(--font-manrope)]">
            Gestión de Cobros
          </h1>
          <p className="text-on-surface-variant font-medium">
            Registra pagos y visualiza la deudalogía de tus clientes.
          </p>
        </div>

        {/* Total General KPI Card */}
        <div className="bg-tertiary-container/10 border border-tertiary/20 p-5 rounded-2xl flex flex-col min-w-[280px] shadow-sm relative">
          <button
            onClick={() => {
              setEditGoalInput(weeklyGoal.toString());
              setIsGoalModalOpen(true);
            }}
            className="absolute top-4 right-4 text-[10px] uppercase font-bold text-tertiary bg-tertiary/10 px-2 py-1.5 rounded-md hover:bg-tertiary/20 transition-colors"
          >
            Editar Meta
          </button>

          <div>
            <p className="text-[10px] items-center gap-1 font-bold text-on-tertiary-fixed-variant uppercase tracking-widest flex mb-1">
              <CircleDollarSign className="w-4 h-4" />
              Deuda Total Global
            </p>
            <p className="text-3xl font-black text-tertiary font-[var(--font-manrope)] tracking-tight">
              {formatCurrency(totalGlobalDebt)}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-tertiary/20 pt-4 mt-4">
            <div className="flex justify-between items-end text-xs font-bold text-on-surface-variant mb-1">
              <span>Meta semanal: <span className="text-on-surface">{formatCurrency(weeklyGoal)}</span></span>
              <span className={progress >= 100 ? "text-secondary font-black" : progress >= 80 ? "text-secondary" : progress >= 40 ? "text-orange-500" : "text-error"}>
                {progressText} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="bg-surface-container-high rounded-full h-2 w-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-on-surface-variant/70 font-medium tracking-wide">
                Cobrado esta semana: <span className="font-bold text-on-surface">{formatCurrency(weeklyCollected)}</span>
              </p>
              {progress < 100 && weeklyGoal > 0 && (
                <p className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                  Faltan {formatCurrency(amountMissing)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-secondary-container/50 border border-secondary text-on-secondary-container p-4 rounded-xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-secondary" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Lado Izquierdo: Lista de Clientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-[var(--font-manrope)] flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Cartera de Clientes
            </h2>
            <div className="flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
              <Search className="w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm w-40 ml-2 outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCustomers.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-on-surface-variant opacity-60 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
                <User className="w-10 h-10 mb-2" />
                <p className="text-sm font-medium">No hay clientes para mostrar.</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isZero = customer.balance === 0;
                const isCritical = customer.balance >= 50;
                const isMedium = customer.balance >= 20 && customer.balance < 50;
                const isLow = customer.balance > 0 && customer.balance < 20;
                const isHighlighted = highlightedCustomerId === customer.id;
                
                const buttonText = isCritical ? "Cobrar urgente" : isMedium ? "Cobrar ahora" : "Registrar pago";

                return (
                  <div
                    key={customer.id}
                    id={`customer-card-${customer.id}`}
                    className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm border-l-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4
                      ${isZero ? "border-secondary" : isCritical ? "border-error" : isMedium ? "border-orange-500" : "border-yellow-400"}
                      ${isHighlighted ? "ring-2 ring-primary ring-offset-2 !bg-primary/5 scale-[1.02]" : ""}
                    `}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg leading-tight font-[var(--font-manrope)] text-on-surface">
                          {customer.name}
                        </h3>
                        {/* Status Visual */}
                        {isZero ? (
                          <span className="bg-secondary/10 text-secondary text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                            Al día
                          </span>
                        ) : isCritical ? (
                          <span className="bg-error-container text-on-error-container text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                            Crítico
                          </span>
                        ) : isMedium ? (
                          <span className="bg-orange-500/10 text-orange-600 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                            Medio
                          </span>
                        ) : (
                          <span className="bg-yellow-400/10 text-yellow-600 text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1">
                            Bajo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm mt-2 transition-all">
                        <div className="flex flex-col">
                          <span className="text-xs text-on-surface-variant uppercase font-bold tracking-widest mb-0.5">Saldo</span>
                          <span className={`font-black tracking-tight ${isZero ? "text-secondary" : isCritical ? "text-error" : isMedium ? "text-orange-600" : "text-yellow-600"}`}>
                            {formatCurrency(customer.balance)}
                          </span>
                        </div>

                        {customer.borrowedContainers > 0 && (
                          <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1 rounded-md h-fit">
                            <Package className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-bold text-on-surface-variant">{customer.borrowedContainers} Envases</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenModal(customer)}
                      disabled={isZero}
                      title={isZero ? "Este cliente no tiene deuda" : "Registrar nuevo pago"}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 justify-center shrink-0 transition-all ${isZero
                        ? "bg-surface-container text-on-surface-variant/40 cursor-not-allowed opacity-60"
                        : "bg-primary text-on-primary hover:bg-primary/90 shadow-md hover:shadow-primary/30 active:scale-95 hover:-translate-y-0.5"
                        }`}
                    >
                      <Banknote className="w-4 h-4" />
                      {buttonText}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lado Derecho: Historial Ráplido */}
        <div className="lg:col-span-1 bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/30 flex flex-col h-[700px]">
          <h2 className="text-lg font-black font-[var(--font-manrope)] flex items-center gap-2 mb-6">
            Historial de Pagos
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {payments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                <Banknote className="w-12 h-12 mb-2" />
                <p className="text-sm font-medium">Aún no hay pagos registrados.</p>
              </div>
            ) : (
              // Filtrar recientes primero
              [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                <div
                  key={payment.id}
                  onClick={() => handleScrollToCustomer(payment.customerId)}
                  className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-sm text-on-surface leading-tight line-clamp-1 group-hover:text-primary transition-colors">{payment.customerName}</p>
                    <span className="text-xs font-black text-secondary shrink-0 ml-2 bg-secondary/10 px-2 py-0.5 rounded-full">
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                    <span className={`px-2 py-0.5 rounded-md ${payment.method === "cash" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                      {payment.method === "cash" ? "💵 Efectivo" : "🏦 Transferencia"}
                    </span>
                    {payment.method === "transfer" && payment.reference && (
                      <span className="lowercase font-medium tracking-normal text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                        Ref: {payment.reference}
                      </span>
                    )}
                    {payment.proofImageUrl && (
                      <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md flex items-center gap-1">
                        📎 Comprobante adjunto
                      </span>
                    )}
                  </div>

                  <div className="bg-surface-container-low rounded-lg p-2.5 py-1.5 flex items-center justify-between border border-outline-variant/40 transition-colors">
                    <span className="text-xs text-on-surface-variant line-through font-semibold">{formatCurrency(payment.previousBalance)}</span>
                    <span className="text-xs font-black text-on-surface-variant/50 mx-1">→</span>
                    <span className="text-xs font-black text-secondary">{formatCurrency(payment.newBalance)}</span>
                  </div>

                  <p className="text-[10px] text-on-surface-variant/60 font-medium text-right mt-2 uppercase tracking-widest">
                    {new Date(payment.date).toLocaleDateString("es-EC", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL PAGO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">

          <div className="px-6 pt-6 pb-4 bg-tertiary/5 border-b border-tertiary/10">
            <DialogTitle className="font-[var(--font-manrope)] text-2xl font-black text-on-surface flex items-center gap-2">
              Registrar Pago
            </DialogTitle>
            {selectedCustomer && (
              <p className="text-sm font-bold text-on-surface-variant mt-1.5 flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">Cliente</span>
                <span className="text-base text-on-surface">{selectedCustomer.name}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-5 px-6 py-4">

            {/* Lógica de Preview UX importante */}
            <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 shadow-inner">
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Deuda Actual</p>
                  <p className="text-lg font-black text-tertiary font-[var(--font-manrope)]">{selectedCustomer ? formatCurrency(selectedCustomer.balance) : "$0.00"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Monto a Pagar</p>
                  <p className="text-lg font-black text-orange-500 font-[var(--font-manrope)]">- {formatCurrency(currentAmount)}</p>
                </div>
                <div className="col-span-2 pt-3 border-t border-outline-variant/40 flex justify-between items-end">
                  <p className="text-xs uppercase font-black text-on-surface tracking-wider">Nueva Deuda</p>
                  <p className="text-2xl font-black text-secondary font-[var(--font-manrope)]">{formatCurrency(newBalancePreview)}</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-error-container text-on-error-container text-xs p-3 rounded-xl flex items-center gap-2 font-bold animate-in zoom-in-95 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-lg font-black text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Método</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="cash">💵 Efectivo</option>
                  <option value="transfer">🏦 Transferencia</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Fecha</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {method === "transfer" && (
                <>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">N° Referencia</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Ej. 1293019283"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nota (Opcional)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Ej. Pago del mes pasado"
                    />
                  </div>
                </>
              )}
            </div>

          </div>

          <DialogFooter className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30 flex sm:justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmPayment}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Banknote className="w-4 h-4" />
              Confirmar Pago
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL EDITAR META SEMANAL */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-xs bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-3xl p-6">
          <DialogTitle className="font-[var(--font-manrope)] text-xl font-black text-on-surface mb-4">
            Editar Meta Semanal
          </DialogTitle>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nueva Meta ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={editGoalInput}
              onChange={(e) => setEditGoalInput(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-lg font-black text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const newVal = parseFloat(editGoalInput);
                if (!isNaN(newVal) && newVal >= 0) {
                  setWeeklyGoal(newVal);
                  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ weeklyGoal: newVal }));
                  setIsGoalModalOpen(false);
                }
              }}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
            >
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
