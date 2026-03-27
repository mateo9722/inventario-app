"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Droplets,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // ─── Estado del formulario ─────────────────────────────────
  // Guardamos el valor de cada campo y el estado de la UI
  const [identifier, setIdentifier] = useState("");   // usuario o teléfono
  const [password, setPassword] = useState("");        // contraseña
  const [showPassword, setShowPassword] = useState(false); // mostrar/ocultar clave
  const [error, setError] = useState("");              // mensaje de error
  const [isLoading, setIsLoading] = useState(false);   // estado de carga

  // ─── Manejar envío del formulario ─────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // evitar que el navegador recargue la página
    setError("");       // limpiar errores anteriores

    // 1. Validación: campos vacíos
    if (!identifier.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    // 2. Simular carga (como si fuera una petición al servidor)
    setIsLoading(true);

    // Pequeño delay para simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 3. Verificar credenciales (hardcoded por ahora)
    if (identifier === "admin" && password === "1234") {
      // Login exitoso → redirigir al dashboard
      router.push("/dashboard");
    } else {
      // Credenciales incorrectas → mostrar error
      setError("Usuario o contraseña incorrectos. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-hydro-surface to-hydro-primary-fixed relative overflow-hidden font-[var(--font-inter)]">
      {/* Background Decorative Blurs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-hydro-primary-fixed/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-hydro-secondary-container/20 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-md">
        {/* Brand Identity */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hydro-primary-fixed mb-4">
            <Droplets className="w-8 h-8 text-hydro-primary" />
          </div>
          <h1 className="font-[var(--font-manrope)] font-black text-3xl text-hydro-primary italic tracking-tight">
            AquaControl Admin
          </h1>
          <p className="text-hydro-on-surface-variant text-sm mt-2 tracking-widest uppercase font-medium">
            Gestión de Distribución
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-hydro-surface-container-lowest/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_12px_40px_rgba(0,91,178,0.08)] border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>

            {/* ─── Mensaje de error ─────────────────────────── */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-hydro-error/10 text-hydro-error text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Phone/Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="font-[var(--font-manrope)] font-bold text-sm text-hydro-on-surface ml-1 block"
              >
                Usuario o Teléfono
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-hydro-outline group-focus-within:text-hydro-primary transition-colors" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ej: 555-0123 o juan.perez"
                  className="block w-full pl-12 pr-4 py-4 bg-hydro-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-hydro-primary/20 focus:bg-hydro-surface-container-lowest transition-all placeholder:text-hydro-outline text-hydro-on-surface outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="font-[var(--font-manrope)] font-bold text-sm text-hydro-on-surface block"
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-hydro-primary hover:text-hydro-primary-container transition-colors"
                >
                  ¿Olvidaste la clave?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-hydro-outline group-focus-within:text-hydro-primary transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-4 bg-hydro-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-hydro-primary/20 focus:bg-hydro-surface-container-lowest transition-all placeholder:text-hydro-outline text-hydro-on-surface outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-hydro-outline hover:text-hydro-on-surface-variant transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                id="remember"
                className="border-hydro-outline-variant data-[state=checked]:bg-hydro-primary data-[state=checked]:border-hydro-primary cursor-pointer"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium text-hydro-on-surface-variant cursor-pointer select-none"
              >
                Recordar mi sesión
              </Label>
            </div>

            {/* Action Button — muestra spinner cuando está cargando */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-hydro-primary to-hydro-primary-container text-hydro-on-primary font-[var(--font-manrope)] font-bold text-lg py-4 px-8 rounded-xl shadow-lg shadow-hydro-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-hydro-surface-container-high text-center">
            <p className="text-hydro-on-surface-variant text-sm">
              ¿No tienes acceso?{" "}
              <a
                href="#"
                className="text-hydro-primary font-bold hover:underline"
              >
                Contacta al Administrador
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
