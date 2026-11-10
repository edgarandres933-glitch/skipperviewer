import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Loader2,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/dashboard";
import { DataSourceBanner } from "@/components/data-source-banner";
import type { OrderStatus } from "@/lib/dashboard-data";
import { useOrdersQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Pedidos — Skipper View" },
      { name: "description", content: "Explora, filtra y gestiona los pedidos de clientes." },
      { property: "og:title", content: "Pedidos — Skipper View" },
      {
        property: "og:description",
        content: "Explora, filtra y gestiona los pedidos de clientes.",
      },
    ],
  }),
  component: OrdersPage,
});

const statusFilters: (OrderStatus | "Todos")[] = [
  "Todos",
  "Pagado",
  "Pendiente",
  "Reembolsado",
  "Fallido",
];
const PAGE_SIZE = 10;

/**
 * Detecta y descarta si un valor corresponde al nombre de un estudiante/cliente
 * en lugar de ser un curso real.
 */
function isStudentName(val?: string, customerNamesSet?: Set<string>): boolean {
  if (!val) return true;
  const v = val.trim().toLowerCase();
  if (!v || v === "—" || v === "-" || v === "general" || v === "undefined" || v === "sin curso asignado") {
    return true;
  }

  // Si coincide con algún nombre de cliente
  if (customerNamesSet) {
    if (customerNamesSet.has(v)) return true;
    for (const name of customerNamesSet) {
      if (name.length > 4 && (v.includes(name) || name.includes(v))) return true;
      // Si 2 o más palabras del nombre coinciden
      const nParts = name.split(/\s+/).filter((p) => p.length > 2);
      const vParts = v.split(/\s+/).filter((p) => p.length > 2);
      const common = nParts.filter((p) => vParts.includes(p));
      if (common.length >= 2) return true;
    }
  }

  // Si tiene términos o códigos típicos de cursos, es un curso legítimo
  const isCourseWord =
    /curso|programa|taller|diplomado|marketing|mrk|excel|contab|cconta|ofimat|capcut|ia\b|artificial|chatgpt|canva|finanz|rmq|presencial|virtual/i.test(
      v,
    );
  if (isCourseWord) return false;

  // Si no contiene palabras de cursos y parece nombre propio de persona (solo letras/espacios y 2+ palabras)
  if (/^[a-záéíóúñ\s]+$/i.test(v) && v.split(/\s+/).length >= 2) {
    return true;
  }

  return false;
}

async function exportOrdersToExcel(
  orders: Awaited<ReturnType<typeof useOrdersQuery>>["data"],
  dateLabel: string,
  courseFilter: string,
  customerNamesSet: Set<string>,
) {
  if (!orders || orders.length === 0) {
    toast.error("No hay pedidos para exportar.");
    return;
  }
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const headers = [
      "ID Pedido",
      "Cliente",
      "Email",
      "Teléfono",
      "Fecha",
      "Curso / Programa",
      "Importe ($)",
      "Estado",
    ];

    const rows = orders.map((o) => {
      const rawCourse = ((o as any).course as string | undefined)?.trim();
      const course = rawCourse && !isStudentName(rawCourse, customerNamesSet) ? rawCourse : "—";
      return [
        o.id,
        o.customer,
        o.email || "—",
        (o as any).phone || "—",
        o.date,
        course,
        o.amount,
        o.status,
      ];
    });

    const title = courseFilter !== "Todos" ? `Pedidos - ${courseFilter}` : "Todos los Pedidos";
    const wsData = [
      [`REPORTE DE PEDIDOS — ${title.toUpperCase()}`],
      [`Período: ${dateLabel}`],
      [`Total registros: ${rows.length}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = headers.map((h, i) => {
      let max = h.length;
      for (const r of rows) {
        const v = String(r[i] ?? "");
        if (v.length > max) max = v.length;
      }
      return { wch: Math.min(Math.max(max + 3, 12), 50) };
    });

    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    const cleanDate = dateLabel
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/__+/g, "_");
    XLSX.writeFile(wb, `SkipperView_Pedidos_${cleanDate}.xlsx`, { compression: true });
    toast.success("Archivo Excel descargado correctamente.");
  } catch (err) {
    console.error(err);
    toast.error("No se pudo generar el archivo Excel.");
  }
}

function OrdersPage() {
  const { range } = useDateRange();
  const { data: orders, isPending } = useOrdersQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("Todos");
  const [courseFilter, setCourseFilter] = useState("Todos");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Conjunto de todos los nombres de clientes para descartarlos de los cursos
  const customerNamesSet = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders ?? []) {
      if (o.customer?.trim()) {
        set.add(o.customer.toLowerCase().trim());
      }
    }
    return set;
  }, [orders]);

  // Extraer lista única de cursos REALES (excluyendo cualquier nombre de alumno)
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders ?? []) {
      const c = ((o as any).course as string | undefined)?.trim();
      if (c && !isStudentName(c, customerNamesSet)) {
        set.add(c);
      }
    }
    return Array.from(set).sort();
  }, [orders, customerNamesSet]);

  const filtered = useMemo(() => {
    return (orders ?? [])
      .filter((o) => inRange(o.date, range.start, range.end))
      .filter((o) => {
        const matchesQuery =
          o.customer.toLowerCase().includes(query.toLowerCase()) ||
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          o.email.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;

        const rawCourse = ((o as any).course as string | undefined)?.trim();
        const effectiveCourse = rawCourse && !isStudentName(rawCourse, customerNamesSet) ? rawCourse : "";

        const matchesCourse =
          courseFilter === "Todos" ||
          effectiveCourse === courseFilter;

        return matchesQuery && matchesStatus && matchesCourse;
      });
  }, [orders, query, statusFilter, courseFilter, range.start, range.end, customerNamesSet]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function handleExport() {
    setExporting(true);
    try {
      await exportOrdersToExcel(filtered, range.label, courseFilter, customerNamesSet);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <DataSourceBanner sources={["opportunities", "pipelines"]} />
      <PageHeader
        title="Pedidos"
        subtitle={`${filtered.length} pedidos · ${range.label.toLowerCase()}`}
        action={
          <Button size="sm" onClick={handleExport} disabled={exporting || isPending}>
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          {/* Búsqueda */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar pedidos, clientes, email..."
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatusFilter(f);
                  setPage(1);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Filtro de curso (solo cursos reales, sin nombres de estudiantes) */}
          {availableCourses.length > 0 && (
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground shrink-0" />
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Todos">Todos los cursos ({availableCourses.length})</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Curso / Programa</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Importe</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Cargando pedidos de tu subcuenta...
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((o) => {
                    const rawCourse = ((o as any).course as string | undefined)?.trim();
                    const validCourse = rawCourse && !isStudentName(rawCourse, customerNamesSet) ? rawCourse : null;

                    return (
                      <tr
                        key={o.id}
                        className="border-b border-border/60 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                          {o.id}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{o.customer}</p>
                          <p className="text-xs text-muted-foreground">{o.email || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {validCourse || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          ${o.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        Ningún pedido coincide con tu búsqueda en este rango de fechas.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
          <span>
            Página {current} de {totalPages} · {filtered.length} resultados
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={current <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={current >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
