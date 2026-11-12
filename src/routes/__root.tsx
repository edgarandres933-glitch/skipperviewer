import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Users,
  Settings,
  Search,
  Bell,
  Menu,
  ChevronsLeft,
  Sparkles,
  UsersRound,
  CalendarRange,
  Check,
  ChevronDown,
  Headset,
  RefreshCw,
  Database,
  Layers,
  Smartphone,
  LogOut,
} from "lucide-react";

import appCss from "../styles.css?url";
import { reportVibeError } from "../lib/vibe-error-reporting";
import { cn } from "../lib/utils";
import { DateRangeProvider, PRESETS, useDateRange, type DateRangePreset } from "../lib/date-range";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DateRange as RdpRange } from "react-day-picker";
import { es } from "date-fns/locale";
import { refreshGhlData } from "@/lib/ghl.functions";
import { MobileInstallModal } from "@/components/MobileInstallModal";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LoginScreen } from "@/components/LoginScreen";

const navItems = [
  { to: "/", label: "Panel", icon: LayoutDashboard, exact: true },
  { to: "/consolidados", label: "Consolidados", icon: Layers },
  { to: "/analytics", label: "Analíticas", icon: BarChart3 },
  { to: "/crm", label: "CRM", icon: Database },
  { to: "/leads", label: "Leads", icon: UsersRound },
  { to: "/advisors", label: "Asesores", icon: Headset },
  { to: "/orders", label: "Pedidos", icon: ShoppingCart },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o se ha movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportVibeError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página no cargó
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal de nuestro lado. Puedes intentar recargar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { title: "Skipper View — Panel de administración" },
      {
        name: "description",
        content:
          "Panel de administración Skipper View: analíticas, pedidos e información comercial en un solo lugar.",
      },
      { name: "author", content: "Skipper View" },
      { name: "theme-color", content: "#0f172a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Skipper View" },
      { property: "og:title", content: "Skipper View — Panel de administración" },
      {
        property: "og:description",
        content: "Analíticas, consolidados de cursos e información comercial en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function initLoginFormListener() {
    var form = document.querySelector('form');
    if (!form || form.__auth_bound) return;
    form.__auth_bound = true;

    form.addEventListener('submit', function(e) {
      if (window.__skipper_react_ready) return;

      e.preventDefault();
      var userInput = form.querySelector('input[type="text"]');
      var passInput = form.querySelector('input[type="password"]');
      var user = userInput ? userInput.value.trim() : '';
      var pass = passInput ? passInput.value.trim() : '';

      var VALID_USER = 'adminSCviewer';
      var VALID_PASS = 'SkipC@P@.%!1.';

      if (user === VALID_USER && pass === VALID_PASS) {
        localStorage.setItem('skipperview_auth_token', 'authenticated_session_active');
        localStorage.setItem('skipperview_auth_user', user);
        window.location.href = '/';
      } else {
        alert('Usuario o contraseña incorrectos. Verifica tus credenciales.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginFormListener);
  } else {
    initLoginFormListener();
  }
})();
`,
          }}
        />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isLocal) {
        // En entorno local de desarrollo, desregistrar cualquier Service Worker previo
        // para evitar secuestro de rutas o retornos del panel en caché
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
        return;
      }

      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registrado con éxito:", reg.scope);
        })
        .catch((err) => {
          console.warn("Error al registrar Service Worker:", err);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <DateRangeProvider>
      <TooltipProvider delayDuration={150}>
        <div className="flex min-h-screen bg-background text-foreground">
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar lg:flex transition-[width] duration-200",
              collapsed ? "w-[72px]" : "w-64",
            )}
          >
            <SidebarBrand collapsed={collapsed} />
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
              {navItems.map((item) => (
                <SidebarLink key={item.to} {...item} collapsed={collapsed} />
              ))}
            </nav>
            <SidebarUpgradeCard collapsed={collapsed} />
            <SidebarFooter collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
          </aside>

          {/* Mobile sidebar */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
                <SidebarBrand collapsed={false} onClose={() => setMobileOpen(false)} />
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
                  {navItems.map((item) => (
                    <SidebarLink
                      key={item.to}
                      {...item}
                      collapsed={false}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>
                <SidebarUpgradeCard collapsed={false} />
                <SidebarFooter collapsed={false} onToggleCollapse={() => setMobileOpen(false)} />
              </aside>
            </div>
          )}

          {/* Main */}
          <div
            className={cn(
              "flex min-h-screen flex-1 flex-col transition-[padding] duration-200",
              collapsed ? "lg:pl-[72px]" : "lg:pl-64",
            )}
          >
            <Topbar onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
        </div>
      </TooltipProvider>
    </DateRangeProvider>
  );
}

function SidebarFooter({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { logout } = useAuth();

  return (
    <div className="border-t border-sidebar-border p-2 space-y-1">
      <button
        onClick={() => {
          logout();
          toast.info("Has cerrado sesión.");
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400",
          collapsed && "justify-center px-0",
        )}
        title="Cerrar sesión"
      >
        <LogOut className="size-4 shrink-0" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>

      <button
        onClick={onToggleCollapse}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent"
      >
        <ChevronsLeft
          className={cn("size-4 transition-transform", collapsed && "rotate-180")}
        />
        {!collapsed && <span>Contraer</span>}
      </button>
    </div>
  );
}

function SidebarBrand({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-border/50">
        <img
          src="/skipper-logo.png"
          alt="Skipper View"
          className="size-full object-contain"
        />
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold leading-none text-sidebar-foreground truncate tracking-tight">
              Skipper View
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground truncate">
              Suite Comercial & Analítica
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  exact,
  collapsed,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
      activeOptions={exact ? { exact: true } : undefined}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      title={collapsed ? label : undefined}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SidebarUpgradeCard({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <div className="m-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 via-sidebar-accent to-accent/10 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Smartphone className="size-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-sidebar-foreground">App Móvil Lista</p>
          <span className="text-[10px] text-primary font-semibold">Android & iOS</span>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
        Instala Skipper View en tu smartphone para acceder directo y en pantalla completa.
      </p>
      <MobileInstallModal>
        <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Smartphone className="size-3.5" />
          <span>Instalar en Celular</span>
        </button>
      </MobileInstallModal>
    </div>
  );
}

function RefreshButton() {
  const refreshFn = useServerFn(refreshGhlData);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshFn();
      // Invalida todas las queries de la subcuenta para que se vuelvan a pedir
      await queryClient.invalidateQueries({ queryKey: ["ghl"] });
      await router.invalidate();
      toast.success("Datos actualizados desde tu subcuenta.");
    } catch {
      toast.error("No se pudieron actualizar los datos. Intenta de nuevo.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
      title="Actualizar datos desde la subcuenta"
    >
      <RefreshCw className={cn("size-4 text-primary", refreshing && "animate-spin")} />
      <span className="hidden md:inline">{refreshing ? "Actualizando..." : "Actualizar"}</span>
    </button>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { username, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        onClick={onMenuClick}
        className="text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm ring-1 ring-border/50">
          <img
            src="/skipper-logo.png"
            alt="Skipper View"
            className="size-full object-contain"
          />
        </div>
        <span className="font-display text-sm font-bold text-foreground">
          Skipper View
        </span>
      </div>
      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar cualquier cosa..."
          className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <MobileInstallModal>
          <button
            className="flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            title="Instalar Skipper View en tu Celular"
          >
            <Smartphone className="size-3.5" />
            <span className="hidden sm:inline">App Móvil</span>
          </button>
        </MobileInstallModal>
        <RefreshButton />
        <DateRangePicker />
        <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-accent ring-2 ring-background" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-inner">
            AS
          </div>
          <div className="hidden pr-1 text-left sm:block">
            <p className="text-xs font-semibold leading-none text-foreground">{username || "adminSCviewer"}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">Administrador</p>
          </div>
          <button
            onClick={() => {
              logout();
              toast.info("Has cerrado sesión en Skipper View.");
            }}
            className="ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400"
            title="Cerrar sesión"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function DateRangePicker() {
  const { range, setRange, setCustomRange } = useDateRange();
  const [open, setOpen] = useState(false);
  // Estado temporal del intervalo personalizado mientras el usuario lo arma.
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  function resetCustom() {
    setCustomStart(undefined);
    setCustomEnd(undefined);
  }

  function applyCustom() {
    // Permitir aplicar incluso si solo hay fecha inicial (rango de un día)
    const start = customStart;
    const end = customEnd ?? customStart;
    if (!start) return;
    setCustomRange(start.toISOString().slice(0, 10), end!.toISOString().slice(0, 10));
    resetCustom();
    setOpen(false);
  }

  // Intervalo seleccionado en el calendario (react-day-picker usa `from`/`to`).
  const selectedRange: RdpRange | undefined =
    customStart && customEnd
      ? { from: customStart, to: customEnd }
      : customStart
        ? { from: customStart }
        : undefined;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <CalendarRange className="size-4 text-primary" />
        <span className="hidden sm:inline">{range.label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          {/* capa para cerrar al hacer clic fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-[min(92vw,22rem)] rounded-xl border border-border bg-popover p-3 shadow-xl">
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Intervalos rápidos
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setRange(p.value as DateRangePreset);
                    resetCustom();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent",
                    range.preset === p.value && "bg-accent font-semibold",
                  )}
                >
                  <span>{p.label}</span>
                  {range.preset === p.value && <Check className="size-4 text-primary" />}
                </button>
              ))}
            </div>

            <div className="my-3 border-t border-border" />

            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Intervalo personalizado
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                locale={es}
                selected={selectedRange}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
                onSelect={(sel: RdpRange | undefined) => {
                  if (!sel) {
                    resetCustom();
                    return;
                  }
                  setCustomStart(sel.from);
                  setCustomEnd(sel.to ?? sel.from);
                }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 px-1 text-xs">
              <span className="text-muted-foreground">
                {customStart ? customStart.toLocaleDateString("es-ES") : "Fecha inicial"}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">
                {(customEnd ?? customStart)
                  ? (customEnd ?? customStart)!.toLocaleDateString("es-ES")
                  : "Fecha final"}
              </span>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetCustom}>
                Limpiar
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!customStart}>
                Aplicar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
