import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Target,
  Database,
  Loader2,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useCrmQuery } from "@/lib/crm-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  head: () => ({
    meta: [
      { title: "CRM — Skipper View" },
      {
        name: "description",
        content: "Todos los contactos y oportunidades de la subcuenta en un solo lugar.",
      },
      { property: "og:title", content: "CRM — Skipper View" },
      {
        property: "og:description",
        content: "Todos los contactos y oportunidades de la subcuenta en un solo lugar.",
      },
    ],
  }),
  component: CrmPage,
});

const PAGE_SIZE = 12;

const oppStatusStyles: Record<string, string> = {
  won: "bg-success/15 text-success",
  open: "bg-chart-1/15 text-chart-1",
  lost: "bg-destructive/15 text-destructive",
  abandoned: "bg-muted text-muted-foreground",
};

function oppStatusLabel(raw: string): string {
  const s = raw.toLowerCase();
  if (s === "won" || s.includes("gan") || s.includes("closed")) return "Ganado";
  if (s === "lost" || s.includes("perd")) return "Perdido";
  if (s === "abandoned" || s.includes("aband")) return "Abandonado";
  if (s === "open" || s.includes("open")) return "Abierto";
  return raw || "—";
}

function CrmPage() {
  const { range } = useDateRange();
  const { data: crm, isPending } = useCrmQuery();
  const [tab, setTab] = useState<"contacts" | "opportunities">("contacts");
  const [query, setQuery] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Contactos en rango
  const rangeContacts = useMemo(
    () => (crm?.contacts ?? []).filter((c) => inRange(c.dateAdded, range.start, range.end)),
    [crm, range.start, range.end],
  );

  // Oportunidades en rango
  const rangeOpps = useMemo(
    () => (crm?.opportunities ?? []).filter((o) => inRange(o.createdAt, range.start, range.end)),
    [crm, range.start, range.end],
  );

  // Filtros disponibles
  const pipelines = useMemo(() => {
    const set = new Map<string, string>();
    for (const o of crm?.opportunities ?? [])
      if (o.pipelineId) set.set(o.pipelineId, o.pipelineName);
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [crm]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const o of crm?.opportunities ?? []) if (o.status) set.add(o.status);
    return Array.from(set).sort();
  }, [crm]);

  // Contactos filtrados
  const filteredContacts = useMemo(() => {
    const q = query.toLowerCase();
    return rangeContacts.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.source.toLowerCase().includes(q) ||
        c.assignedTo.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || oppStatusLabel(c.opportunityStatus ?? "") === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rangeContacts, query, statusFilter]);

  // Oportunidades filtradas
  const filteredOpps = useMemo(() => {
    const q = query.toLowerCase();
    return rangeOpps.filter((o) => {
      const matchesQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q) ||
        o.contactEmail.toLowerCase().includes(q) ||
        o.assignedTo.toLowerCase().includes(q) ||
        o.source.toLowerCase().includes(q);
      const matchesPipeline = !pipelineFilter || o.pipelineId === pipelineFilter;
      const matchesStatus = !statusFilter || oppStatusLabel(o.status) === statusFilter;
      return matchesQuery && matchesPipeline && matchesStatus;
    });
  }, [rangeOpps, query, pipelineFilter, statusFilter]);

  const list = tab === "contacts" ? filteredContacts : filteredOpps;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const wonCount = rangeOpps.filter((o) => oppStatusLabel(o.status) === "Ganado").length;
  const totalValue = rangeOpps.reduce((s, o) => s + o.monetaryValue, 0);

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities", "users"]} />
      <PageHeader
        title="CRM"
        subtitle={`${rangeContacts.length.toLocaleString()} contactos · ${rangeOpps.length.toLocaleString()} oportunidades · ${range.label.toLowerCase()}`}
        action={
          <Button size="sm">
            <Database className="size-4" /> Exportar CRM
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Contactos totales"
          value={rangeContacts.length.toLocaleString()}
          delta={9.3}
          icon={Users}
          accent="primary"
        />
        <KpiCard
          label="Oportunidades"
          value={rangeOpps.length.toLocaleString()}
          delta={11.7}
          icon={Target}
          accent="accent"
        />
        <KpiCard
          label="Oportunidades ganadas"
          value={wonCount.toLocaleString()}
          delta={6.4}
          icon={Target}
          accent="chart-3"
        />
        <KpiCard
          label="Valor total pipeline"
          value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={4.2}
          icon={Database}
          accent="warning"
        />
      </div>

      {/* Pestañas */}
      <div className="mt-4 flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => {
            setTab("contacts");
            resetPage();
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "contacts"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4" /> Contactos ({rangeContacts.length.toLocaleString()})
        </button>
        <button
          onClick={() => {
            setTab("opportunities");
            resetPage();
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "opportunities"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Target className="size-4" /> Oportunidades ({rangeOpps.length.toLocaleString()})
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder={
              tab === "contacts"
                ? "Buscar nombre, email, teléfono, asesor..."
                : "Buscar oportunidad, contacto, asesor..."
            }
            className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {tab === "opportunities" && (
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={pipelineFilter}
              onChange={(e) => {
                setPipelineFilter(e.target.value);
                resetPage();
              }}
              className="h-9 rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los pipelines</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            className="h-9 rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="Ganado">Ganado</option>
            <option value="Abierto">Abierto</option>
            <option value="Perdido">Perdido</option>
            <option value="Abandonado">Abandonado</option>
          </select>
        </div>

        {(query || pipelineFilter || statusFilter) && (
          <button
            onClick={() => {
              setQuery("");
              setPipelineFilter("");
              setStatusFilter("");
              resetPage();
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <Card className="mt-4">
        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando datos de tu subcuenta...
            </div>
          ) : tab === "contacts" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Fuente</th>
                  <th className="px-4 py-3 font-medium">Asesor</th>
                  <th className="px-4 py-3 font-medium">Etiquetas</th>
                  <th className="px-4 py-3 font-medium">Oportunidad</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(pageItems as typeof filteredContacts).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-foreground">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.source}</td>
                    <td className="px-4 py-3 text-foreground">{c.assignedTo}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {c.tags.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.opportunityStatus ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                            oppStatusStyles[c.opportunityStatus.toLowerCase()] ??
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {oppStatusLabel(c.opportunityStatus)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin oportunidad</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.dateAdded}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      Ningún contacto coincide con tu búsqueda en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Oportunidad</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Pipeline</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Asesor</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(pageItems as typeof filteredOpps).map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{o.id.slice(-6).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{o.contactName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.contactEmail || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.pipelineName}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ${o.monetaryValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                          oppStatusStyles[o.status.toLowerCase()] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {oppStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{o.assignedTo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.createdAt}</td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      Ninguna oportunidad coincide con tu búsqueda en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
          <span>
            Página {current} de {totalPages} · {list.length.toLocaleString()} resultados
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
      </Card>
    </div>
  );
}
