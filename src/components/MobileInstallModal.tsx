import { useState, useEffect } from "react";
import {
  Smartphone,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Apple,
  Share,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function MobileInstallModal({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [platform, setPlatform] = useState<"android" | "ios">("android");
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const localUrl = "http://192.168.100.40:8080/";

  useEffect(() => {
    // Detectar si ya está en modo app independiente
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error navigator standalone for iOS
      window.navigator.standalone === true
    ) {
      setIsStandalone(true);
    }

    // Detectar plataforma del dispositivo actual
    const userAgent = navigator.userAgent || navigator.vendor;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream) {
      setPlatform("ios");
    } else {
      setPlatform("android");
    }

    // Manejar evento de instalación PWA en navegadores compatibles (Android / Chromium)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(localUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar automáticamente");
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      toast.info("Abre el menú de opciones de tu navegador y selecciona 'Instalar aplicación'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("¡Instalando Skipper View en tu dispositivo!");
      setOpen(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-border/80 bg-background/95 p-6 backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone className="size-4" />
            </span>
            <DialogTitle className="text-xl font-bold font-display text-foreground">
              Instalar Skipper View en tu Celular
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Lleva el panel de control a tu smartphone como una aplicación independiente con acceso directo y pantalla completa.
          </DialogDescription>
        </DialogHeader>

        {isStandalone && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            <span>¡Ya estás ejecutando Skipper View en modo aplicación independiente!</span>
          </div>
        )}

        {/* QR Code and Local URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="relative group rounded-xl bg-white p-2.5 shadow-md">
              <img
                src="/qr-code.png"
                alt="Código QR para instalar Skipper View"
                className="size-36 rounded-lg object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[11px] font-semibold text-white px-2 py-1 bg-black/40 rounded">
                  Escanear con cámara
                </span>
              </div>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              Escanea con la cámara de tu celular
            </p>
          </div>

          <div className="flex flex-col justify-between gap-3 text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Dirección en Red Wi-Fi
              </p>
              <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono font-medium text-foreground break-all">
                <span>{localUrl}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                (Tu celular debe estar conectado al mismo Wi-Fi que esta PC)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="w-full justify-center gap-2 h-8 text-xs font-medium"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copied ? "Enlace copiado" : "Copiar Enlace"}
              </Button>

              {deferredPrompt && (
                <Button
                  size="sm"
                  onClick={handleInstallPwa}
                  className="w-full justify-center gap-2 h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow"
                >
                  <Download className="size-3.5" />
                  Instalar en este Dispositivo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex rounded-lg bg-muted/40 p-1 border border-border/40">
          <button
            onClick={() => setPlatform("android")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              platform === "android"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="size-3.5" />
            Android (Google Chrome / Edge)
          </button>
          <button
            onClick={() => setPlatform("ios")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
              platform === "ios"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Apple className="size-3.5" />
            iPhone / iPad (Safari)
          </button>
        </div>

        {/* Step-by-step instructions */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          {platform === "android" ? (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span>📱 Pasos para Android</span>
              </h4>
              <ol className="space-y-2 text-xs text-foreground/90 pl-1 list-none">
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    1
                  </span>
                  <span>
                    Abre <strong>Google Chrome</strong> en tu celular y entra a: <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-primary">{localUrl}</code> o escanea el QR.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    2
                  </span>
                  <span>
                    Aparecerá un mensaje automático: <strong>"Instalar Skipper View"</strong> o <strong>"Agregar a la pantalla principal"</strong>. Toca <strong>Instalar</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    3
                  </span>
                  <span>
                    <em>(Si no aparece el aviso)</em>: Toca los tres puntos <code className="rounded bg-muted px-1 font-bold">⋮</code> de Chrome arriba a la derecha y pulsa <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span>🍎 Pasos para iPhone / iPad</span>
              </h4>
              <ol className="space-y-2 text-xs text-foreground/90 pl-1 list-none">
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    1
                  </span>
                  <span>
                    Abre el navegador <strong>Safari</strong> en tu iPhone y entra a <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-primary">{localUrl}</code>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    2
                  </span>
                  <span>
                    Toca el botón <strong>Compartir</strong> <Share className="inline size-3.5 mx-0.5 text-primary" /> (el cuadrado con la flecha hacia arriba en la barra inferior de Safari).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    3
                  </span>
                  <span>
                    Desplázate hacia abajo y selecciona <strong>"Agregar a inicio"</strong> (Add to Home Screen), luego pulsa <strong>Agregar</strong>.
                  </span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Downloadable Package Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="text-left w-full sm:w-auto">
            <p className="text-xs font-semibold text-foreground">Archivos de instalación directa</p>
            <p className="text-[11px] text-muted-foreground">
              Guarda el paquete en tu celular o PC
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {platform === "ios" ? (
              <a
                href="/skipper-view.mobileconfig"
                download="skipper-view.mobileconfig"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Apple className="size-3.5 text-muted-foreground" />
                Perfil iOS (.mobileconfig)
              </a>
            ) : null}

            <a
              href="/SkipperView-Mobile-Instalador.zip"
              download="SkipperView-Mobile-Instalador.zip"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="size-3.5" />
              Descargar Paquete (.zip)
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
