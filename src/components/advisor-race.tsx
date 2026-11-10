import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Trophy,
  Flame,
  Flag,
  Target,
  Medal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Search,
  Dices,
} from "lucide-react";
import { ExplainTooltip } from "@/components/ui/tooltip";
import type { AdvisorStats } from "@/lib/advisor-stats";
import { cn } from "@/lib/utils";

const GOALS = {
  tier1: 5000,
  tier2: 7500,
  tier3: 10000,
} as const;

const PAGE_SIZE = 4;

interface AdvisorRaceProps {
  stats: AdvisorStats[];
  rangeLabel?: string;
}

export function AdvisorRace({ stats, rangeLabel }: AdvisorRaceProps) {
  const [filter, setFilter] = useState<"all" | "meta1" | "meta2" | "meta3" | "top3">("all");
  const [query, setQuery] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [page, setPage] = useState(1);

  // Generador determinista de ventas simuladas para prueba visual si se activa el modo demo
  const displayStats = useMemo(() => {
    if (!demoMode) {
      return [...stats].sort((a, b) => b.salesAmount - a.salesAmount);
    }

    // Ventas simuladas alrededor de las metas para probar visualmente la carrera
    const demoSalesAmounts = [
      11250, 9800, 8400, 7650, 6800, 5500, 4800, 4100, 3200, 2100, 1500,
    ];

    return stats.map((s, idx) => {
      const simulatedAmount = demoSalesAmounts[idx % demoSalesAmounts.length] ?? 3500;
      return {
        ...s,
        salesAmount: simulatedAmount,
      };
    }).sort((a, b) => b.salesAmount - a.salesAmount);
  }, [stats, demoMode]);

  // Contadores de metas
  const countTier1 = displayStats.filter((s) => s.salesAmount >= GOALS.tier1).length;
  const countTier2 = displayStats.filter((s) => s.salesAmount >= GOALS.tier2).length;
  const countTier3 = displayStats.filter((s) => s.salesAmount >= GOALS.tier3).length;

  // Filtrado
  const filteredList = useMemo(() => {
    return displayStats.filter((s, idx) => {
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        s.advisor.name.toLowerCase().includes(q) ||
        s.advisor.email.toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (filter === "top3") return idx < 3;
      if (filter === "meta1") return s.salesAmount >= GOALS.tier1 && s.salesAmount < GOALS.tier2;
      if (filter === "meta2") return s.salesAmount >= GOALS.tier2 && s.salesAmount < GOALS.tier3;
      if (filter === "meta3") return s.salesAmount >= GOALS.tier3;
      return true;
    });
  }, [displayStats, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pagedList = filteredList.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ExplainTooltip
              title="Carrera hacia la Meta de Ventas"
              description="Visualización gamificada del avance de cada vendedor hacia los objetivos de $5.000, $7.500 y $10.000."
            >
              <span
                role="button"
                tabIndex={0}
                title="Carrera hacia la Meta de Ventas"
                className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-xl cursor-help transition-transform hover:scale-110"
              >
                🏇
              </span>
            </ExplainTooltip>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                Carrera hacia la Meta de Ventas
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Flame className="size-3 text-primary animate-pulse" /> Derby Comercial
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Desafío de vendedores hacia los tres checkpoints de venta:{" "}
                <strong className="text-amber-600 font-semibold">$5.000</strong> ·{" "}
                <strong className="text-sky-500 font-semibold">$7.500</strong> ·{" "}
                <strong className="text-amber-400 font-semibold">$10.000</strong>
                {rangeLabel ? ` · ${rangeLabel}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Metas / Checkpoints Guía e Interruptor Demo */}
        <div className="flex flex-wrap items-center gap-2">
          <ExplainTooltip
            title="Meta Asesor: $5.000"
            description="Primer hito de ventas para asesores comerciales en el período."
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-600/30 bg-amber-600/10 px-2.5 py-1 text-xs cursor-help">
              <span className="font-bold text-amber-600">🥉 Meta Asesor:</span>
              <span className="font-semibold text-foreground">$5.000</span>
              <span className="rounded bg-background/60 px-1 py-0.2 text-[10px] text-muted-foreground font-mono">
                ({countTier1})
              </span>
            </div>
          </ExplainTooltip>

          <ExplainTooltip
            title="Meta Intermedia: $7.500"
            description="Segundo nivel de rendimiento comercial con bonificación de equipo."
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs cursor-help">
              <span className="font-bold text-sky-400">🥈 Meta Intermedia:</span>
              <span className="font-semibold text-foreground">$7.500</span>
              <span className="rounded bg-background/60 px-1 py-0.2 text-[10px] text-muted-foreground font-mono">
                ({countTier2})
              </span>
            </div>
          </ExplainTooltip>

          <ExplainTooltip
            title="Meta Máxima: $10.000"
            description="Objetivo de excelencia comercial para los mejores vendedores de la academia."
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-xs shadow-sm cursor-help">
              <span className="font-bold text-amber-300">🥇 Meta Máxima:</span>
              <span className="font-semibold text-foreground">$10.000</span>
              <span className="rounded bg-background/60 px-1 py-0.2 text-[10px] text-muted-foreground font-mono">
                ({countTier3})
              </span>
            </div>
          </ExplainTooltip>

          <button
            onClick={() => {
              setDemoMode((prev) => !prev);
              setPage(1);
            }}
            title="Alterna entre datos en vivo y simulación para visualizar la carrera con corredores en distintas metas"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              demoMode
                ? "border-primary bg-primary/20 text-primary font-semibold"
                : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Dices className="size-3.5" />
            {demoMode ? "Modo Simulación Activo" : "Simular Carrera"}
          </button>
        </div>
      </div>

      {/* Barra de Filtros Rápidos y Búsqueda */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 font-medium transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Todos ({displayStats.length})
          </button>
          <button
            onClick={() => {
              setFilter("top3");
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 font-medium transition-colors flex items-center gap-1",
              filter === "top3"
                ? "bg-amber-500 text-black font-semibold shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            🏆 Podio (Top 3)
          </button>
          <button
            onClick={() => {
              setFilter("meta3");
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 font-medium transition-colors flex items-center gap-1",
              filter === "meta3"
                ? "bg-amber-400 text-black font-semibold shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            🥇 Meta $10k ({countTier3})
          </button>
          <button
            onClick={() => {
              setFilter("meta2");
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 font-medium transition-colors flex items-center gap-1",
              filter === "meta2"
                ? "bg-sky-500 text-white font-semibold shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            🥈 Meta $7.5k ({countTier2})
          </button>
          <button
            onClick={() => {
              setFilter("meta1");
              setPage(1);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 font-medium transition-colors flex items-center gap-1",
              filter === "meta1"
                ? "bg-amber-600 text-white font-semibold shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            🥉 Meta $5k ({countTier1})
          </button>
        </div>

        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar corredor..."
            className="h-8 w-full rounded-md border border-input bg-muted/30 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Regla Superior de la Pista (Scale Header) */}
      <div className="mt-6 hidden sm:block">
        <div className="grid grid-cols-12 items-center text-[11px] text-muted-foreground pb-2 px-2 border-b border-border/60">
          <div className="col-span-3 lg:col-span-3 font-semibold text-foreground flex items-center gap-1">
            <span>Vendedor</span>
          </div>
          <div className="col-span-9 lg:col-span-9 relative">
            <div className="relative w-full h-5">
              {/* Salida 0% */}
              <div className="absolute left-0 top-0 -translate-x-1/2 flex flex-col items-center">
                <span className="font-bold text-foreground">🚩 $0</span>
                <span className="text-[9px] text-muted-foreground">Salida</span>
              </div>

              {/* Meta $5.000 (50%) */}
              <div className="absolute left-[50%] top-0 -translate-x-1/2 flex flex-col items-center">
                <span className="font-bold text-amber-600">🥉 $5.000</span>
                <span className="text-[9px] text-muted-foreground">Meta Asesor</span>
              </div>

              {/* Meta $7.500 (75%) */}
              <div className="absolute left-[75%] top-0 -translate-x-1/2 flex flex-col items-center">
                <span className="font-bold text-sky-400">🥈 $7.500</span>
                <span className="text-[9px] text-muted-foreground">Meta Plata</span>
              </div>

              {/* Meta $10.000 (100%) */}
              <div className="absolute right-0 top-0 translate-x-1/2 flex flex-col items-center">
                <span className="font-bold text-amber-400 flex items-center gap-0.5">
                  🏆 $10.000 🏁
                </span>
                <span className="text-[9px] text-amber-300 font-semibold">Meta Oro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carriles de la Carrera (Lanes - 4 por página) */}
      <div className="mt-3 space-y-3.5">
        {pagedList.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay vendedores que coincidan con el filtro seleccionado.
          </div>
        ) : (
          pagedList.map((stat, idx) => {
            const globalRank = (current - 1) * PAGE_SIZE + idx + 1;
            const sales = stat.salesAmount;
            const targetMax = GOALS.tier3; // $10,000 = 100%
            const rawPercent = (sales / targetMax) * 100;
            // Cap visual de 0% a 100%
            const percent = Math.min(100, Math.max(0, rawPercent));
            const isSuperGold = sales >= GOALS.tier3;
            const isSilver = sales >= GOALS.tier2 && sales < GOALS.tier3;
            const isBronze = sales >= GOALS.tier1 && sales < GOALS.tier2;

            // Distancia al siguiente objetivo
            let distanceText = "";
            let badgeClass = "";
            if (isSuperGold) {
              distanceText = `🏆 ¡Meta de $10.000 alcanzada! (${Math.round(rawPercent)}%)`;
              badgeClass = "bg-amber-400/20 text-amber-300 border-amber-400/40";
            } else if (isSilver) {
              const diff = GOALS.tier3 - sales;
              distanceText = `🥈 A $${diff.toLocaleString()} de la Meta Oro ($10k)`;
              badgeClass = "bg-sky-400/20 text-sky-300 border-sky-400/40";
            } else if (isBronze) {
              const diff = GOALS.tier2 - sales;
              distanceText = `🥉 A $${diff.toLocaleString()} de la Meta Plata ($7.5k)`;
              badgeClass = "bg-amber-600/20 text-amber-500 border-amber-600/40";
            } else {
              const diff = GOALS.tier1 - sales;
              distanceText = `A $${diff.toLocaleString()} de la 1ª Meta ($5k)`;
              badgeClass = "bg-muted text-muted-foreground border-border";
            }

            // Distintivo de posición de podio global
            let rankBadge = (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                {globalRank}º
              </span>
            );
            if (globalRank === 1) {
              rankBadge = (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-black shadow-sm" title="Líder de la carrera">
                  🥇
                </span>
              );
            } else if (globalRank === 2) {
              rankBadge = (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[11px] font-bold text-black shadow-sm" title="2º lugar">
                  🥈
                </span>
              );
            } else if (globalRank === 3) {
              rankBadge = (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-700 text-[11px] font-bold text-white shadow-sm" title="3º lugar">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={stat.advisor.id}
                className={cn(
                  "group relative rounded-xl border p-3 transition-all hover:border-primary/50 hover:bg-muted/20",
                  globalRank === 1
                    ? "border-amber-400/40 bg-amber-400/[0.03]"
                    : "border-border/70 bg-card/80",
                )}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                  {/* Columna Izquierda: Vendedor y Ventas */}
                  <div className="sm:col-span-4 lg:col-span-3 flex items-center justify-between sm:justify-start gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {rankBadge}
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground"
                        style={{
                          background: `linear-gradient(135deg, color-mix(in oklab, ${stat.advisor.avatarColor} 35%, transparent), color-mix(in oklab, ${stat.advisor.avatarColor} 10%, transparent))`,
                        }}
                      >
                        {stat.advisor.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/advisors/$advisorId"
                          params={{ advisorId: stat.advisor.id }}
                          className="block truncate text-xs font-semibold text-foreground hover:underline"
                        >
                          {stat.advisor.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {stat.wonLeads} ganados · {stat.totalLeads} asignados
                        </p>
                      </div>
                    </div>

                    <div className="sm:hidden text-right">
                      <span className="font-display font-bold text-sm text-foreground">
                        ${sales.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Columna Derecha: Pista con Carril y Caballo */}
                  <div className="sm:col-span-8 lg:col-span-9 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-display font-bold text-foreground flex items-center gap-1.5">
                        <span className="text-sm">
                          ${sales.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({percent.toFixed(0)}% de $10k)
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                          badgeClass,
                        )}
                      >
                        {distanceText}
                      </span>
                    </div>

                    {/* La Pista de Carreras con Guías de Metas */}
                    <div className="relative h-7 w-full overflow-hidden rounded-lg bg-muted/40 p-1 border border-border/60">
                      {/* Línea Guía Meta $5k (50%) */}
                      <div
                        className="absolute inset-y-0 left-[50%] w-px border-r border-dashed border-amber-600/50 z-0 pointer-events-none"
                        title="Meta Asesor: $5.000"
                      />

                      {/* Línea Guía Meta $7.5k (75%) */}
                      <div
                        className="absolute inset-y-0 left-[75%] w-px border-r border-dashed border-sky-500/50 z-0 pointer-events-none"
                        title="Meta Intermedia: $7.500"
                      />

                      {/* Línea Guía Meta $10k (100%) */}
                      <div
                        className="absolute inset-y-0 right-0 w-1.5 bg-amber-400/40 z-0 pointer-events-none"
                        title="Meta Llegada: $10.000"
                      />

                      {/* Barra de Progreso del Corredor */}
                      <div
                        className={cn(
                          "relative h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-1",
                          isSuperGold
                            ? "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 text-black shadow-sm"
                            : isSilver
                              ? "bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-300 text-black"
                              : isBronze
                                ? "bg-gradient-to-r from-amber-700 via-orange-600 to-amber-500 text-white"
                                : "bg-gradient-to-r from-primary/60 to-primary text-primary-foreground",
                        )}
                        style={{
                          width: `${Math.max(percent, 4)}%`,
                        }}
                      >
                        {/* Caballo Corredor en la Punta */}
                        <div
                          className="flex items-center gap-0.5 select-none"
                          title={`${stat.advisor.name}: $${sales.toLocaleString()}`}
                        >
                          <span
                            className={cn(
                              "text-sm transition-transform duration-300 group-hover:scale-125 inline-block",
                              sales > 0 && "animate-pulse",
                            )}
                          >
                            🏇
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación de la Carrera (4 por página) */}
      {filteredList.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>
              Mostrando <strong className="text-foreground">{(current - 1) * PAGE_SIZE + 1}</strong>–
              <strong className="text-foreground">
                {Math.min(current * PAGE_SIZE, filteredList.length)}
              </strong>{" "}
              de <strong className="text-foreground">{filteredList.length}</strong> vendedores
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current <= 1}
              className="flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" /> Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                    p === current
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-input bg-background hover:bg-accent text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current >= totalPages}
              className="flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            >
              Siguiente <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pie de la Carrera con Leyenda Explicativa */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-600" /> Meta Asesor: $5.000
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-400" /> Meta Intermedia: $7.500
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400" /> Meta Máxima: $10.000
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-amber-400" />
          <span>El caballo avanza en tiempo real según el monto de ventas cerradas de cada asesor.</span>
        </div>
      </div>
    </div>
  );
}
