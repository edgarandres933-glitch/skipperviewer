import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, LogIn, ShieldCheck, Sparkles, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const { login } = useAuth();
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameInput.trim()) {
      setErrorMessage("Por favor ingresa tu usuario.");
      triggerShake();
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage("Por favor ingresa tu contraseña.");
      triggerShake();
      return;
    }

    setIsLoading(true);

    // Pequeño retardo para dar sensación de validación segura y profesional
    await new Promise((resolve) => setTimeout(resolve, 450));

    const success = login(usernameInput, passwordInput, rememberMe);

    if (success) {
      toast.success("¡Bienvenido a Skipper View!", {
        description: `Sesión iniciada correctamente como ${usernameInput.trim()}`,
      });
    } else {
      setIsLoading(false);
      setErrorMessage("Usuario o contraseña incorrectos. Verifica tus credenciales.");
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 selection:bg-primary/30 selection:text-white">
      {/* Fondo con efectos de iluminación ambiental y cuadrícula sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -top-40 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Tarjeta de Login Principal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl transition-all sm:p-10",
          shake && "animate-shake",
        )}
      >
        {/* Encabezado con Logo y Marca */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="group relative mb-4 flex size-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-primary/20 ring-1 ring-white/20 transition-transform hover:scale-105">
            <img
              src="/skipper-logo.png"
              alt="Skipper View"
              className="size-full object-contain"
            />
            <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur group-hover:opacity-40 transition-opacity" />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Skipper View
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Suite Comercial & Analítica de Alto Rendimiento
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-400">
            <ShieldCheck className="size-3.5 text-blue-400" />
            <span>Acceso Seguro y Privado</span>
          </div>
        </div>

        {/* Mensaje de Error con animación */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="flex-1 leading-relaxed font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Usuario */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300">
              Usuario de acceso
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="size-4" />
              </div>
              <input
                type="text"
                autoComplete="username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ingresa tu usuario"
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-950/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="size-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ingresa tu contraseña"
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/60 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:bg-slate-950/90 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Opciones adicionales: Recordarme */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
              />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Panel Administrativo
            </span>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Autenticando...</span>
              </div>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <LogIn className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Pie de tarjeta con insignia de seguridad */}
        <div className="mt-8 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Skipper View © 2026 · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
