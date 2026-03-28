"use client";

import React, { useState, useEffect } from "react";
import { 
  Filter, 
  CircleDollarSign, 
  UserPlus, 
  User, 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  Edit,
  Trash2,
  Package
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// 1. Ampliación del tipo Customer con la nueva lógica bidones prestados
interface Customer {
  id: number;
  name: string;
  address: string;
  phone: string;
  balance: number;
  borrowedContainers: number; // Envases adeudados
  allowContainerLoan: boolean; // ¿Se le fían envases?
  avatarUrl?: string;
  tags?: string[];
  isWide?: boolean;
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Alejandro Mendoza",
    address: "Av. Libertad 452, Sector Norte",
    phone: "099 123 4567",
    balance: 1450.00,
    borrowedContainers: 3,
    allowContainerLoan: true
  },
  {
    id: 2,
    name: "Sofía Villalobos",
    address: "Calle Los Pinos #12, Residencial",
    phone: "098 765 4321",
    balance: 0.00,
    borrowedContainers: 0,
    allowContainerLoan: true
  },
  {
    id: 3,
    name: "Roberto García",
    address: "Industrial Park B-20, Zona Industrial",
    phone: "097 654 3210",
    balance: 320.50,
    borrowedContainers: 0,
    allowContainerLoan: false // A este cliente no se le prestan, se le cobran.
  },
  {
    id: 4,
    name: "Distribuidora H2O S.A.",
    address: "Plaza Central #105, Centro Histórico",
    phone: "02 223 4567",
    balance: 5800.00,
    borrowedContainers: 45,
    allowContainerLoan: true,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzXRBLnOZ68eKyZv1E1m5c75FgnrpsR6Do04jTzR5fOZySvJBuYbhu2ZvrmN7iSPYNiQu5-s6pPN-q3bqCsGCiGeqofWoBnUxLbZh2ioyR7nOnC3OMKaRm8_KRGgn4oBTxH2f-w8nLpuQW3Hgf74JRP5JV2oc4I6R6JNSzS9O1Pt5rKJOZz5SUWI9Y7UeadbOWkJqFRDiLRhAC6I6GphMKf5JYD4j6bk6kHQAmBfZqPsPjWASlCeNI1Zsz8PEowr-B-XH7x52EhqM-",
    tags: ["MAYORISTA", "RUTA 04"],
    isWide: true
  },
  {
    id: 5,
    name: "Mariana Soto",
    address: "Condominio El Prado, Torre A-102",
    phone: "099 888 7777",
    balance: 0.00,
    borrowedContainers: 2,
    allowContainerLoan: true
  }
];

const STORAGE_KEY = "@hydroflow_customers";

