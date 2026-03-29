"use client";

import React, { useEffect, useState } from "react";
import { Truck, User, Package, DollarSign, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  address: string;
  phone: string;
  balance: number;
  borrowedContainers: number;
  allowContainerLoan: boolean;
}

interface Delivery {
  id: number;
  customerId: number;
  customerName: string;
  delivered: number;
  returned: number;
  missing: number;
  total: number;
  date: string;
  usedLoan: boolean;
}

const STORAGE_KEY = "@hydroflow_customers";
const DELIVERIES_STORAGE_KEY = "@hydroflow_deliveries";
const CONTAINER_PRICE = 10; // Precio de cobro por envase hardcodeado por requerimiento actual

export default function DeliveriesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  
  // ==============================
  // ESTADOS DEL FORMULARIO
  // ==============================
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [delivered, setDelivered] = useState<number | "">("");
  const [returned, setReturned] = useState<number | "">(0);
  const [price, setPrice] = useState<number | "">(3.5);
  
  const [successMsg, setSuccessMsg] = useState("");

  // ==============================
  // CARGA DE DATOS (Mount)
  // ==============================
  useEffect(() => {
    setIsMounted(true);
    
    // Cargar Clientes
    const storedCustomers = localStorage.getItem(STORAGE_KEY);
    if (storedCustomers) {
      try {
        setCustomers(JSON.parse(storedCustomers));
      } catch (e) {
        setCustomers([]);
      }
    }

    // Cargar Entregas previas
    const storedDeliveries = localStorage.getItem(DELIVERIES_STORAGE_KEY);
    if (storedDeliveries) {
      try {
        setDeliveries(JSON.parse(storedDeliveries));
      } catch (e) {
        setDeliveries([]);
      }
    }
  }, []);

  // Actualizar LocalStorage cuando algo cambie
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(deliveries));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    }
  }, [deliveries, customers, isMounted]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // ==============================
  // LÓGICA DE NEGOCIO EN VIVO
  // ==============================
  const safeDelivered = Number(delivered) || 0;
  const safeReturned = Number(returned) || 0;
  const safePrice = Number(price) || 0;
  
  const missing = Math.max(safeDelivered - safeReturned, 0);
  
  const isLoanAllowed = selectedCustomer ? selectedCustomer.allowContainerLoan : true;
  
  let total = 0;
  let chargingContainers = false;

  if (isLoanAllowed) {
    // Si permite préstamo: solo se cobra el costo del agua entregada
    total = safeDelivered * safePrice;
    chargingContainers = false;
  } else {
    // Si NO permite préstamo: se cobra el agua entregada + penalidad por envases faltantes
    total = (safeDelivered * safePrice) + (missing * CONTAINER_PRICE);
    chargingContainers = missing > 0;
  }

  // ==============================
  // VALIDACIÓN DE FORMULARIO
  // ==============================
  const isValid = 
    selectedCustomerId !== "" && 
    safeDelivered > 0 &&         
    safePrice > 0 &&            
    safeReturned >= 0 &&
    safeReturned <= safeDelivered; // No puede devolver más de lo entregado

  // ==============================
  // FUNCIONAMIENTO CRUD Y GUARDADO
  // ==============================
  const handleSave = () => {
    if (!selectedCustomer || !isValid) return;

    // 1. Crear Objeto Delivery
    const newDelivery: Delivery = {
      id: Date.now(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      delivered: safeDelivered,
      returned: safeReturned,
      missing: missing,
      total: total,
      date: new Date().toISOString(),
      usedLoan: isLoanAllowed
    };

    setDeliveries(prev => [newDelivery, ...prev]);

    // 2. Sumar el "total" a la deuda del cliente en memoria y actualizar préstamos
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          balance: c.balance + total,
          // Solo se aumentan envases prestados si su cuenta lo permite. Si se los cobraron directos, no se fiaron.
          borrowedContainers: isLoanAllowed ? c.borrowedContainers + missing : c.borrowedContainers
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);

    // Mensaje de éxito
    setSuccessMsg(`¡Entrega verificada y guardada para ${selectedCustomer.name}!`);
    setTimeout(() => setSuccessMsg(""), 4000);

    // Reset Formulario
    setSelectedCustomerId("");
    setDelivered("");
    setReturned(0);
  };

  // Formateador de Fecha requerido ("27 Mar - 14:30")
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} - ${hours}:${mins}`;
  }

  // Formateador de moneda en estándar de Ecuador
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("es-EC", {
      style: "currency",
      currency: "USD"
    });
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2 font-[var(--font-manrope)] flex items-center gap-3">
          <Truck className="w-8 h-8 text-primary" />
          Registrar Entrega
        </h1>
        <p className="text-on-surface-variant font-medium">
          Reporta rutas y actualiza el saldo o préstamo automáticamente.
        </p>
      </div>

      {/* TARJETA DEL FORMULARIO */}
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] shadow-sm border border-outline-variant/30 mb-12">
        
        {successMsg && (
          <div className="mb-6 bg-secondary/10 text-secondary-container-hover text-sm p-4 rounded-xl flex items-center gap-3 font-bold animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        {customers.length === 0 ? (
          <div className="text-center py-10 bg-surface-container-low rounded-xl">
            <AlertCircle className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-50" />
            <p className="text-on-surface-variant font-bold">Base de datos de clientes vacía.</p>
            <p className="text-sm text-on-surface-variant mt-1">Dirígete al directorio de clientes primero para agregar habitantes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* INPUT 1: BÚSQUEDA DEL CLIENTE */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente Receptor
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3.5 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="" disabled>Seleccione cliente del listado</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.balance > 0 ? `(Deuda actual: ${formatCurrency(c.balance)})` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* FEEDBACK DINÁMICO DEL CLIENTE SELECCIONADO */}
            {selectedCustomer && (
              <div className="flex items-center gap-2 bg-surface-container my-2 p-3 rounded-lg border border-outline-variant/30 text-sm font-medium">
                {selectedCustomer.allowContainerLoan ? (
                  <span className="text-primary flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Cliente con préstamo de envases habilitado.
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" /> Envases faltantes se cobrarán en esta tarjeta (${CONTAINER_PRICE} c/u).
                  </span>
                )}
              </div>
            )}

            {/* INPUTS 2: CAJAS NUMÉRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600 dark:text-green-500" /> Cantidad Entregada
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 10"
                  value={delivered}
                  onChange={(e) => setDelivered(e.target.value === "" ? "" : Number(e.target.value))}
                  className="flex h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-lg font-bold placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" /> Envases Recogidos
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej. 2"
                  value={returned}
                  onChange={(e) => {
                     // Solo evitamos el negativo aquí, el overflow se valida en el boton
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) setReturned(val === "" ? "" : Number(val));
                  }}
                  className={`flex h-12 w-full rounded-xl border bg-surface-container-low px-4 py-2 text-lg font-bold placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary transition-all ${safeReturned > safeDelivered ? 'border-error focus:ring-error text-error' : 'border-outline-variant focus:border-transparent'}`}
                />
                {(safeReturned > safeDelivered) && (
                   <span className="text-[10px] text-error font-bold absolute -bottom-4 right-1">Imposible recoger más de lo entregado</span>
                )}
              </div>
            </div>

            {/* INPUTS 3: DINERO CÁLCULOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Tarifa por recarga
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="flex h-12 w-full pl-8 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-lg font-bold placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Pantalla Reactiva de Cálculo (Total Neto Modificado) */}
              <div className={`border rounded-xl p-4 flex flex-col items-end justify-center h-[72px] transition-colors ${chargingContainers ? 'bg-orange-500/10 border-orange-500/30' : 'bg-primary/5 border-primary/20'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${chargingContainers ? 'text-orange-700' : 'text-primary/80'}`}>Total a Cobrar</span>
                <span className={`text-2xl font-black font-[var(--font-manrope)] leading-none mt-1 ${chargingContainers ? 'text-orange-700' : 'text-primary'}`}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* EXPLICADOR DINÁMICO ARRIBA DEL BOTÓN */}
            <div className="flex flex-col items-center justify-center -mb-2 mt-4 text-sm font-medium">
               {selectedCustomer && missing > 0 ? (
                 isLoanAllowed ? (
                   <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold">
                     Envases a prestar: {missing}
                   </span>
                 ) : (
                   <span className="bg-orange-500/10 text-orange-600 px-4 py-1.5 rounded-full font-bold">
                     Envases a cobrar: {missing} (Total costo extra: {formatCurrency(missing * CONTAINER_PRICE)})
                   </span>
                 )
               ) : null}
            </div>

            <hr className="border-outline-variant/30 my-4" />

            {/* ACCIÓN: SUMBAR AL localStorage */}
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`w-full h-14 rounded-full text-base font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                isValid 
                  ? "signature-gradient shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 cursor-pointer" 
                  : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
              }`}
            >
              <Truck className="w-5 h-5" />
              Confirmar Entrega y Guardar
            </button>

          </div>
        )}
      </div>

      {/* ==========================================================
          SECCIÓN HISTORIAL
          ========================================================== */}
      {(deliveries.length > 0) && (
        <div className="mt-4">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-6 font-[var(--font-manrope)]">
            Historial de Entregas
          </h2>
          
          <div className="flex flex-col gap-4">
            {deliveries.map(delivery => (
              <div key={delivery.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-primary/30 transition-colors relative overflow-hidden">
                
                {/* Lado Izquierdo: Cliente y Fecha */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-lg text-on-surface font-[var(--font-manrope)]">{delivery.customerName}</h3>
                    {delivery.total > 0 ? (
                      <span className="px-2 py-0.5 bg-tertiary/10 text-tertiary-hover text-[10px] font-bold rounded-full border border-tertiary/20 uppercase tracking-widest">
                        Deuda
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[10px] font-bold rounded-full border border-secondary/20 uppercase tracking-widest">
                        Pagado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> 
                    Completado el {formatDate(delivery.date)}
                  </p>

                  <div className="mt-2.5">
                     {delivery.missing > 0 && (
                       delivery.usedLoan 
                         ? <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-1 rounded bg-primary/5 text-primary">Prestados {delivery.missing} envases</span>
                         : <span className="text-[10px] font-bold uppercase bg-surface-container px-2 py-1 rounded bg-orange-500/10 text-orange-600">Cobrados {delivery.missing} envases faltantes</span>
                     )}
                  </div>
                </div>

                {/* Centro: Resumen de Cajas (Bidones) */}
                <div className="flex items-center gap-4 bg-surface-container-low px-4 py-3 rounded-xl w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="flex flex-col items-center min-w-[3rem]">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/80 mb-1">Entregó</span>
                    <span className="font-black text-on-surface flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-green-600 dark:text-green-500"/> 
                      {delivery.delivered}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/50"></div>
                  <div className="flex flex-col items-center min-w-[3rem]">
                     <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/80 mb-1">Recogió</span>
                     <span className="font-black text-on-surface flex items-center gap-1.5">
                       <Package className="w-4 h-4 text-orange-500"/> 
                       {delivery.returned}
                     </span>
                  </div>
                </div>

                {/* Lado Derecho: Precio final */}
                <div className="flex flex-col items-start sm:items-end bg-surface-container-low sm:bg-transparent p-4 sm:p-0 rounded-xl w-full sm:w-auto mt-2 sm:mt-0">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-0.5">Total a cobrar</span>
                  <span className={`text-2xl font-black font-[var(--font-manrope)] leading-none ${delivery.total > 0 ? 'text-tertiary' : 'text-secondary'}`}>
                    {formatCurrency(delivery.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
