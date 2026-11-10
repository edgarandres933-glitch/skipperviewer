import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Users,
  GraduationCap,
  Target,
  Download,
  BookOpen,
  Building2,
  Laptop,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { ExplainTooltip } from "@/components/ui/tooltip";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useDashboardQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel de Productos y Cursos — Skipper View" },
      {
        name: "description",
        content: "Resumen de ventas, alumnos matriculados y recaudación por cada producto y curso.",
      },
      { property: "og:title", content: "Panel de Productos y Cursos — Skipper View" },
      {
        property: "og:description",
        content: "Resumen de ventas, alumnos matriculados y recaudación por cada producto y curso.",
      },
    ],
  }),
  component: DashboardPage,
});

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="font-medium text-foreground">{p.name}:</span>{" "}
          {typeof p.value === "number" ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { range } = useDateRange();
  const { data: dataset, isPending } = useDashboardQuery();

  const allLeads = dataset?.leads ?? [];

  // Leads que caen en el rango de fechas seleccionado
  const rangeLeads = useMemo(
    () => allLeads.filter((l) => inRange(l.oppDate || l.date, range.start, range.end)),
    [allLeads, range.start, range.end],
  );

  // Alumnos con cierre de venta confirmado ("Ganado") en el rango
  const wonLeads = useMemo(
    () =>
      rangeLeads.filter(
        (l) => l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won",
      ),
    [rangeLeads],
  );

  // Recaudación real de pagos completos y abonos en el período
  const revenue = useMemo(
    () => wonLeads.reduce((s, l) => s + Number(l.deposit || l.total || 0), 0),
    [wonLeads],
  );

  const fullPaymentsCount = useMemo(
    () => wonLeads.filter((l) => l.paymentStatus === "Pago completo").length,
    [wonLeads],
  );
  const depositsCount = useMemo(
    () => wonLeads.filter((l) => l.paymentStatus === "Abono").length,
    [wonLeads],
  );

  // Rendimiento desglosado por cada uno de tus productos / cursos reales
  const productMetrics = useMemo(() => {
    const MAIN_PRODUCTS = [
      {
        key: "Marketing Digital",
        label: "Marketing Digital",
        tag: "Redes & Ads",
        icon: "📱",
        color: "var(--color-chart-1)",
        accentBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      },
      {
        key: "Excel Profesional",
        label: "Excel Profesional",
        tag: "Básico a Avanzado",
        icon: "📊",
        color: "var(--color-chart-2)",
        accentBg: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
      },
      {
        key: "Asistente Contable",
        label: "Asistente Contable",
        tag: "Contabilidad & Tributación",
        icon: "💼",
        color: "var(--color-chart-3)",
        accentBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
      },
      {
        key: "Ofimática",
        label: "Ofimática Profesional",
        tag: "Word, Excel, PowerPoint",
        icon: "💻",
        color: "var(--color-chart-2)",
        accentBg: "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400",
      },
      {
        key: "CapCut",
        label: "CapCut & Creación",
        tag: "Edición para Redes",
        icon: "🎬",
        color: "var(--color-chart-4)",
        accentBg: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
      },
      {
        key: "Inteligencia Artificial",
        label: "Inteligencia Artificial",
        tag: "ChatGPT & Automatización",
        icon: "🤖",
        color: "var(--color-chart-5)",
        accentBg: "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
      },
      {
        key: "Otros Programas",
        label: "Otros Programas & Talleres",
        tag: "Canva, Finanzas & Eventos",
        icon: "🎓",
        color: "var(--color-chart-5)",
        accentBg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
      },
    ];

    const map = new Map<string, any>();
    for (const p of MAIN_PRODUCTS) {
      map.set(p.key, {
        ...p,
        leads: 0,
        won: 0,
        revenue: 0,
        presencial: 0,
        virtual: 0,
        fullPayment: 0,
        abono: 0,
      });
    }

    for (const l of rangeLeads) {
      const isMain = [
        "Marketing Digital",
        "Excel Profesional",
        "Asistente Contable",
        "Ofimática",
        "CapCut",
        "Inteligencia Artificial",
      ].includes(l.course);
      const key = isMain ? l.course : "Otros Programas";
      const item = map.get(key)!;
      item.leads++;
      if (l.modality === "Presencial") item.presencial++;
      else item.virtual++;

      const isWon = l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won";
      if (isWon) {
        item.won++;
        const paid = Number(l.deposit || l.total || 0);
        item.revenue += paid;
        if (l.paymentStatus === "Pago completo") item.fullPayment++;
        else if (l.paymentStatus === "Abono") item.abono++;
      }
    }

    return Array.from(map.values());
  }, [rangeLeads]);

  // Cuota de ingresos por producto para el gráfico circular
  const productShare = useMemo(() => {
    const totalRev = productMetrics.reduce((s, p) => s + p.revenue, 0);
    return productMetrics.map((p) => {
      const pct = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
      return {
        name: p.label,
        value: pct,
        revenue: p.revenue,
        won: p.won,
        color: p.color,
      };
    });
  }, [productMetrics]);

  // Evolución mensual real de ingresos por curso (histórico completo)
  const monthlyTimeline = useMemo(() => {
    const allWon = allLeads.filter(
      (l) => l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won",
    );
    const buckets = new Map<
      string,
      {
        month: string;
        label: string;
        total: number;
        mrk: number;
        excel: number;
        contable: number;
        otros: number;
        matriculas: number;
      }
    >();

    const MONTH_LABELS = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    for (const l of allWon) {
      const d = l.oppDate || l.date;
      if (!d) continue;
      const m = d.slice(0, 7); // yyyy-mm
      if (!buckets.has(m)) {
        const parts = m.split("-");
        const monthIdx = Number(parts[1]) - 1;
        const label = `${MONTH_LABELS[monthIdx] ?? m} ${parts[0]}`;
        buckets.set(m, {
          month: m,
          label,
          total: 0,
          mrk: 0,
          excel: 0,
          contable: 0,
          otros: 0,
          matriculas: 0,
        });
      }
      const item = buckets.get(m)!;
      const paid = Number(l.deposit || l.total || 0);
      item.total += paid;
      item.matriculas++;
      if (l.course === "Marketing Digital") item.mrk += paid;
      else if (l.course === "Excel Profesional") item.excel += paid;
      else if (l.course === "Asistente Contable") item.contable += paid;
      else item.otros += paid;
    }

    return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [allLeads]);

  // Modalidad global en ventas ganadas
  const wonPresencial = useMemo(
    () => wonLeads.filter((l) => l.modality === "Presencial").length,
    [wonLeads],
  );
  const wonVirtual = useMemo(
    () => wonLeads.filter((l) => l.modality === "Virtual").length,
    [wonLeads],
  );

  // Alumnos inscritos recientemente (últimas ventas ganadas)
  const recentStudents = useMemo(() => {
    return wonLeads.slice(0, 6);
  }, [wonLeads]);

  const conversionRate = rangeLeads.length ? (wonLeads.length / rangeLeads.length) * 100 : 0;

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities", "users"]} />
      <PageHeader
        title="Panel de Cursos y Productos"
        subtitle={`Rendimiento de ventas por producto, matrículas y recaudación · ${range.label.toLowerCase()}`}
        action={
          <div className="flex gap-2">
            <Link to="/advisors">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                🏇 Carrera de Asesores <ChevronRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Superiores con Datos Reales de Ventas de Cursos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ingresos por cursos"
          value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={14.8}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          label="Alumnos matriculados"
          value={wonLeads.length.toLocaleString()}
          delta={9.2}
          icon={GraduationCap}
          accent="accent"
        />
        <KpiCard
          label="Leads interesados"
          value={rangeLeads.length.toLocaleString()}
          delta={12.5}
          icon={Users}
          accent="chart-3"
        />
        <KpiCard
          label="Tasa de cierre global"
          value={`${conversionRate.toFixed(1)}%`}
          delta={2.1}
          icon={Target}
          accent="warning"
        />
      </div>

      {/* SECCIÓN PRINCIPAL: CUADROS DE TUS PRODUCTOS Y CURSOS */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-sm">
              📚
            </span>
            <h3 className="font-display text-base font-bold text-foreground">
              Tus Productos y Cursos Activos
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {productMetrics.reduce((s, p) => s + p.won, 0)} ventas en el período
          </span>
        </div>

        {/* Tarjetas Cuadros de Cada Producto */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productMetrics.map((product) => {
            const prodConvRate = product.leads
              ? ((product.won / product.leads) * 100).toFixed(1)
              : "0.0";
            const revenuePct =
              revenue > 0 ? Math.round((product.revenue / revenue) * 100) : 0;

            return (
              <div
                key={product.key}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                {/* Cabecera del Producto */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ExplainTooltip
                      title={product.label}
                      description={`Métricas de ventas, alumnos matriculados y recaudación del curso ${product.label}.`}
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        title={`Métricas de ventas y alumnos del curso ${product.label}`}
                        className="flex size-10 items-center justify-center rounded-lg bg-muted text-xl shadow-2xs cursor-help transition-transform hover:scale-110"
                      >
                        {product.icon}
                      </span>
                    </ExplainTooltip>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate" title={product.label}>
                        {product.label}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">{product.tag}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                      product.accentBg,
                    )}
                  >
                    {revenuePct}% ventas
                  </span>
                </div>

                {/* Métricas Principales del Curso */}
                <div className="mt-3.5 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Recaudación:</span>
                    <span className="font-display text-lg font-bold text-foreground">
                      ${product.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">Alumnos ganados:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-success" />
                      {product.won} matriculados
                    </span>
                  </div>

                  {/* Desglose de Modalidad */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Modalidad:</span>
                      <span>{product.leads} interesados</span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <ExplainTooltip
                        title="Modalidad Presencial"
                        description="Estudiantes matriculados en clases presenciales en aula física."
                      >
                        <span
                          title="Estudiantes en modalidad Presencial"
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] cursor-help hover:opacity-85 transition-opacity"
                        >
                          <Building2 className="size-3" /> {product.presencial} Presencial
                        </span>
                      </ExplainTooltip>
                      <ExplainTooltip
                        title="Modalidad Virtual"
                        description="Estudiantes matriculados en aulas virtuales o sesiones remotas online en vivo."
                      >
                        <span
                          title="Estudiantes en modalidad Virtual"
                          className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-[11px] cursor-help hover:opacity-85 transition-opacity"
                        >
                          <Laptop className="size-3" /> {product.virtual} Virtual
                        </span>
                      </ExplainTooltip>
                    </div>
                  </div>

                  {/* Desglose de Pagos */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                    <ExplainTooltip
                      title="Pagos Completos"
                      description="Alumnos que cancelaron el valor total del curso de contado en un solo pago."
                    >
                      <span
                        title="Alumnos con pago completo"
                        className="flex items-center gap-1 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                      >
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        <strong>{product.fullPayment}</strong> Pagos completos
                      </span>
                    </ExplainTooltip>
                    <ExplainTooltip
                      title="Abonos Parciales"
                      description="Alumnos inscritos que tienen abonos o anticipos registrados."
                    >
                      <span
                        title="Alumnos con abono registrado"
                        className="flex items-center gap-1 text-muted-foreground cursor-help hover:text-foreground transition-colors"
                      >
                        <CreditCard className="size-3 text-amber-500" />
                        <strong>{product.abono}</strong> Abonos
                      </span>
                    </ExplainTooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILA DE GRÁFICAS: TENDENCIA MENSUAL Y CUOTA POR PRODUCTO */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfica 1: Evolución de Ingresos y Matrículas Reales */}
        <Card
          title="Evolución de ventas por producto"
          subtitle="Ingresos mensuales acumulados por curso ($)"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTimeline}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="mrkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="excelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="contableGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="mrk"
                  name="Marketing Digital"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#mrkGrad)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="excel"
                  name="Excel Profesional"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="url(#excelGrad)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="contable"
                  name="Asistente Contable"
                  stroke="var(--color-chart-3)"
                  strokeWidth={2}
                  fill="url(#contableGrad)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2.5 rounded-full bg-[var(--color-chart-1)]" /> Marketing Digital
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2.5 rounded-full bg-[var(--color-chart-2)]" /> Excel Profesional
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2.5 rounded-full bg-[var(--color-chart-3)]" /> Asistente Contable
            </span>
          </div>
        </Card>

        {/* Gráfica 2: Cuota de Ingresos de tus Productos (Reemplaza Electrónica, Ropa, etc.) */}
        <Card
          title="Participación de tus productos"
          subtitle="Cuota de recaudación por curso"
          icon={Sparkles}
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productShare}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {productShare.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{data.name}</p>
                        <p className="text-muted-foreground">
                          Ingresos: <strong className="text-foreground">${data.revenue.toLocaleString()}</strong> ({data.value}%)
                        </p>
                        <p className="text-muted-foreground">
                          Matrículas: <strong className="text-foreground">{data.won}</strong>
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-1">
            {productShare.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">${c.revenue.toLocaleString()}</span>
                  <span className="font-bold text-foreground font-mono">({c.value}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* FILA INFERIOR: DEMANDA DE MODALIDAD Y ÚLTIMAS MATRÍCULAS */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Demanda de Modalidad por Curso */}
        <Card
          title="Modalidad de Alumnos Matriculados"
          subtitle="Presencial vs Virtual por curso ganado"
          icon={GraduationCap}
          className="lg:col-span-1"
        >
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                <Building2 className="mx-auto size-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                <p className="text-xl font-display font-bold text-foreground">{wonPresencial}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Presencial</p>
              </div>
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-center">
                <Laptop className="mx-auto size-5 text-purple-600 dark:text-purple-400 mb-1" />
                <p className="text-xl font-display font-bold text-foreground">{wonVirtual}</p>
                <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">Virtual / Online</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-foreground">Distribución por producto:</p>
              {productMetrics
                .filter((p) => p.won > 0)
                .map((p) => {
                  const presencialWon = wonLeads.filter(
                    (l) => (l.course === p.key || (p.key === "Otros Programas" && !["Marketing Digital", "Excel Profesional", "Asistente Contable"].includes(l.course))) && l.modality === "Presencial",
                  ).length;
                  const virtualWon = wonLeads.filter(
                    (l) => (l.course === p.key || (p.key === "Otros Programas" && !["Marketing Digital", "Excel Profesional", "Asistente Contable"].includes(l.course))) && l.modality === "Virtual",
                  ).length;
                  const total = presencialWon + virtualWon || 1;
                  const presPct = Math.round((presencialWon / total) * 100);

                  return (
                    <div key={p.key} className="space-y-1 text-xs">
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span className="font-medium text-foreground">{p.label}</span>
                        <span>
                          {presencialWon} pres. / {virtualWon} virt.
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted flex">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${presPct}%` }}
                          title={`Presencial: ${presPct}%`}
                        />
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${100 - presPct}%` }}
                          title={`Virtual: ${100 - presPct}%`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>

        {/* Últimas Matrículas / Alumnos Inscritos (Reemplaza "Pedidos recientes") */}
        <Card
          title="Últimas matrículas de alumnos"
          subtitle="Nuevas inscripciones confirmadas en tus cursos"
          icon={Users}
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {recentStudents.map((lead) => {
              const isFull = lead.paymentStatus === "Pago completo";
              const paid = Number(lead.deposit || lead.total || 0);

              return (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-foreground">
                      {lead.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{lead.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-medium text-primary flex items-center gap-1">
                          <BookOpen className="size-2.5" /> {lead.course || "General"}
                        </span>
                        <span>·</span>
                        <span>{lead.oppDate || lead.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead.modality === "Presencial" ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Building2 className="size-2.5" /> Presencial
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                        <Laptop className="size-2.5" /> Virtual
                      </span>
                    )}

                    {isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Pago completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <CreditCard className="size-3" /> Abono
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-display text-sm font-bold text-foreground">
                      ${paid.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {lead.ownerName || "Asesor"}
                    </p>
                  </div>
                </div>
              );
            })}

            {recentStudents.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin alumnos matriculados en este rango de fechas.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
