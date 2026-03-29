"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  UserCircle,
  LayoutDashboard,
  Users,
  Truck,
  Banknote,
  Package,
  PlusCircle,
  UserPlus
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Helper to know if a path is active to apply styles
  const isActive = (path: string) => pathname === path;

  return (
    <div className="bg-surface min-h-screen text-on-surface font-[var(--font-inter)] dark:bg-slate-950 flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none bg-gradient-to-b from-slate-200/20 to-transparent">
        <div className="flex justify-between items-center w-full px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-blue-700 dark:text-blue-400 italic font-[var(--font-manrope)]">
              AquaControl Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <Search className="text-on-surface-variant w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-48 lg:w-64 placeholder:text-on-surface-variant/60 outline-none ml-2"
                placeholder="Buscar clientes..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <button className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200">
                <Bell className="text-on-surface-variant w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-200">
                <UserCircle className="text-on-surface-variant w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SideNavBar (Desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col p-4 bg-[#f7f9fb] dark:bg-slate-900 z-40 border-r border-slate-200 dark:border-slate-800">
        <div className="mt-20 flex flex-col h-full">
          <div className="mb-8 px-2">
            <h2 className="text-2xl font-black text-blue-700 dark:text-blue-400 font-[var(--font-manrope)]">
              AquaControl
            </h2>
            <p className="text-xs text-slate-500 font-medium">Distribution Manager</p>
          </div>

          <nav className="space-y-1 flex-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${isActive("/dashboard")
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${isActive("/dashboard") ? "fill-blue-700/20" : ""}`} />
              <span className="font-medium text-sm">Dashboard</span>
            </Link>

            <Link
              href="/dashboard/customers"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${isActive("/dashboard/customers")
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
            >
              <Users className={`w-5 h-5 ${isActive("/dashboard/customers") ? "fill-blue-700/20" : ""}`} />
              <span className="font-medium text-sm">Clientes</span>
            </Link>

            <Link
              href="/dashboard/deliveries"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${isActive("/dashboard/deliveries")
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
            >
              <Truck className={`w-5 h-5 ${isActive("/dashboard/deliveries") ? "fill-blue-700/20" : ""}`} />
              <span className="font-medium text-sm">Entregas</span>
            </Link>

            <Link
              href="/dashboard/payments"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${isActive("/dashboard/payments")
                ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
            >
              <Banknote className={`w-5 h-5 ${isActive("/dashboard/payments") ? "fill-blue-700/20" : ""}`} />
              <span className="font-medium text-sm">Cobros</span>
            </Link>

            <Link
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl transition-all duration-300 ease-in-out"
            >
              <Package className="w-5 h-5" />
              <span className="font-medium text-sm">Inventario</span>
            </Link>
          </nav>

          <div className="mt-auto">
            <button className="w-full signature-gradient text-white py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all">
              <PlusCircle className="w-5 h-5" />
              <span>Register Delivery</span>
            </button>
            <div className="mt-6 flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Admin User Profile"
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeuDOitWYN7BqxhShNPFJp3wGlclQv9b7_6Ch1_B-3zuJHDrM24S9w3sbb8Io_CHhD7RpFJ4Ign4TL9h_JKZ1XXV6_DsTXFDOlYQB8PiK78v1a-iUpwKcxikuaOP-WC-xUEfg_wL_wlbbef_tKEVjQ1oQoiqjDC6g3o-YxPQ2UtAGsqJTHdt04JCw2Jep9UO3TxjaHoXUKHq1i1LYDqH8vZdCMlOEXy6top4U4rMxktpBVEi_gWX4i3XYOu0LK7Mz1Ok6S2GGXmMfr"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">Admin User</p>
                <p className="text-[10px] text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="lg:ml-64 pt-20 pb-28 px-4 md:px-8 flex-1">
        {children}
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_-12px_40px_rgba(0,0,0,0.05)] lg:hidden z-50 rounded-t-[2rem]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center px-3 py-2 tap-highlight-transparent scale-90 active:scale-100 transition-transform ${isActive("/dashboard") ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl" : "text-slate-400 dark:text-slate-500"
            }`}
        >
          <LayoutDashboard className={`w-6 h-6 ${isActive("/dashboard") ? "fill-blue-700/20" : ""}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Dashboard</span>
        </Link>
        <Link
          href="/dashboard/customers"
          className={`flex flex-col items-center justify-center px-3 py-2 tap-highlight-transparent scale-90 active:scale-100 transition-transform ${isActive("/dashboard/customers") ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl" : "text-slate-400 dark:text-slate-500"
            }`}
        >
          <Users className={`w-6 h-6 ${isActive("/dashboard/customers") ? "fill-blue-700/20" : ""}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Clientes</span>
        </Link>
        <Link
          href="/dashboard/deliveries"
          className={`flex flex-col items-center justify-center px-3 py-2 tap-highlight-transparent scale-90 active:scale-100 transition-transform ${isActive("/dashboard/deliveries") ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl" : "text-slate-400 dark:text-slate-500"
            }`}
        >
          <Truck className={`w-6 h-6 ${isActive("/dashboard/deliveries") ? "fill-blue-700/20" : ""}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Entregas</span>
        </Link>
        <Link
          href="/dashboard/payments"
          className={`flex flex-col items-center justify-center px-3 py-2 tap-highlight-transparent scale-90 active:scale-100 transition-transform ${isActive("/dashboard/payments") ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl" : "text-slate-400 dark:text-slate-500"
            }`}
        >
          <Banknote className={`w-6 h-6 ${isActive("/dashboard/payments") ? "fill-blue-700/20" : ""}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Cobros</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-3 py-2 tap-highlight-transparent scale-90 active:scale-100 transition-transform"
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1">Inventario</span>
        </Link>
      </nav>

      {/* FAB (Mobile only, hidden on desktop) */}
      <button
        onClick={() => console.log("Agregar Cliente o Acción Principal Clicada")}
        className="lg:hidden fixed bottom-24 right-6 signature-gradient h-16 w-16 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 z-40 active:scale-95 transition-transform"
        aria-label="Agregar"
      >
        <UserPlus className="w-7 h-7" />
      </button>
    </div>
  );
}
