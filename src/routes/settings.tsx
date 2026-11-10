import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Database,
  BookOpen,
  Clock,
  Wallet,
  Megaphone,
  CalendarDays,
  UserCog,
  CheckCircle2,
  Laptop,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Copy,
  Building2,
  Bell,
  CreditCard,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Card } from "@/components/dashboard";
import {
  useFieldMappingsQuery,
  useCustomFieldsQuery,
  useSaveFieldMappingsMutation,
} from "@/lib/field-mapping-hooks";
import {
  useSecretTokenStatusQuery,
  useTestSecretTokenMutation,
  useSaveSecretTokenMutation,
} from "@/lib/secret-token-hooks";
import {
  MAPPING_KEYS,
  FIELD_LABELS,
  FIELD_HINTS,
  AUTO_VALUE,
  type FieldMapping,
  type SemanticFieldKey,
} from "@/lib/field-mapping";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — Skipper View" },
      {
        name: "description",
        content: "Mapea campos personalizados y gestiona el espacio de trabajo.",
      },
      { property: "og:title", content: "Ajustes — Skipper View" },
      {
        property: "og:description",
        content: "Mapea campos personalizados y gestiona el espacio de trabajo.",
      },
    ],
  }),
  component: SettingsPage,
});

const FIELD_ICONS: Record<SemanticFieldKey, React.ComponentType<{ className?: string }>> = {
  course: BookOpen,
  modality: Laptop,
  schedule: Clock,
  deposit: Wallet,
  total: Wallet,
  campaign: Megaphone,
  saleDate: CalendarDays,
  owner: UserCog,
};

type SettingsTab = "secreto" | "mapeo" | "espacio" | "notificaciones" | "facturacion";

function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("secreto");

  return (
    <div>
      <PageHeader
        title="Ajustes y Configuración"
        subtitle="Gestiona el Identificador Secreto de la subcuenta, mapeo de campos y espacio de trabajo."
      />

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {[
          { id: "secreto", label: "Identificador Secreto", icon: KeyRound },
          { id: "mapeo", label: "Mapeo de campos", icon: Database },
          { id: "espacio", label: "Espacio de trabajo", icon: Building2 },
          { id: "notificaciones", label: "Notificaciones", icon: Bell },
          { id: "facturacion", label: "Facturación", icon: CreditCard },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as SettingsTab)}
              className={
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all " +
                (isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")
              }
            >
              <Icon className="size-4 shrink-0" />
              <span>{t.label}</span>
              {t.id === "secreto" && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px] font-semibold">
                  API
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "secreto" && <SecretTokenSection />}
      {tab === "mapeo" && <FieldMappingSection />}
      {tab === "espacio" && <WorkspaceSection />}
      {tab === "notificaciones" && <NotificationsSection />}
      {tab === "facturacion" && <BillingSection />}
    </div>
  );
}

