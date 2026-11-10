import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Users2,
  Trophy,
  Target,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { DataSourceBanner } from "@/components/data-source-banner";
import { AdvisorRace } from "@/components/advisor-race";
import { useAdvisorsQuery, useLeadsQuery } from "@/lib/ghl-hooks";
import { advisorStats, advisorSalesSeries, type LeadOutcome } from "@/lib/advisor-stats";
import { useDateRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/advisors/")({
  head: () => ({
    meta: [
      { title: "Asesores — Skipper View" },
      {
        name: "description",
        content:
          "Rendimiento de asesores: porcentaje de ventas sobre leads asignados y leads marcados como Ganado.",
      },
      { property: "og:title", content: "Asesores — Skipper View" },
      {
        property: "og:description",
        content:
          "Rendimiento de asesores: porcentaje de ventas sobre leads asignados y leads marcados como Ganado.",
      },
    ],
  }),
  component: AdvisorsIndexPage,
});

const outcomeStyles: Record<LeadOutcome, string> = {
  Ganado: "bg-success/15 text-success",
  "En proceso": "bg-warning/15 text-warning",
  Perdido: "bg-destructive/15 text-destructive",
};

const PAGE_SIZE = 5;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          <span className="font-medium text-foreground">{p.name}:</span>{" "}
          {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function AdvisorsIndexPage() {
  const { range } = useDateRange();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"sales-desc" | "sales-asc" | "leads-desc" | "winRate" | "name">("sales-desc");
  const [page, setPage] = useState(1);

  const { data: advisors, isPending: advisorsPending } = useAdvisorsQuery();
  const { data: leads, isPending: leadsPending } = useLeadsQuery();
  const isPending = advisorsPending || leadsPending;

  const stats = useMemo(
    () => advisorStats(advisors ?? [], leads ?? [], range.start, range.end),
    [advisors, leads, range.start, range.end],
  );
  const series = useMemo(() => advisorSalesSeries(stats), [stats]);

  const totalLeads = stats.reduce((s, a) => s + a.totalLeads, 0);
  const totalWon = stats.reduce((s, a) => s + a.wonLeads, 0);
  const totalSales = stats.reduce((s, a) => s + a.salesAmount, 0);
  const avgWinRate = stats.length ? stats.reduce((s, a) => s + a.winRate, 0) / stats.length : 0;

  const filtered = useMemo(() => {
    return stats
      .filter((s) => {
        const q = query.toLowerCase();
        return (
          s.advisor.name.toLowerCase().includes(q) ||
          s.advisor.email.toLowerCase().includes(q) ||
          s.advisor.region.toLowerCase().includes(q) ||
          s.advisor.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "sales-desc") {
          if (b.salesAmount !== a.salesAmount) return b.salesAmount - a.salesAmount;
          return b.wonLeads - a.wonLeads;
        }
        if (sortBy === "sales-asc") return a.salesAmount - b.salesAmount;
        if (sortBy === "leads-desc") return b.totalLeads - a.totalLeads;
        if (sortBy === "winRate") return b.winRate - a.winRate;
        if (sortBy === "name") return a.advisor.name.localeCompare(b.advisor.name);
        return b.salesAmount - a.salesAmount;
      });
  }, [stats, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const topAdvisor = [...stats].sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <div>
      <DataSourceBanner sources={["users", "contacts", "opportunities"]} />
      <PageHeader
        title="Asesores"
        subtitle={`Rendimiento de ventas sobre leads asignados · ${range.label.toLowerCase()}`}
        action={
          <Button size="sm">
            <Award className="size-4" /> Exportar reporte
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Leads asignados"
          value={totalLeads.toLocaleString()}
          delta={9.3}
          icon={Users2}
          accent="primary"
        />
        <KpiCard
          label="Leads ganados"
          value={totalWon.toLocaleString()}
          delta={14.2}
          icon={Trophy}
          accent="accent"
        />
        <KpiCard
          label="Ventas cerradas"
          value={`$${totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={11.7}
          icon={TrendingUp}
          accent="chart-3"
        />
        <KpiCard
          label="Tasa de cierre prom."
          value={`${avgWinRate.toFixed(1)}%`}
          delta={3.4}
          icon={Target}
          accent="warning"
        />
      </div>

      <AdvisorRace stats={stats} rangeLabel={range.label} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          title="Ventas por asesor"
          subtitle={`Ingresos cerrados · ${range.label}`}
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="ventas"
                  name="Ventas ($)"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Asesor destacado" subtitle="Mayor tasa de cierre" icon={Trophy}>
          {topAdvisor && topAdvisor.totalLeads > 0 ? (
            <div className="flex flex-col items-center text-center">
              <div
                className="flex size-16 items-center justify-center rounded-full text-xl font-bold text-foreground"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, ${topAdvisor.advisor.avatarColor} 35%, transparent), color-mix(in oklab, ${topAdvisor.advisor.avatarColor} 10%, transparent))`,
                }}
              >
                {topAdvisor.advisor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <p className="mt-3 font-display text-lg font-bold text-foreground">
                {topAdvisor.advisor.name}
              </p>
              <p className="text-xs text-muted-foreground">{topAdvisor.advisor.region}</p>
              <div className="mt-4 w-full rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasa de cierre</span>
                  <span className="font-semibold text-success">
                    {topAdvisor.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${Math.min(topAdvisor.winRate, 100)}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="text-muted-foreground">Ganados</p>
                    <p className="font-semibold text-foreground">{topAdvisor.wonLeads}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <p className="text-muted-foreground">Asignados</p>
                    <p className="font-semibold text-foreground">{topAdvisor.totalLeads}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin datos en este rango de fechas.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar asesor, email, región..."
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="sales-desc">Mayor a menor ventas (Predeterminado)</option>
                <option value="sales-asc">Menor a mayor ventas</option>
                <option value="winRate">Mayor tasa de cierre</option>
                <option value="leads-desc">Más leads asignados</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>

            <span className="text-xs text-muted-foreground">
              {filtered.length} asesores · {range.label}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Asesor</th>
                <th className="px-4 py-3 font-medium">Leads asignados</th>
                <th className="px-4 py-3 font-medium">Ganados</th>
                <th className="px-4 py-3 font-medium">En proceso</th>
                <th className="px-4 py-3 font-medium">Perdidos</th>
                <th className="px-4 py-3 font-medium">% de ventas</th>
                <th className="px-4 py-3 font-medium">Ventas cerradas</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td
                    colSpan={7}
                    className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground"
                  >
                    <Loader2 className="size-4 animate-spin" /> Cargando asesores de tu subcuenta...
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((s) => (
                    <tr
                      key={s.advisor.id}
                      className="border-b border-border/60 transition-colors hover:bg-muted/30"
                      onClick={() =>
                        navigate({
                          to: "/advisors/$advisorId",
                          params: { advisorId: s.advisor.id },
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground"
                            style={{
                              background: `linear-gradient(135deg, color-mix(in oklab, ${s.advisor.avatarColor} 35%, transparent), color-mix(in oklab, ${s.advisor.avatarColor} 10%, transparent))`,
                            }}
                          >
                            {s.advisor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{s.advisor.name}</p>
                            <p className="text-xs text-muted-foreground">{s.advisor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.totalLeads}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-success">{s.wonLeads}</span>
                      </td>
                      <td className="px-4 py-3 text-warning">{s.inProgressLeads}</td>
                      <td className="px-4 py-3 text-destructive">{s.lostLeads}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(s.winRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-foreground">
                            {s.winRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ${s.salesAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {pageItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        Ningún asesor coincide con tu búsqueda en este rango de fechas.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground">
          <span>
            Página <strong className="text-foreground">{current}</strong> de{" "}
            <strong className="text-foreground">{totalPages}</strong> · Mostrando{" "}
            <strong className="text-foreground">{(current - 1) * PAGE_SIZE + 1}</strong>–
            <strong className="text-foreground">
              {Math.min(current * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            de <strong className="text-foreground">{filtered.length}</strong> asesores (5 por página)
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
      </div>

      {/* Leyenda de estados de cierre */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Estados de cierre de leads:</span>
        {(Object.keys(outcomeStyles) as LeadOutcome[]).map((o) => (
          <span
            key={o}
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 font-semibold",
              outcomeStyles[o],
            )}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}
