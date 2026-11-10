// Banner visual que aparece cuando una fuente de datos de la subcuenta
// no pudo cargarse (ej. oportunidades no disponibles), en lugar de dejar
// la sección vacía sin explicación.

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";

import { useSourceStatusQuery, GHL_QUERY_KEYS } from "@/lib/ghl-hooks";
import { refreshGhlData } from "@/lib/ghl.functions";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  contacts: "Contactos",
  opportunities: "Oportunidades",
  users: "Asesores (usuarios)",
  pipelines: "Pipelines",
};

export function DataSourceBanner({ sources }: { sources: string[] }) {
  const { data } = useSourceStatusQuery();
  const failed = (data?.failedSources ?? []).filter((s) => sources.includes(s));
  if (failed.length === 0) return null;

  const labels = failed.map((s) => SOURCE_LABELS[s] ?? s);

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-xl border p-4",
        "border-amber-500/30 bg-amber-500/10",
      )}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-foreground">
          Modo Demostración Activo (Datos de Prueba)
        </p>
        <p className="mt-0.5 text-muted-foreground">
          No se detectó la variable <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">GHL_PRIVATE_TOKEN</code>. Mostrando datos simulados para visualizar la plataforma. Para conectar tu cuenta real en vivo, agrega tu clave en un archivo <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">.env</code>.
        </p>
      </div>
      <RetryButton />
    </div>
  );
}

function RetryButton() {
  const refreshFn = useServerFn(refreshGhlData);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRetry() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshFn();
      await queryClient.invalidateQueries({ queryKey: ["ghl"] });
      toast.success("Reintentando carga de datos...");
    } catch {
      toast.error("No se pudieron actualizar los datos. Intenta de nuevo.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={refreshing}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/25 disabled:opacity-60"
    >
      <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
      Reintentar
    </button>
  );
}
