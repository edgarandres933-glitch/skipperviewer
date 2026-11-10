import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  Loader2,
  BookOpen,
  Building2,
  Laptop,
  CreditCard,
  CheckCircle2,
  Phone,
  RotateCcw,
  Trophy,
  Users,
  DollarSign,
  Target,
  Award,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { ExplainTooltip } from "@/components/ui/tooltip";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useAdvisorsQuery, useLeadsQuery } from "@/lib/ghl-hooks";
import { advisorLeads, advisorStats } from "@/lib/advisor-stats";
import { useDateRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisors/$advisorId")({
  head: () => ({
    meta: [
      { title: "Detalle de asesor — Skipper View" },
      {
        name: "description",
        content: "Resumen del asesor con leads ganados, curso, modalidad y desglose de pagos completos o abonos.",
      },
      { property: "og:title", content: "Detalle de asesor — Skipper View" },
      {
        property: "og:description",
        content: "Resumen del asesor con leads ganados, curso, modalidad y desglose de pagos completos o abonos.",
      },
    ],
  }),
  component: AdvisorDetailPage,
});

const PAGE_SIZE = 8;

function AdvisorDetailPage() {
  const { advisorId } = Route.useParams();
  const { range } = useDateRange();
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("Todos");
  const [modalityFilter, setModalityFilter] = useState<"Todos" | "Presencial" | "Virtual">("Todos");
  const [paymentFilter, setPaymentFilter] = useState<"Todos" | "Pago completo" | "Abono">("Todos");
  const [page, setPage] = useState(1);

  const { data: advisors, isPending: advPending } = useAdvisorsQuery();
  const { data: leads, isPending: leadsPending } = useLeadsQuery();
  const isPending = advPending || leadsPending;

  const advisor = useMemo(
    () => (advisors ?? []).find((a) => a.id === advisorId),
    [advisors, advisorId],
  );

  // Todos los leads del asesor en el rango de fechas
  const allDetails = useMemo(
    () => advisorLeads(advisor, leads ?? [], range.start, range.end),
    [advisor, leads, range.start, range.end],
  );

  // Estadísticas globales del asesor
  const stat = useMemo(
    () =>
      advisorStats(advisors ?? [], leads ?? [], range.start, range.end).find(
        (s) => s.advisor.id === advisorId,
      ),
    [advisors, leads, range.start, range.end, advisorId],
  );

  // FILTRADO ESTRICTO: Exclusivamente leads en estado "Ganado" (sin leads en "En proceso" / "Proceso de cierre")
  const wonDetails = useMemo(
    () => allDetails.filter((d) => d.outcome === "Ganado"),
    [allDetails],
  );

  // Cursos presentes en los leads ganados de este asesor
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    for (const d of wonDetails) {
      if (d.lead.course && d.lead.course !== "—") set.add(d.lead.course);
    }
    return Array.from(set).sort();
  }, [wonDetails]);

  // Contadores de modalidad en los leads ganados
  const countPresencial = useMemo(
    () => wonDetails.filter((d) => d.lead.modality === "Presencial").length,
    [wonDetails],
  );
  const countVirtual = useMemo(
    () => wonDetails.filter((d) => d.lead.modality === "Virtual").length,
    [wonDetails],
  );

  // Contadores de pago en los leads ganados
  const countFullPayment = useMemo(
    () => wonDetails.filter((d) => d.lead.paymentStatus === "Pago completo").length,
    [wonDetails],
  );
  const countDeposit = useMemo(
    () => wonDetails.filter((d) => d.lead.paymentStatus === "Abono").length,
    [wonDetails],
  );

  // Desglose por curso de los leads ganados
  const courseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of wonDetails) {
      const c = d.lead.course || "General";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [wonDetails]);

  // Suma total exacta de todos los pagos completos y abonos de los leads ganados
  const totalSalesAmount = useMemo(() => {
    return wonDetails.reduce((sum, d) => {
      const paid = Number(d.lead.deposit || d.lead.total || 0);
      return sum + paid;
    }, 0);
  }, [wonDetails]);

  // Filtros interactivos sobre los leads ganados
  const filtered = useMemo(() => {
    return wonDetails.filter((d) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        d.lead.name.toLowerCase().includes(q) ||
        d.lead.email.toLowerCase().includes(q) ||
        d.lead.phone.toLowerCase().includes(q) ||
        d.lead.course.toLowerCase().includes(q);

      const matchesCourse = courseFilter === "Todos" || d.lead.course === courseFilter;
      const matchesModality = modalityFilter === "Todos" || d.lead.modality === modalityFilter;
      const matchesPayment = paymentFilter === "Todos" || d.lead.paymentStatus === paymentFilter;

      return matchesQuery && matchesCourse && matchesModality && matchesPayment;
    });
  }, [wonDetails, query, courseFilter, modalityFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const hasActiveFilters =
    courseFilter !== "Todos" ||
    modalityFilter !== "Todos" ||
    paymentFilter !== "Todos" ||
    query !== "";

  const resetFilters = () => {
    setCourseFilter("Todos");
    setModalityFilter("Todos");
    setPaymentFilter("Todos");
    setQuery("");
    setPage(1);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Cargando asesor de tu subcuenta...
      </div>
    );
  }

  if (!advisor) {
    return (
      <div>
        <PageHeader title="Asesor no encontrado" />
        <Link
          to="/advisors"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" /> Volver a Asesores
        </Link>
      </div>
    );
  }

  const won = wonDetails.length;
  const inProgress = allDetails.filter((d) => d.outcome === "En proceso").length;
  const lost = allDetails.filter((d) => d.outcome === "Perdido").length;
  const winRate = allDetails.length ? (won / allDetails.length) * 100 : 0;

  return (
    <div>
      <DataSourceBanner sources={["users", "contacts", "opportunities"]} />
      <Link
        to="/advisors"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a Asesores
      </Link>

      <PageHeader
        title={advisor.name}
        subtitle={`${advisor.email} · ${range.label.toLowerCase()}`}
        action={
          <Button size="sm" variant="outline">
            Exportar ventas
          </Button>
        }
      />

      {/* KPI Cards principales de rendimiento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Leads asignados"
          value={allDetails.length.toLocaleString()}
          delta={9.3}
          icon={Users}
          accent="primary"
        />
        <KpiCard
          label="Leads ganados"
          value={won.toLocaleString()}
          delta={14.2}
          icon={Trophy}
          accent="accent"
        />
        <KpiCard
          label="En proceso / Perdidos"
          value={`${inProgress} / ${lost}`}
          delta={-2.1}
          icon={Target}
          accent="warning"
        />
        <KpiCard
          label="Ventas cerradas"
          value={`$${(totalSalesAmount ?? stat?.salesAmount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={3.4}
          icon={DollarSign}
          accent="chart-3"
        />
      </div>

      {/* Cuadro Resumen del Asesor (Curso, Modalidad, Pago Completo o Abono de sus ventas ganadas) */}
      {stat && (
        <Card title="Resumen del asesor" subtitle="Cursos, modalidades y pagos cerrados por este asesor" icon={Award} className="mt-4">
          <div className="flex flex-col gap-5">
            {/* Fila Principal de Rendimiento */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-13 items-center justify-center rounded-xl text-base font-bold text-foreground shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, color-mix(in oklab, ${advisor.avatarColor} 35%, transparent), color-mix(in oklab, ${advisor.avatarColor} 10%, transparent))`,
                  }}
                >
                  {advisor.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">{advisor.name}</p>
                  <p className="text-xs text-muted-foreground">{advisor.email}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{advisor.id}</p>
                </div>
              </div>

              <div className="flex-1 min-w-[220px] max-w-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium">Tasa de cierre</span>
                  <span className="font-bold text-success text-sm">{winRate.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${Math.min(winRate, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">🏆 {won} ventas ganadas</span>
                  <span>{allDetails.length} leads asignados</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-muted-foreground">Ventas cerradas</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  ${(totalSalesAmount ?? stat?.salesAmount ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Fila Secundaria: Desglose de Cursos, Modalidad y Tipo de Pago de los Ganados */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Desglose de Cursos Ganados */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <ExplainTooltip
                      title="Cursos Ganados"
                      description="Programas académicos en los que este asesor concretó matrículas exitosas."
                    >
                      <span className="cursor-help transition-transform hover:scale-110">
                        <BookOpen className="size-4 text-primary" />
                      </span>
                    </ExplainTooltip>
                    <span>Cursos Ganados</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">({won} ventas)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {courseBreakdown.slice(0, 4).map(([c, count]) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground shadow-2xs"
                    >
                      <span className="font-medium truncate max-w-[130px]">{c}</span>
                      <strong className="text-primary font-bold">({count})</strong>
                    </span>
                  ))}
                  {courseBreakdown.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sin ventas ganadas en este período</span>
                  )}
                </div>
              </div>

              {/* Desglose de Modalidad Ganadas */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2.5">
                  <ExplainTooltip
                    title="Modalidad de Estudio"
                    description="Distribución de alumnos matriculados en formato presencial o virtual."
                  >
                    <span className="cursor-help transition-transform hover:scale-110">
                      <Building2 className="size-4 text-emerald-500" />
                    </span>
                  </ExplainTooltip>
                  <span>Modalidad de Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <Building2 className="size-3.5" /> Presencial
                    </span>
                    <strong className="font-bold text-foreground">{countPresencial}</strong>
                  </div>
                  <div className="flex flex-1 items-center justify-between rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-400">
                      <Laptop className="size-3.5" /> Virtual
                    </span>
                    <strong className="font-bold text-foreground">{countVirtual}</strong>
                  </div>
                </div>
              </div>

              {/* Desglose de Pagos (Pago Completo vs Abono) */}
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2.5">
                  <ExplainTooltip
                    title="Comportamiento de Pagos"
                    description="Total de alumnos que pagaron al contado frente a quienes abonaron cuotas."
                  >
                    <span className="cursor-help transition-transform hover:scale-110">
                      <CreditCard className="size-4 text-amber-500" />
                    </span>
                  </ExplainTooltip>
                  <span>Pagos (Completo vs Abono)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" /> Completo
                    </span>
                    <strong className="font-bold text-foreground">{countFullPayment}</strong>
                  </div>
                  <div className="flex flex-1 items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                      <CreditCard className="size-3.5" /> Abono
                    </span>
                    <strong className="font-bold text-foreground">{countDeposit}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla Exclusiva de Ventas / Leads Ganados (Sin "En proceso") */}
      <div className="mt-4 rounded-xl border border-border bg-card">
        {/* Barra Superior con Buscador y Badge de Solo Ganados */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar alumno, email, teléfono o curso..."
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs">
              <Trophy className="size-3.5 text-amber-500" />
              Solo Leads Ganados ({wonDetails.length})
            </span>
          </div>
        </div>

        {/* Barra de Filtros: Curso, Modalidad y Tipo de Pago */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro Curso */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <BookOpen className="size-3.5 text-primary" /> Curso:
              </span>
              <select
                value={courseFilter}
                onChange={(e) => {
                  setCourseFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Todos">Todos los cursos ganados ({wonDetails.length})</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c}>
                    {c} ({wonDetails.filter((d) => d.lead.course === c).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Modalidad */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Building2 className="size-3.5 text-emerald-500" /> Modalidad:
              </span>
              <select
                value={modalityFilter}
                onChange={(e) => {
                  setModalityFilter(e.target.value as any);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Todos">Todas las modalidades</option>
                <option value="Presencial">🏢 Presencial ({countPresencial})</option>
                <option value="Virtual">💻 Virtual ({countVirtual})</option>
              </select>
            </div>

            {/* Filtro Pago Completo / Abono */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <CreditCard className="size-3.5 text-amber-500" /> Pago:
              </span>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value as any);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Todos">Todos los tipos de pago</option>
                <option value="Pago completo">🟢 Pago completo ({countFullPayment})</option>
                <option value="Abono">🟡 Abono ({countDeposit})</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <RotateCcw className="size-3" /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Tabla de Alumnos / Leads Ganados */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Alumno / Lead</th>
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Modalidad</th>
                <th className="px-4 py-3 font-medium">Pago (Completo / Abono)</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha de Cierre</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => {
                const lead = d.lead;
                const isFullPayment = lead.paymentStatus === "Pago completo";
                const isDeposit = lead.paymentStatus === "Abono";

                return (
                  <tr
                    key={lead.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    {/* Alumno / Lead */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-primary/20 text-xs font-bold text-foreground">
                          {lead.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{lead.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {lead.phone && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="size-2.5" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && <span className="truncate">{lead.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Curso */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
                        <BookOpen className="size-3.5 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]" title={lead.course}>
                          {lead.course || "General"}
                        </span>
                      </span>
                    </td>

                    {/* Modalidad */}
                    <td className="px-4 py-3">
                      {lead.modality === "Presencial" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <Building2 className="size-3 shrink-0" /> Presencial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                          <Laptop className="size-3 shrink-0" /> Virtual
                        </span>
                      )}
                    </td>

                    {/* Pago Completo o Abono */}
                    <td className="px-4 py-3">
                      {isFullPayment ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs">
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          Pago completo
                          {lead.deposit > 0 && (
                            <span className="font-mono text-[11px] font-semibold opacity-90">
                              (${lead.deposit.toLocaleString()})
                            </span>
                          )}
                        </span>
                      ) : isDeposit ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-2xs">
                          <CreditCard className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          Abono
                          {lead.deposit > 0 && (
                            <span className="font-mono text-[11px] font-semibold opacity-90">
                              (${lead.deposit.toLocaleString()})
                            </span>
                          )}
                          {lead.total > lead.deposit && (
                            <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                              / ${lead.total}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs">
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          Pago completo
                        </span>
                      )}
                    </td>

                    {/* Estado: Siempre Ganado */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success shadow-2xs">
                        <Trophy className="size-3 text-amber-500" /> Ganado
                      </span>
                    </td>

                    {/* Fecha de cierre */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {lead.oppDate || lead.date}
                    </td>
                  </tr>
                );
              })}

              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    <Trophy className="mx-auto size-8 text-muted-foreground/50 mb-2" />
                    <p className="font-semibold text-foreground">
                      No hay leads en estado "Ganado" {hasActiveFilters ? "con los filtros seleccionados" : "en este rango de fechas"}.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      {allDetails.length > 0
                        ? `(Este asesor tiene ${inProgress} leads en proceso y ${lost} perdidos en el rango de fechas actual)`
                        : "Prueba seleccionando un rango de fechas más amplio en el selector superior (ej. Últimos 12 meses o Todo el año)."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground">
            <span>
              Página <strong className="text-foreground">{current}</strong> de{" "}
              <strong className="text-foreground">{totalPages}</strong> · Mostrando{" "}
              <strong className="text-foreground">{(current - 1) * PAGE_SIZE + 1}</strong>
              –
              <strong className="text-foreground">
                {Math.min(current * PAGE_SIZE, filtered.length)}
              </strong>{" "}
              de <strong className="text-foreground">{filtered.length}</strong> ventas ganadas
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                disabled={current <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" /> Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                      p === current
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-input bg-background hover:bg-accent text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                disabled={current >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