export default function CustomersPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Estados del formulario
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAllowContainerLoan, setNewAllowContainerLoan] = useState<boolean>(true); // Por defecto se le fían
  const [errorMsg, setErrorMsg] = useState("");

  // ============================================
  // EFECTOS PARA PERSISTENCIA CON LOCALSTORAGE
  // ============================================
  useEffect(() => {
    setIsMounted(true);
    const storedData = localStorage.getItem(STORAGE_KEY);
    
    if (storedData) {
      try {
        setCustomers(JSON.parse(storedData));
      } catch (error) {
        setCustomers(initialCustomers); 
      }
    } else {
      setCustomers(initialCustomers); 
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    }
  }, [customers, isMounted]);

  // ============================================
  // ACCIONES CRUD (Create, Update, Delete)
  // ============================================

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setNewName("");
    setNewAddress("");
    setNewPhone("");
    setNewAllowContainerLoan(true); // Siempre inicia true
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewName(customer.name);
    setNewAddress(customer.address);
    setNewPhone(customer.phone);
    // Recuperar preferencia de fianza antigua o asignar true si no la tiene
    setNewAllowContainerLoan(customer.allowContainerLoan !== false); 
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (id: number, name: string) => {
    const isConfirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${name}"?`);
    if (isConfirmed) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSaveForm = () => {
    setErrorMsg("");
    
    if (!newName.trim() || !newAddress.trim() || !newPhone.trim()) {
      setErrorMsg("Por favor, completa todos los campos.");
      return;
    }

    if (editingCustomer) {
      setCustomers(prev => prev.map((c) => {
        if (c.id === editingCustomer.id) {
          return {
            ...c,
            name: newName.trim(),
            address: newAddress.trim(),
            phone: newPhone.trim(),
            allowContainerLoan: newAllowContainerLoan
            // El balance y prestados se mantienen intactos
          };
        }
        return c;
      }));
    } else {
      const newCustomer: Customer = {
        id: Date.now(),
        name: newName.trim(),
        address: newAddress.trim(),
        phone: newPhone.trim(),
        balance: 0,
        borrowedContainers: 0,
        allowContainerLoan: newAllowContainerLoan
      };
      
      setCustomers((prev) => [newCustomer, ...prev]);
    }
    
    setIsModalOpen(false);
  };

  // ============================================
  // UTILIDADES
  // ============================================
  
  const isDebt = (balance: number) => balance > 0;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
  };

  if (!isMounted) return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Encabezado y Opciones */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-[var(--font-manrope)]">
            Directorio de Clientes
          </h1>
          <p className="text-on-surface-variant font-medium">
            Gestiona tu cartera de clientes y saldos pendientes. ({customers.length} actuales)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="bg-surface-container-low px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-semibold hover:bg-surface-container-high transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="signature-gradient text-white px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform hover:shadow-primary/40"
          >
            <UserPlus className="w-5 h-5" />
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Grid Iterativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {customers.map((customer) => {
          const hasDebt = isDebt(customer.balance);
          
          if (customer.isWide) {
            return (
              <div key={customer.id} className="bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-sm md:col-span-2 hover:shadow-md transition-shadow group flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-6 w-full z-10">
                  <div className="h-20 w-20 shrink-0 rounded-3xl bg-primary/5 flex items-center justify-center text-primary overflow-hidden">
                    {customer.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={`${customer.name} Avatar`} className="w-full h-full object-cover" src={customer.avatarUrl} />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-2xl font-bold text-on-surface font-[var(--font-manrope)] leading-tight">{customer.name}</h3>
                      {/* Control Panel (Editar y Borrar) */}
                      <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditModal(customer)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-full transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Prestamos en empresa */}
                    <div className="flex items-center gap-3 mt-1.5 mb-2">
                      {!customer.allowContainerLoan && (
                         <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-sm border border-orange-500/20 text-orange-600 bg-orange-500/10">No Préstamos</span>
                      )}
                      {customer.borrowedContainers > 0 && (
                        <div className="flex items-center gap-1 text-on-surface-variant font-bold text-xs bg-surface-container-low px-2 py-1 rounded-md">
                          <Package className="w-3.5 h-3.5 text-primary" />
                          <span>{customer.borrowedContainers} Prestados</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium line-clamp-1">{customer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col sm:items-end w-full sm:w-auto min-w-[200px] z-10">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Saldo Pendiente</p>
                  <p className="text-3xl font-black text-tertiary font-[var(--font-manrope)] tracking-tight">{formatCurrency(customer.balance)}</p>
                </div>
              </div>
            );
          }

          /* TARJETA NORMAL */
          return (
            <div 
              key={customer.id} 
              className={`bg-surface-container-lowest p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full ${!hasDebt ? 'border-l-4 border-secondary' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${!hasDebt ? 'bg-secondary/5 text-secondary' : 'bg-primary/5 text-primary'}`}>
                  <User className="w-8 h-8" />
                </div>
                
                <div className="flex items-center gap-2">
                  {hasDebt ? (
                    <div className="bg-tertiary-container/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-on-tertiary-fixed-variant" />
                      <span className="text-[10px] font-bold text-on-tertiary-fixed-variant uppercase tracking-wider">Deuda</span>
                    </div>
                  ) : (
                    <div className="bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-on-secondary-container" />
                      <span className="text-[10px] font-bold text-on-secondary-container uppercase tracking-wider">Al Día</span>
                    </div>
                  )}

                  {/* Acciones CRUD */}
                  <div className="flex items-center bg-surface-container-low rounded-full opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditModal(customer)} className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors" title="Editar">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-xl transition-colors" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-on-surface font-[var(--font-manrope)]">{customer.name}</h3>
                
                {/* Indicadores Dinámicos */}
                <div className="flex flex-wrap items-center gap-2 my-2">
                  {!customer.allowContainerLoan && (
                    <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-black rounded-sm border border-orange-500/20 text-orange-600 bg-orange-500/10">No Fía Envases</span>
                  )}
                  {customer.borrowedContainers > 0 && (
                    <span className="flex items-center gap-1 text-on-surface-variant font-bold text-xs bg-surface-container-low px-2 py-1 rounded-md">
                      <Package className="w-3.5 h-3.5 text-primary/70" /> {customer.borrowedContainers} en préstamo
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-on-surface-variant mb-6 mt-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium line-clamp-1">{customer.address}</span>
                  </div>
                  <span className="text-xs font-medium bg-surface-container-low px-2 py-1 rounded-md mt-1 self-start">{customer.phone}</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Saldo Pendiente</p>
                  <p className={`text-2xl font-black font-[var(--font-manrope)] tracking-tight ${!hasDebt ? 'text-secondary' : 'text-tertiary'}`}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                <button className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==========================================================
          MODAL: Formulario de Creación / Edición Reutilizable
          ========================================================== */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest font-[var(--font-inter)] border-none shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-manrope)] text-2xl font-black text-on-surface">
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-5 py-4">
            {errorMsg && (
              <div className="bg-error-container text-on-error-container text-sm p-3 rounded-lg flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5 border-b border-outline-variant/30 pb-4">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nombre y Apellido</label>
              <input 
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Dirección Completa</label>
              <input 
                id="address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Ej. Av. República 432"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Teléfono</label>
              <input 
                id="phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Ej. +593 99 123 4567"
              />
            </div>

            {/* TOGGLE PERMITIR PRÉSTAMO */}
            <div className="mt-2 bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-on-surface text-sm">Permitir préstamo de envases</p>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Si se apaga, los faltantes se cobrarán automáticamente en la ruta.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={newAllowContainerLoan}
                  onChange={(e) => setNewAllowContainerLoan(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-3 mt-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveForm}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white signature-gradient shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Guardar Cliente
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
