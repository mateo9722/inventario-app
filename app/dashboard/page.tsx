import { Droplets } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-hydro-surface flex flex-col items-center justify-center gap-4 font-[var(--font-inter)]">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hydro-primary-fixed">
        <Droplets className="w-8 h-8 text-hydro-primary" />
      </div>
      <h1 className="font-[var(--font-manrope)] font-bold text-2xl text-hydro-on-surface">
        ¡Bienvenido al Dashboard!
      </h1>
      <p className="text-hydro-on-surface-variant text-sm">
        Has iniciado sesión correctamente.
      </p>
    </div>
  );
}