function SecretTokenSection() {
  const { data: status, isPending: statusPending, refetch } = useSecretTokenStatusQuery();
  const testMutation = useTestSecretTokenMutation();
  const saveMutation = useSaveSecretTokenMutation();

  const [tokenInput, setTokenInput] = useState("");
  const [locationIdInput, setLocationIdInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; usersCount?: number } | null>(null);

  useEffect(() => {
    if (status) {
      if (!tokenInput && status.rawToken) {
        setTokenInput(status.rawToken);
      }
      if (!locationIdInput && status.locationId) {
        setLocationIdInput(status.locationId);
      }
    }
  }, [status]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        toast.info("Token pegado desde el portapapeles.");
      }
    } catch {
      toast.error("No se pudo acceder al portapapeles. Pégalo manualmente con Ctrl+V.");
    }
  };

  const handleTest = () => {
    const clean = tokenInput.trim();
    if (!clean) {
      toast.error("Debes ingresar un Identificador Secreto para probar.");
      return;
    }
    setTestResult(null);
    const loc = locationIdInput.trim();
    testMutation.mutate(
      { token: clean, ...(loc ? { locationId: loc } : {}) },
      {
        onSuccess: (res) => {
          setTestResult(res);
          if (res.ok) {
            toast.success(res.message);
          } else {
            toast.error(res.message);
          }
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Error al conectar con la API.";
          setTestResult({ ok: false, message: msg });
          toast.error(msg);
        },
      }
    );
  };

  const handleSave = () => {
    const clean = tokenInput.trim();
    if (!clean) {
      toast.error("El Identificador Secreto no puede estar vacío.");
      return;
    }
    const loc = locationIdInput.trim();
    saveMutation.mutate(
      { token: clean, ...(loc ? { locationId: loc } : {}) },
      {
        onSuccess: (res) => {
          setTestResult(res);
          if (res.ok) {
            toast.success(res.message);
            refetch();
          } else {
            toast.error(res.message);
          }
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Error al guardar el Identificador Secreto.";
          toast.error(msg);
        },
      }
    );
  };

  const isLive = status?.configured && status?.isLive;

  return (
    <div className="space-y-6">
      {/* Banner de estado de conexión */}
      <div
        className={
          "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4.5 transition-all " +
          (statusPending
            ? "border-border bg-card"
            : isLive
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300")
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={
              "flex size-10 shrink-0 items-center justify-center rounded-lg " +
              (statusPending
                ? "bg-muted text-muted-foreground"
                : isLive
                  ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                  : "bg-amber-500/20 text-amber-400")
            }
          >
            {statusPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isLive ? (
              <ShieldCheck className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">
                {statusPending
                  ? "Verificando credenciales..."
                  : isLive
                    ? "Subcuenta de GoHighLevel Conectada y Operativa"
                    : "Identificador Secreto Pendiente o Desconectado"}
              </p>
              {!statusPending && (
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                    (isLive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300")
                  }
                >
                  <span
                    className={
                      "size-1.5 rounded-full " +
                      (isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400")
                    }
                  />
                  {isLive ? "Activo" : "Requiere Acción"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {status?.configured
                ? `Token configurado: ${status.maskedToken} · Subcuenta: ${status.locationId}`
                : "Ingresa tu Token de Integración Privada (PIT) para sincronizar contactos, oportunidades y ventas."}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={statusPending}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={"size-3.5 " + (statusPending ? "animate-spin" : "")} />
          Recomprobar
        </Button>
      </div>

      {/* Formulario de credenciales */}
      <Card
        title="Configuración del Identificador Secreto (PIT)"
        subtitle="Ingresa el Token de Integración Privada de LeadConnector / GoHighLevel para dar acceso a la suite."
      >
        <div className="space-y-5">
          {/* Campo Identificador Secreto */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="secretToken" className="text-sm font-semibold text-foreground">
                Identificador Secreto (Private Integration Token)
              </Label>
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Copy className="size-3" /> Pegar portapapeles
              </button>
            </div>

            <div className="relative mt-2">
              <Input
                id="secretToken"
                type={showToken ? "text" : "password"}
                placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="pr-10 font-mono text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                title={showToken ? "Ocultar token" : "Mostrar token"}
              >
                {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              El identificador secreto suele comenzar con el prefijo{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-primary">pit-</code>. Permite
              consultar contactos, oportunidades y asesores en tiempo real de forma segura.
            </p>
          </div>

          {/* Campo Location ID */}
          <div>
            <Label htmlFor="locationId" className="text-sm font-semibold text-foreground">
              ID de Ubicación / Subcuenta (Location ID)
            </Label>
            <Input
              id="locationId"
              type="text"
              placeholder="OfPmk79SLGEKgbhdmS9U"
              value={locationIdInput}
              onChange={(e) => setLocationIdInput(e.target.value)}
              className="mt-2 font-mono text-xs sm:text-sm"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              El identificador único de la subcuenta en GoHighLevel donde se encuentran los leads y
              oportunidades.
            </p>
          </div>

          {/* Mensaje de resultado de prueba si existe */}
          {testResult && (
            <div
              className={
                "flex items-start gap-3 rounded-lg border p-3.5 text-xs " +
                (testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive")
              }
            >
              {testResult.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {testResult.ok ? "Verificación Exitosa" : "Fallo de Verificación"}
                </p>
                <p className="mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Al guardar, se actualizará el archivo <code className="text-foreground">.env</code> y se
              recargará la información comercial al instante.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testMutation.isPending || saveMutation.isPending}
                className="gap-2"
              >
                {testMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Probar Conexión
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={testMutation.isPending || saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Guardar y Aplicar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Guía instructiva paso a paso */}
      <Card
        title="¿Cómo obtener tu Identificador Secreto en GoHighLevel?"
        subtitle="Sigue estos pasos dentro de tu cuenta de LeadConnector o GoHighLevel."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              1
            </div>
            <h4 className="mt-2.5 font-semibold text-foreground text-sm">
              Accede a Ajustes
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Entra a tu subcuenta y dirígete al menú inferior izquierdo en{" "}
              <strong className="text-foreground">Settings (Ajustes)</strong>.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              2
            </div>
            <h4 className="mt-2.5 font-semibold text-foreground text-sm">
              Integraciones Privadas
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Busca el apartado <strong className="text-foreground">Developers (Desarrolladores)</strong> o{" "}
              <strong className="text-foreground">Private Integrations</strong> y crea una clave privada.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card/60 p-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              3
            </div>
            <h4 className="mt-2.5 font-semibold text-foreground text-sm">
              Copia el Token (PIT)
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Copia el token que inicia con <code className="text-primary">pit-</code>, pégalo en el campo superior y presiona{" "}
              <strong className="text-foreground">Guardar y Aplicar</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FieldMappingSection() {
  const { data: savedMapping } = useFieldMappingsQuery();
  const { data: customFields, isPending: fieldsPending } = useCustomFieldsQuery();
  const saveMutation = useSaveFieldMappingsMutation();

  const [draft, setDraft] = useState<FieldMapping | null>(null);

  useEffect(() => {
    if (savedMapping && !draft) setDraft(savedMapping);
  }, [savedMapping, draft]);

  if (!draft) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando configuración...
      </div>
    );
  }

  const setField = (key: SemanticFieldKey, value: string) => {
    setDraft((d) => ({ ...d!, [key]: value === AUTO_VALUE ? "" : value }));
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(savedMapping);

  const handleSave = () => {
    saveMutation.mutate(draft, {
      onSuccess: () => toast.success("Mapeo de campos guardado. Datos actualizados."),
      onError: () => toast.error("No se pudo guardar el mapeo."),
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Mapeo de campos personalizados"
        subtitle="Asocia cada dato del dashboard a un campo de tu subcuenta. En «Automático» se infiere por nombre."
      >
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Database className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Estos campos alimentan las secciones de{" "}
            <strong className="text-foreground">Clientes</strong>,{" "}
            <strong className="text-foreground">Pedidos</strong> y{" "}
            <strong className="text-foreground">Asesores</strong>. Al guardar, se recargan los datos
            con la nueva configuración.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MAPPING_KEYS.map((key) => {
            const Icon = FIELD_ICONS[key];
            const currentVal = draft[key] || AUTO_VALUE;
            return (
              <div key={key} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label className="text-sm font-semibold text-foreground">
                      {FIELD_LABELS[key]}
                    </Label>
                    <p className="text-xs text-muted-foreground">{FIELD_HINTS[key]}</p>
                  </div>
                </div>
                <Select value={currentVal} onValueChange={(v) => setField(key, v)}>
                  <SelectTrigger className="mt-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_VALUE}>Automático (inferir por nombre)</SelectItem>
                    {fieldsPending ? (
                      <SelectItem value={AUTO_VALUE} disabled>
                        Cargando campos...
                      </SelectItem>
                    ) : (
                      (customFields ?? []).map((f) => (
                        <SelectItem key={f.id} value={f.name}>
                          {f.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {dirty ? (
              <>
                <span className="size-2 rounded-full bg-warning" /> Cambios sin guardar
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-success" /> Todo guardado
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!dirty || saveMutation.isPending}
              onClick={() => setDraft(savedMapping ? { ...savedMapping } : draft)}
            >
              Descartar
            </Button>
            <Button size="sm" disabled={!dirty || saveMutation.isPending} onClick={handleSave}>
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar mapeo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function WorkspaceSection() {
  return (
    <Card title="Espacio de trabajo" subtitle="Datos de la organización">
      <div className="space-y-4">
        <div>
          <Label htmlFor="org">Nombre de la organización</Label>
          <Input id="org" defaultValue="Skipper View" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="domain">Dominio del espacio</Label>
          <Input id="domain" defaultValue="skipperview.app" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="tz">Zona horaria</Label>
          <Input id="tz" defaultValue="UTC−05:00 (Este)" className="mt-1.5" />
        </div>
        <Button size="sm">Guardar cambios</Button>
      </div>
    </Card>
  );
}

function NotificationsSection() {
  return (
    <Card title="Notificaciones" subtitle="Elige sobre qué quieres recibir avisos">
      <div className="space-y-4">
        {[
          { label: "Pedidos nuevos", desc: "Recibe un aviso cuando se haga un pedido." },
          { label: "Pagos", desc: "Resumen semanal de pagos." },
          { label: "Registros de clientes", desc: "Cuando un nuevo cliente se registra." },
          { label: "Alertas de seguridad", desc: "Actividad sospechosa en tu cuenta." },
        ].map((n, i) => (
          <div key={n.label} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch defaultChecked={i < 2} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function BillingSection() {
  return (
    <Card title="Facturación" subtitle="Plan y uso">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Plan Pro · $49/mes</p>
          <p className="text-xs text-muted-foreground">
            Se renueva el 21 oct 2026 · 12 de 25 puestos usados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Gestionar puestos
          </Button>
          <Button size="sm">Mejorar plan</Button>
        </div>
      </div>
    </Card>
  );
}
