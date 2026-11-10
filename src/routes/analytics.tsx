import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle2,
  Users,
  GraduationCap,
  Download,
  BookOpen,
  Building2,
  Laptop,
  CreditCard,
  Share2,
  Flame,
  ArrowUpRight,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { ExplainTooltip } from "@/components/ui/tooltip";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useDashboardQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analíticas de Productos y Cursos — Skipper View" },
      {
        name: "description",
        content: "Embudo de conversión de cursos, fuentes de adquisición, comportamiento de pagos y rendimiento por producto.",
      },
      { property: "og:title", content: "Analíticas de Productos y Cursos — Skipper View" },
      {
        property: "og:description",
        content: "Embudo de conversión de cursos, fuentes de adquisición, comportamiento de pagos y rendimiento por producto.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey || p.name} className="text-muted-foreground flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="font-medium text-foreground">{p.name}:</span>{" "}
          {typeof p.value === "number"
            ? p.name?.toLowerCase().includes("ingreso") || p.name?.toLowerCase().includes("recaud")
              ? `$${p.value.toLocaleString()}`
              : p.value.toLocaleString()
            : p.value}
        </p>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  const { range } = useDateRange();
  const { data: dataset, isPending } = useDashboardQuery();

  const allLeads = dataset?.leads ?? [];

  // Leads filtrados por el rango de fechas seleccionado
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

  const fullPayments = useMemo(
    () => wonLeads.filter((l) => l.paymentStatus === "Pago completo"),
    [wonLeads],
  );
  const depositPayments = useMemo(
    () => wonLeads.filter((l) => l.paymentStatus === "Abono"),
    [wonLeads],
  );

  const totalFullRevenue = useMemo(
    () => fullPayments.reduce((s, l) => s + Number(l.deposit || l.total || 0), 0),
    [fullPayments],
  );
  const totalDepositRevenue = useMemo(
    () => depositPayments.reduce((s, l) => s + Number(l.deposit || l.total || 0), 0),
    [depositPayments],
  );

  // KPIs de analítica
  const conversionRate = rangeLeads.length ? (wonLeads.length / rangeLeads.length) * 100 : 0;
  const avgTicket = wonLeads.length ? revenue / wonLeads.length : 0;
  const fullPaymentRate = wonLeads.length ? (fullPayments.length / wonLeads.length) * 100 : 0;
  const assignedLeads = useMemo(
    () =>
      rangeLeads.filter(
        (l) => l.assignedTo || (l.ownerName && l.ownerName !== "Sin asignar"),
      ),
    [rangeLeads],
  );
  const assignmentRate = rangeLeads.length
    ? (assignedLeads.length / rangeLeads.length) * 100
    : 0;

  // 1. EMBUDO DE CONVERSIÓN REAL (Funnel de Ventas de Cursos)
  const funnelSteps = useMemo(() => {
    const totalCount = rangeLeads.length || 1;
    const contactedCount = rangeLeads.filter(
      (l) =>
        l.status === "Contactado" ||
        l.status === "Calificado" ||
        l.oppStatus?.toLowerCase() === "won",
    ).length;

    return [
      {
        stage: "1. Prospectos Ingresados",
        desc: "Leads interesados en cursos",
        value: rangeLeads.length,
        pct: 100,
        color: "var(--color-chart-1)",
      },
      {
        stage: "2. Asignados a Asesores",
        desc: "Distribuidos a vendedores comerciales",
        value: assignedLeads.length,
        pct: Math.round((assignedLeads.length / totalCount) * 100),
        color: "var(--color-chart-2)",
      },
      {
        stage: "3. En Conversación / Seguimiento",
        desc: "Respuestas y llamadas activas",
        value: contactedCount,
        pct: Math.round((contactedCount / totalCount) * 100),
        color: "var(--color-chart-3)",
      },
      {
        stage: "4. Matrículas Ganadas",
        desc: "Cierres de venta confirmados",
        value: wonLeads.length,
        pct: Number(((wonLeads.length / totalCount) * 100).toFixed(1)),
        color: "var(--color-primary)",
      },
      {
        stage: "5. Pagos Completos Cancelados",
        desc: "Total pagado de contado",
        value: fullPayments.length,
        pct: wonLeads.length
          ? Math.round((fullPayments.length / wonLeads.length) * 100)
          : 0,
        color: "var(--color-success)",
      },
    ];
  }, [rangeLeads, assignedLeads, wonLeads, fullPayments]);

  // 2. RENDIMIENTO POR CANAL / FUENTE DE ADQUISICIÓN
  const channelMetrics = useMemo(() => {
    const channelMap = new Map<
      string,
      { channel: string; leads: number; won: number; revenue: number; color: string }
    >();

    const getChannelGroup = (source: string) => {
      const s = (source || "").toLowerCase();
      if (s.includes("tiktok"))
        return { name: "TikTok Ads", color: "var(--color-chart-5)" };
      if (s.includes("meta") || s.includes("face") || s.includes("ig") || s.includes("insta"))
        return { name: "Meta / Instagram", color: "var(--color-chart-1)" };
      if (s.includes("wp") || s.includes("whats"))
        return { name: "WhatsApp Directo", color: "var(--color-success)" };
      if (s.includes("kommo"))
        return { name: "Base Kommo", color: "var(--color-chart-3)" };
      if (s.includes("web") || s.includes("landing") || s.includes("sitio"))
        return { name: "Web / Landing", color: "var(--color-chart-2)" };
      return { name: "CRM / Base Interna", color: "var(--color-muted-foreground)" };
    };

    for (const l of rangeLeads) {
      const { name, color } = getChannelGroup(l.source);
      if (!channelMap.has(name)) {
        channelMap.set(name, { channel: name, leads: 0, won: 0, revenue: 0, color });
      }
      const item = channelMap.get(name)!;
      item.leads++;

      const isWon = l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won";
      if (isWon) {
        item.won++;
        item.revenue += Number(l.deposit || l.total || 0);
      }
    }

    return Array.from(channelMap.values()).sort((a, b) => b.revenue - a.revenue || b.won - a.won);
  }, [rangeLeads]);

  // 3. ANALÍTICA COMPARATIVA POR PRODUCTO / CURSO
  const productAnalytics = useMemo(() => {
    const MAIN = [
      { key: "Marketing Digital", label: "Marketing Digital", icon: "📱", color: "var(--color-chart-1)" },
      { key: "Excel Profesional", label: "Excel Profesional", icon: "📊", color: "var(--color-chart-2)" },
      { key: "Asistente Contable", label: "Asistente Contable", icon: "💼", color: "var(--color-chart-3)" },
      { key: "Ofimática", label: "Ofimática", icon: "💻", color: "var(--color-chart-4)" },
      { key: "CapCut", label: "CapCut", icon: "🎬", color: "var(--color-chart-5)" },
      { key: "Inteligencia Artificial", label: "Inteligencia Artificial", icon: "🤖", color: "var(--color-accent)" },
      { key: "Otros Programas", label: "Otros Programas & Talleres", icon: "🎓", color: "var(--color-primary)" },
    ];

    const map = new Map<string, any>();
    for (const p of MAIN) {
      map.set(p.key, {
        ...p,
        leads: 0,
        won: 0,
        revenue: 0,
        presencial: 0,
        virtual: 0,
        fullPay: 0,
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
        if (l.paymentStatus === "Pago completo") item.fullPay++;
        else if (l.paymentStatus === "Abono") item.abono++;
      }
    }

    return Array.from(map.values()).map((p) => {
      const conv = p.leads ? ((p.won / p.leads) * 100).toFixed(1) : "0.0";
      const ticket = p.won ? Math.round(p.revenue / p.won) : 0;
      return {
        ...p,
        conversionRate: conv,
        avgTicket: ticket,
      };
    });
  }, [rangeLeads]);

  // 4. EVOLUCIÓN MENSUAL DE MATRÍCULAS Y RECAUDACIÓN
  const monthlyData = useMemo(() => {
    const allWon = allLeads.filter(
      (l) => l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won",
    );
    const buckets = new Map<
      string,
      { month: string; label: string; revenue: number; matriculas: number }
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
      const m = d.slice(0, 7);
      if (!buckets.has(m)) {
        const parts = m.split("-");
        const monthIdx = Number(parts[1]) - 1;
        const label = `${MONTH_LABELS[monthIdx] ?? m} ${parts[0]}`;
        buckets.set(m, { month: m, label, revenue: 0, matriculas: 0 });
      }
      const item = buckets.get(m)!;
      item.revenue += Number(l.deposit || l.total || 0);
      item.matriculas++;
    }

    return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [allLeads]);

  // 5. DISTRIBUCIÓN DE PAGOS: PAGO COMPLETO VS ABONO
  const paymentDistribution = useMemo(() => {
    return [
      {
        name: "Pago completo",
        count: fullPayments.length,
        revenue: totalFullRevenue,
        color: "var(--color-success)",
        pct: wonLeads.length ? Math.round((fullPayments.length / wonLeads.length) * 100) : 0,
      },
      {
        name: "Abono / Anticipo",
        count: depositPayments.length,
        revenue: totalDepositRevenue,
        color: "var(--color-warning)",
        pct: wonLeads.length ? Math.round((depositPayments.length / wonLeads.length) * 100) : 0,
      },
    ];
  }, [fullPayments, depositPayments, totalFullRevenue, totalDepositRevenue, wonLeads]);

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities", "pipelines"]} />
      <PageHeader
        title="Analíticas de Ventas y Productos"
        subtitle={`Rendimiento de embudo, canales de adquisición y recaudación por curso · ${range.label.toLowerCase()}`}
        action={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Exportar métricas
          </Button>
        }
      />

      {/* KPI Cards Superiores de Analítica */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tasa de cierre de leads"
          value={`${conversionRate.toFixed(1)}%`}
          delta={2.4}
          icon={Target}
          accent="primary"
        />
        <KpiCard
          label="Ticket promedio por alumno"
          value={`$${avgTicket.toFixed(0)}`}
          delta={5.7}
          icon={DollarSign}
          accent="accent"
        />
        <KpiCard
          label="Tasa de pago completo"
          value={`${fullPaymentRate.toFixed(0)}%`}
          delta={4.1}
          icon={CheckCircle2}
          accent="chart-3"
        />
        <KpiCard
          label="Eficiencia de asignación"
          value={`${assignmentRate.toFixed(0)}%`}
          delta={8.3}
          icon={TrendingUp}
          accent="warning"
        />
      </div>

      {/* FILA 1: EMBUDO DE CONVERSIÓN & CANALES DE ADQUISICIÓN */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Embudo de Conversión de Alumnos */}
        <Card
          title="Embudo de conversión de cursos"
          subtitle="De prospecto a alumno matriculado con pago"
          icon={Filter}
          className="lg:col-span-2"
        >
          <div className="space-y-4 pt-2">
            {funnelSteps.map((step, idx) => {
              const maxVal = funnelSteps[0].value || 1;
              const barWidth = Math.max(12, Math.round((step.value / maxVal) * 100));

              return (
                <div key={step.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{step.stage}</span>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        ({step.desc})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-foreground">
                        {step.value.toLocaleString()}
                      </strong>
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {idx === 0 ? "100%" : `${step.pct}%`}
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50 p-0.5 border border-border/40">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: step.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="size-3 text-primary animate-pulse" />
              <span>
                Conversión global: <strong>{conversionRate.toFixed(1)}%</strong> de interesados compran un curso.
              </span>
            </span>
            <span>{rangeLeads.length.toLocaleString()} leads en el período</span>
          </div>
        </Card>

        {/* Canales de Adquisición */}
        <Card
          title="Canales de captación"
          subtitle="Rendimiento por fuente de leads"
          icon={Share2}
        >
          <div className="space-y-3.5 pt-1">
            {channelMetrics.slice(0, 5).map((ch) => {
              const chConv = ch.leads ? ((ch.won / ch.leads) * 100).toFixed(1) : "0.0";

              return (
                <div key={ch.channel} className="rounded-lg border border-border/70 bg-muted/20 p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: ch.color }} />
                      {ch.channel}
                    </span>
                    <span className="font-display font-bold text-foreground">
                      ${ch.revenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{ch.leads.toLocaleString()} leads</span>
                    <span className="text-foreground font-medium">
                      {ch.won} matriculados ({chConv}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* FILA 2: EFICIENCIA POR PRODUCTO / CURSO Y COMPORTAMIENTO DE PAGOS */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Rendimiento Comparativo de Cada Producto */}
        <Card
          title="Eficiencia por producto / curso"
          subtitle="Tasa de cierre, alumnos e ingresos por programa"
          icon={BookOpen}
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="pb-2.5 font-medium">Producto / Curso</th>
                  <th className="pb-2.5 font-medium text-center">Interesados</th>
                  <th className="pb-2.5 font-medium text-center">Matrículas</th>
                  <th className="pb-2.5 font-medium text-center">Tasa Cierre</th>
                  <th className="pb-2.5 font-medium text-center">Ticket Prom.</th>
                  <th className="pb-2.5 font-medium text-right">Recaudación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {productAnalytics.map((p) => (
                  <tr key={p.key} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <ExplainTooltip
                          title={p.label}
                          description={`Métricas y tasa de cierre del curso ${p.label}.`}
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            title={`Métricas de ${p.label}`}
                            className="flex size-7 items-center justify-center rounded-lg bg-muted text-sm shadow-2xs cursor-help transition-transform hover:scale-110"
                          >
                            {p.icon}
                          </span>
                        </ExplainTooltip>
                        <div>
                          <p className="font-semibold text-foreground">{p.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.presencial} Presencial · {p.virtual} Virtual
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center text-muted-foreground font-mono">
                      {p.leads.toLocaleString()}
                    </td>
                    <td className="py-3 text-center font-bold text-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                        {p.won}
                      </span>
                    </td>
                    <td className="py-3 text-center font-semibold text-success font-mono">
                      {p.conversionRate}%
                    </td>
                    <td className="py-3 text-center text-foreground font-mono font-medium">
                      ${p.avgTicket}
                    </td>
                    <td className="py-3 text-right font-display font-bold text-foreground text-sm">
                      ${p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Comportamiento de Pagos: Pago Completo vs Abono */}
        <Card
          title="Comportamiento de pagos"
          subtitle="Distribución entre pago completo y abonos"
          icon={CreditCard}
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentDistribution}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {paymentDistribution.map((entry) => (
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
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{d.name}</p>
                        <p className="text-muted-foreground">
                          Alumnos: <strong className="text-foreground">{d.count}</strong> ({d.pct}%)
                        </p>
                        <p className="text-muted-foreground">
                          Recaudación: <strong className="text-foreground">${d.revenue.toLocaleString()}</strong>
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-border/60">
            {paymentDistribution.map((pay) => (
              <div key={pay.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: pay.color }} />
                  <span className="text-muted-foreground">{pay.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{pay.count} ventas</span>
                  <span className="font-mono text-muted-foreground">(${pay.revenue.toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* FILA 3: EVOLUCIÓN HISTÓRICA DE RECAUDACIÓN Y MATRÍCULAS */}
      <div className="mt-6">
        <Card
          title="Histórico de facturación y matrículas por mes"
          subtitle="Crecimiento de ingresos recaudados y alumnos ganados"
          icon={TrendingUp}
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.05} />
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
                  dataKey="revenue"
                  name="Ingresos recaudados"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#analyticsRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>
              Total histórico recaudado:{" "}
              <strong className="text-foreground">
                ${monthlyData.reduce((s, m) => s + m.revenue, 0).toLocaleString()}
              </strong>
            </span>
            <span>
              Total histórico de alumnos:{" "}
              <strong className="text-foreground">
                {monthlyData.reduce((s, m) => s + m.matriculas, 0)} matrículas
              </strong>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
