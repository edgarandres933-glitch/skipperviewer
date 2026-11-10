import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
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
  Layers,
  DollarSign,
  GraduationCap,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  CreditCard,
  Building2,
  Laptop,
  Download,
  BookOpen,
  Award,
  Search,
  ChevronRight,
  ArrowUpRight,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Clock,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { ExplainTooltip } from "@/components/ui/tooltip";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useDashboardQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportConsolidadosToExcel, exportSingleCourseToExcel } from "@/lib/export-excel";

export const Route = createFileRoute("/consolidados")({
  head: () => ({
    meta: [
      { title: "Consolidados por Curso — Skipper View" },
      {
        name: "description",
        content: "Reporte financiero y académico consolidado separando por cursos, modalidades, recaudación y saldos pendientes.",
      },
      { property: "og:title", content: "Consolidados por Curso — Skipper View" },
      {
        property: "og:description",
        content: "Reporte financiero y académico consolidado separando por cursos, modalidades, recaudación y saldos pendientes.",
      },
    ],
  }),
  component: ConsolidadosPage,
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
            ? p.name?.toLowerCase().includes("recaud") ||
              p.name?.toLowerCase().includes("saldo") ||
              p.name?.toLowerCase().includes("factur") ||
              p.name?.toLowerCase().includes("ingres")
              ? `$${p.value.toLocaleString()}`
              : p.value.toLocaleString()
            : p.value}
        </p>
      ))}
    </div>
  );
}

const KNOWN_COURSES = [
  {
    key: "Marketing Digital",
    label: "Marketing Digital",
    tag: "Redes, Meta & TikTok Ads",
    icon: "📱",
    color: "var(--color-chart-1)",
    accentBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "Excel Profesional",
    label: "Excel Profesional",
    tag: "Básico a Avanzado & Fórmulas",
    icon: "📊",
    color: "var(--color-chart-2)",
    accentBg: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
  },
  {
    key: "Asistente Contable",
    label: "Asistente Contable",
    tag: "Contabilidad, Nómina & Tributación",
    icon: "💼",
    color: "var(--color-chart-3)",
    accentBg: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
  {
    key: "Ofimática",
    label: "Ofimática Profesional",
    tag: "Word, Excel, PowerPoint & Oficina",
    icon: "💻",
    color: "var(--color-chart-2)",
    accentBg: "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400",
  },
  {
    key: "CapCut",
    label: "CapCut & Creación de Video",
    tag: "Edición Dinámica para Redes Sociales",
    icon: "🎬",
    color: "var(--color-chart-4)",
    accentBg: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
  },
  {
    key: "Inteligencia Artificial",
    label: "Inteligencia Artificial (IA)",
    tag: "ChatGPT, Prompts & Automatización",
    icon: "🤖",
    color: "var(--color-chart-5)",
    accentBg: "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
  },
  {
    key: "Canva & Diseño",
    label: "Canva & Diseño Digital",
    tag: "Creatividad & Marca Visual",
    icon: "🎨",
    color: "var(--color-chart-4)",
    accentBg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  },
  {
    key: "Finanzas Prácticas",
    label: "Finanzas & Gestión",
    tag: "Presupuestos & Rentabilidad",
    icon: "🪙",
    color: "var(--color-chart-3)",
    accentBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
  },
  {
    key: "Otros Programas",
    label: "Otros Programas & Talleres",
    tag: "Cursos cortos y eventos especiales",
    icon: "🎓",
    color: "var(--color-primary)",
    accentBg: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
  },
];

function ConsolidadosPage() {
  const { range } = useDateRange();
  const { data: dataset, isPending } = useDashboardQuery();
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>("Marketing Digital");
  const [studentSearch, setStudentSearch] = useState("");

  const allLeads = dataset?.leads ?? [];

  // Filtrado por rango de fechas
  const rangeLeads = useMemo(
    () => allLeads.filter((l) => inRange(l.oppDate || l.date, range.start, range.end)),
    [allLeads, range.start, range.end],
  );

  // Alumnos en estado Ganado en el período
  const wonLeads = useMemo(
    () =>
      rangeLeads.filter(
        (l) => l.status === "Calificado" || l.oppStatus?.toLowerCase() === "won",
      ),
    [rangeLeads],
  );

  // CONSOLIDACIÓN CENTRAL POR CURSO
  const consolidatedByCourse = useMemo(() => {
    const courseMap = new Map<string, any>();

    // Inicializamos con los cursos conocidos
    for (const c of KNOWN_COURSES) {
      courseMap.set(c.key, {
        ...c,
        totalLeads: 0,
        wonLeads: 0,
        revenue: 0,
        saldoPendiente: 0,
        projectedRevenue: 0,
        presencial: 0,
        virtual: 0,
        fullPayment: 0,
        abono: 0,
        advisors: new Map<string, { name: string; won: number; revenue: number }>(),
        channels: new Map<string, { name: string; won: number; revenue: number }>(),
        students: [] as any[],
      });
    }

    const resolveKey = (courseName: string) => {
      const c = (courseName || "").toLowerCase();
      if (c.includes("marketing") || c.includes("mrk") || c.includes("tiktok")) return "Marketing Digital";
      if (c.includes("excel")) return "Excel Profesional";
      if (c.includes("contable") || c.includes("asistent")) return "Asistente Contable";
      if (c.includes("ofimat") || c.includes("office") || c.includes("word")) return "Ofimática";
      if (c.includes("capcut") || c.includes("video") || c.includes("edicion") || c.includes("edición")) return "CapCut";
      if (
        c.includes("inteligencia") ||
        c.includes("artificial") ||
        c.includes("chatgpt") ||
        c.includes(" ia") ||
        c.startsWith("ia") ||
        c.includes("ai")
      )
        return "Inteligencia Artificial";
      if (c.includes("canva")) return "Canva & Diseño";
      if (c.includes("finanz")) return "Finanzas Prácticas";
      return "Otros Programas";
    };

    // 1. Contabilizamos leads interesados
    for (const l of rangeLeads) {
      const key = resolveKey(l.course);
      const item = courseMap.get(key) || courseMap.get("Otros Programas")!;
      item.totalLeads++;
    }

    // 2. Contabilizamos y consolidamos alumnos ganados, recaudación y saldos
    for (const l of wonLeads) {
      const key = resolveKey(l.course);
      const item = courseMap.get(key) || courseMap.get("Otros Programas")!;

      item.wonLeads++;

      const paid = Number(l.deposit || l.total || 0);
      const saldo = Number(l.saldo || 0);
      const totalCourseVal = Number(l.total || paid + saldo || 0);

      item.revenue += paid;
      item.saldoPendiente += saldo;
      item.projectedRevenue += totalCourseVal;

      if (l.modality === "Presencial") item.presencial++;
      else item.virtual++;

      if (l.paymentStatus === "Pago completo") item.fullPayment++;
      else item.abono++;

      // Agrupación por asesor en este curso
      const advName = l.ownerName || "Sin asignar";
      if (!item.advisors.has(advName)) {
        item.advisors.set(advName, { name: advName, won: 0, revenue: 0 });
      }
      const advStat = item.advisors.get(advName)!;
      advStat.won++;
      advStat.revenue += paid;

      // Agrupación por canal publicitario en este curso
      const chName = l.source || "Directo / CRM";
      if (!item.channels.has(chName)) {
        item.channels.set(chName, { name: chName, won: 0, revenue: 0 });
      }
      const chStat = item.channels.get(chName)!;
      chStat.won++;
      chStat.revenue += paid;

      // Listado individual de alumnos
      item.students.push({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        date: l.oppDate || l.date,
        advisor: advName,
        source: chName,
        modality: l.modality,
        paymentStatus: l.paymentStatus,
        paid,
        saldo,
        total: totalCourseVal,
      });
    }

    // Convertir Maps internos a listas y calcular métricas derivadas
    return Array.from(courseMap.values()).map((c) => {
      const convRate = c.totalLeads ? ((c.wonLeads / c.totalLeads) * 100).toFixed(1) : "0.0";
      const avgTicket = c.wonLeads ? Math.round(c.revenue / c.wonLeads) : 0;
      const advisorsList = Array.from(c.advisors.values()).sort((a: any, b: any) => b.revenue - a.revenue);
      const channelsList = Array.from(c.channels.values()).sort((a: any, b: any) => b.revenue - a.revenue);

      return {
        ...c,
        convRate,
        avgTicket,
        advisorsList,
        channelsList,
      };
    });
  }, [rangeLeads, wonLeads]);

  // TOTALES GENERALES CONSOLIDADOS
  const grandTotal = useMemo(() => {
    return consolidatedByCourse.reduce(
      (acc, c) => ({
        totalLeads: acc.totalLeads + c.totalLeads,
        wonLeads: acc.wonLeads + c.wonLeads,
        revenue: acc.revenue + c.revenue,
        saldoPendiente: acc.saldoPendiente + c.saldoPendiente,
        projectedRevenue: acc.projectedRevenue + c.projectedRevenue,
        presencial: acc.presencial + c.presencial,
        virtual: acc.virtual + c.virtual,
        fullPayment: acc.fullPayment + c.fullPayment,
        abono: acc.abono + c.abono,
      }),
      {
        totalLeads: 0,
        wonLeads: 0,
        revenue: 0,
        saldoPendiente: 0,
        projectedRevenue: 0,
        presencial: 0,
        virtual: 0,
        fullPayment: 0,
        abono: 0,
      },
    );
  }, [consolidatedByCourse]);

  const globalConversion = grandTotal.totalLeads
    ? ((grandTotal.wonLeads / grandTotal.totalLeads) * 100).toFixed(1)
    : "0.0";

  // Curso actualmente seleccionado para inspeccionar su ficha consolidada
  const activeCourse = useMemo(() => {
    return (
      consolidatedByCourse.find((c) => c.key === selectedCourseKey) ||
      consolidatedByCourse[0]
    );
  }, [consolidatedByCourse, selectedCourseKey]);

  // Alumnos del curso seleccionado filtrados por el buscador
  const activeCourseStudents = useMemo(() => {
    if (!activeCourse) return [];
    const q = studentSearch.toLowerCase().trim();
    if (!q) return activeCourse.students;
    return activeCourse.students.filter(
      (s: any) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.advisor.toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q) ||
        s.modality.toLowerCase().includes(q) ||
        s.paymentStatus.toLowerCase().includes(q),
    );
  }, [activeCourse, studentSearch]);

  // Datos para la gráfica de barras de Facturación Recaudada vs Saldo por Cobrar
  const barChartData = useMemo(() => {
    return consolidatedByCourse
      .filter((c) => c.wonLeads > 0 || c.totalLeads > 0)
      .map((c) => ({
        name: c.label.split(" ")[0], // Nombre corto para eje X
        fullName: c.label,
        recaudado: c.revenue,
        saldo: c.saldoPendiente,
        total: c.projectedRevenue,
        alumnos: c.wonLeads,
      }));
  }, [consolidatedByCourse]);

  // Datos para la gráfica de dona (PieChart de cuota de ingresos)
  const pieChartData = useMemo(() => {
    const totalRev = grandTotal.revenue || 1;
    return consolidatedByCourse
      .filter((c) => c.revenue > 0)
      .map((c) => ({
        name: c.label,
        value: c.revenue,
        pct: Math.round((c.revenue / totalRev) * 100),
        color: c.color,
        alumnos: c.wonLeads,
      }));
  }, [consolidatedByCourse, grandTotal.revenue]);

  const [isExporting, setIsExporting] = useState(false);

  // Función de exportación a Excel (.xlsx) con hojas múltiples
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportConsolidadosToExcel({
        courses: consolidatedByCourse,
        grandTotal,
        globalConversion,
        dateRangeLabel: range.label,
      });
      toast.success("Consolidado exportado a Excel (.xlsx) correctamente", {
        description: "Se han incluido hojas de resumen, alumnos, asesores y canales.",
      });
    } catch (err) {
      console.error("Error al exportar a Excel:", err);
      toast.error("Ocurrió un error al generar el archivo Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Función de exportación a Excel para un curso específico
  const handleExportSingleCourse = async (course: any) => {
    try {
      await exportSingleCourseToExcel({
        course,
        dateRangeLabel: range.label,
      });
      toast.success(`Alumnos de ${course.label} exportados a Excel (.xlsx)`);
    } catch (err) {
      console.error("Error al exportar alumnos de curso:", err);
      toast.error("Ocurrió un error al generar el archivo Excel");
    }
  };

  // Función de exportación a CSV
  const handleExportCsv = () => {
    const headers = [
      "Curso",
      "Interesados (Leads)",
      "Matriculados (Ganados)",
      "Tasa Cierre (%)",
      "Recaudacion ($)",
      "Saldo Pendiente ($)",
      "Facturacion Total ($)",
      "Ticket Promedio ($)",
      "Presencial",
      "Virtual",
      "Pagos Completos",
      "Abonos",
    ];

    const rows = consolidatedByCourse.map((c) => [
      `"${c.label}"`,
      c.totalLeads,
      c.wonLeads,
      `"${c.convRate}%"`,
      c.revenue,
      c.saldoPendiente,
      c.projectedRevenue,
      c.avgTicket,
      c.presencial,
      c.virtual,
      c.fullPayment,
      c.abono,
    ]);

    // Fila total
    rows.push([
      '"TOTAL CONSOLIDADO"',
      grandTotal.totalLeads,
      grandTotal.wonLeads,
      `"${globalConversion}%"`,
      grandTotal.revenue,
      grandTotal.saldoPendiente,
      grandTotal.projectedRevenue,
      grandTotal.wonLeads ? Math.round(grandTotal.revenue / grandTotal.wonLeads) : 0,
      grandTotal.presencial,
      grandTotal.virtual,
      grandTotal.fullPayment,
      grandTotal.abono,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `consolidado_cursos_${range.start || "periodo"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities", "pipelines"]} />
      <PageHeader
        title="Consolidados por Curso"
        subtitle={`Reporte financiero, académico y operativo consolidado por programa de formación · ${range.label.toLowerCase()}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              size="sm"
              className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <FileSpreadsheet className="size-4" />
              <span>{isExporting ? "Generando..." : "Exportar a Excel (.xlsx)"}</span>
            </Button>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              title="Descargar reporte en formato CSV"
            >
              <Download className="size-3.5" /> CSV
            </Button>
          </div>
        }
      />

      {/* KPI Cards Superiores Consolidados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Recaudación cobrada"
          value={`$${grandTotal.revenue.toLocaleString()}`}
          delta={14.8}
          icon={DollarSign}
          accent="primary"
          tooltip="Total recaudado en dólares ($) cobrado efectivamente en pagos completos y abonos."
        />
        <KpiCard
          label="Saldo por cobrar"
          value={`$${grandTotal.saldoPendiente.toLocaleString()}`}
          delta={-4.2}
          icon={CreditCard}
          accent="warning"
          tooltip="Monto pendiente por cobrar a los estudiantes que formalizaron su matrícula con abono o anticipo parcial."
        />
        <KpiCard
          label="Facturación proyectada"
          value={`$${grandTotal.projectedRevenue.toLocaleString()}`}
          delta={11.5}
          icon={TrendingUp}
          accent="accent"
          tooltip="Suma total proyectada: Recaudación cobrada hoy + saldo pendiente por cobrar de todos los cursos."
        />
        <KpiCard
          label="Alumnos matriculados"
          value={grandTotal.wonLeads.toLocaleString()}
          delta={9.2}
          icon={GraduationCap}
          accent="chart-3"
          tooltip="Total consolidado de alumnos que completaron su proceso de inscripción en estado Ganado."
        />
      </div>

      {/* SECCIÓN 1: TABLA MAESTRA CONSOLIDADA SEPARANDO POR CURSOS */}
      <div className="mt-6">
        <Card
          title="Consolidado General por Curso"
          subtitle="Desglose comparativo de captación, matrículas, dinero recaudado, saldos por cobrar y modalidades"
          icon={Layers}
          action={
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
              title="Descargar la tabla consolidada en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Exportar Excel</span>
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/70 text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Programa / Curso</th>
                  <th className="pb-3 font-medium text-center">Interesados</th>
                  <th className="pb-3 font-medium text-center">Matriculados</th>
                  <th className="pb-3 font-medium text-center">Tasa Cierre</th>
                  <th className="pb-3 font-medium text-right">Recaudado ($)</th>
                  <th className="pb-3 font-medium text-right text-amber-600 dark:text-amber-400">
                    Saldo x Cobrar
                  </th>
                  <th className="pb-3 font-medium text-right">Total Facturado</th>
                  <th className="pb-3 font-medium text-center">Ticket Prom.</th>
                  <th className="pb-3 font-medium text-center">Modalidad</th>
                  <th className="pb-3 font-medium text-center">Tipo de Pago</th>
                  <th className="pb-3 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {consolidatedByCourse.map((c) => {
                  const isSelected = selectedCourseKey === c.key;

                  return (
                    <tr
                      key={c.key}
                      onClick={() => setSelectedCourseKey(c.key)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40",
                        isSelected && "bg-primary/10 hover:bg-primary/15 font-semibold",
                      )}
                    >
                      {/* Nombre del curso con icono */}
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2.5">
                          <ExplainTooltip
                            title={c.label}
                            description={`Resumen consolidado del curso ${c.label}. Haz clic para ver el expediente detallado.`}
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base shadow-2xs cursor-help transition-transform hover:scale-110"
                            >
                              {c.icon}
                            </span>
                          </ExplainTooltip>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-xs">{c.label}</p>
                            <p className="text-[10px] text-muted-foreground">{c.tag}</p>
                          </div>
                        </div>
                      </td>

                      {/* Leads Interesados */}
                      <td className="py-3.5 text-center font-mono text-muted-foreground">
                        {c.totalLeads.toLocaleString()}
                      </td>

                      {/* Alumnos Matriculados Ganados */}
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-primary font-bold font-mono">
                          <CheckCircle2 className="size-3 text-primary" />
                          {c.wonLeads}
                        </span>
                      </td>

                      {/* Tasa de Cierre */}
                      <td className="py-3.5 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {c.convRate}%
                      </td>

                      {/* Dinero Recaudado Cobrado */}
                      <td className="py-3.5 text-right font-display font-bold text-foreground text-sm">
                        ${c.revenue.toLocaleString()}
                      </td>

                      {/* Saldo Pendiente por Cobrar */}
                      <td className="py-3.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {c.saldoPendiente > 0 ? `$${c.saldoPendiente.toLocaleString()}` : "—"}
                      </td>

                      {/* Facturación Total Proyectada */}
                      <td className="py-3.5 text-right font-display font-bold text-foreground">
                        ${c.projectedRevenue.toLocaleString()}
                      </td>

                      {/* Ticket Promedio */}
                      <td className="py-3.5 text-center font-mono text-muted-foreground">
                        ${c.avgTicket}
                      </td>

                      {/* Modalidad: Presencial vs Virtual */}
                      <td className="py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Building2 className="size-3" /> {c.presencial}
                          </span>
                          <span className="text-muted-foreground/60">/</span>
                          <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-medium">
                            <Laptop className="size-3" /> {c.virtual}
                          </span>
                        </div>
                      </td>

                      {/* Pagos: Completo vs Abonos */}
                      <td className="py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            {c.fullPayment} comp.
                          </span>
                          <span className="text-muted-foreground/60">/</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                            {c.abono} abon.
                          </span>
                        </div>
                      </td>

                      {/* Acción para seleccionar */}
                      <td className="py-3.5 text-center">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-6 px-2.5 text-[10px] gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseKey(c.key);
                          }}
                        >
                          {isSelected ? "Seleccionado" : "Ver ficha"}
                          <ChevronRight className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Fila Final: Total Consolidado */}
              <tfoot>
                <tr className="border-t-2 border-border font-bold text-xs bg-muted/30 text-foreground">
                  <td className="py-3.5 pl-2 font-display text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-4 text-primary" />
                    TOTAL CONSOLIDADO
                  </td>
                  <td className="py-3.5 text-center font-mono">{grandTotal.totalLeads.toLocaleString()}</td>
                  <td className="py-3.5 text-center font-mono text-primary text-sm">
                    {grandTotal.wonLeads.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-center font-mono text-emerald-600 dark:text-emerald-400">
                    {globalConversion}%
                  </td>
                  <td className="py-3.5 text-right font-display text-base text-foreground font-extrabold">
                    ${grandTotal.revenue.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                    ${grandTotal.saldoPendiente.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-right font-display text-base text-foreground font-extrabold">
                    ${grandTotal.projectedRevenue.toLocaleString()}
                  </td>
                  <td className="py-3.5 text-center font-mono">
                    ${grandTotal.wonLeads ? Math.round(grandTotal.revenue / grandTotal.wonLeads) : 0}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="text-emerald-600 font-semibold">{grandTotal.presencial} pres.</span> /{" "}
                    <span className="text-purple-600 font-semibold">{grandTotal.virtual} virt.</span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="text-emerald-600 font-semibold">{grandTotal.fullPayment} comp.</span> /{" "}
                    <span className="text-amber-600 font-semibold">{grandTotal.abono} abon.</span>
                  </td>
                  <td className="py-3.5 text-center text-muted-foreground text-[10px]">Consolidado</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* SECCIÓN 2: GRÁFICOS CONSOLIDADOS COMPARATIVOS */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico 1: Facturación Recaudada vs Saldo por Cobrar */}
        <Card
          title="Distribución de Facturación por Curso"
          subtitle="Comparativa de dinero cobrado y cuentas por cobrar ($)"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="name"
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
                <Bar
                  dataKey="recaudado"
                  name="Recaudado Cobrado"
                  fill="var(--color-primary)"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="saldo"
                  name="Saldo Pendiente por Cobrar"
                  fill="var(--color-warning)"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-6 border-t border-border/60 pt-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-3 rounded-sm bg-primary" /> Recaudación Cobrada Efectiva
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-3 rounded-sm bg-warning" /> Saldo Pendiente por Cobrar (Abonos)
            </span>
          </div>
        </Card>

        {/* Gráfico 2: Cuota de Ingresos Consolidados */}
        <Card
          title="Cuota de Ingresos Consolidados"
          subtitle="Aporte de cada curso al total de ingresos"
          icon={BookOpen}
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {pieChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="var(--color-card)" strokeWidth={2} />
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
                          Recaudación: <strong className="text-foreground">${d.value.toLocaleString()}</strong> ({d.pct}%)
                        </p>
                        <p className="text-muted-foreground">
                          Matriculados: <strong className="text-foreground">{d.alumnos} alumnos</strong>
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-1">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">${item.value.toLocaleString()}</span>
                  <span className="font-mono font-bold text-foreground text-[11px]">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SECCIÓN 3: EXPEDIENTE / FICHA CONSOLIDADA DEL CURSO SELECCIONADO */}
      <div className="mt-6">
        {/* Selector de Pestañas de Cursos */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="size-3.5" /> Ver consolidado de:
          </span>
          {consolidatedByCourse.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCourseKey(c.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
                selectedCourseKey === c.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                  : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="rounded-full bg-background/50 px-1.5 py-0.2 text-[10px] font-mono">
                {c.wonLeads}
              </span>
            </button>
          ))}
        </div>

        {/* Tarjeta Detallada del Curso Seleccionado */}
        <Card
          title={`Expediente Consolidado: ${activeCourse.label}`}
          subtitle={`Rendimiento financiero, desglose de modalidades, asesores y lista de alumnos inscritos en este programa`}
          icon={Award}
          action={
            <Button
              onClick={() => handleExportSingleCourse(activeCourse)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium"
              title={`Exportar expediente y alumnos de ${activeCourse.label} a Excel`}
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Exportar {activeCourse.label} (.xlsx)</span>
            </Button>
          }
        >
          {/* Métricas del Curso */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 border-b border-border/60 pb-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Recaudación Cobrada</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                ${activeCourse.revenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ticket promedio: <strong>${activeCourse.avgTicket}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Saldo Pendiente x Cobrar</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                ${activeCourse.saldoPendiente.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                En {activeCourse.abono} alumnos con abono
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Alumnos Matriculados</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                {activeCourse.wonLeads} alumnos
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                De {activeCourse.totalLeads} prospectos ({activeCourse.convRate}% cierre)
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Modalidad & Pagos</p>
              <div className="mt-1 space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-emerald-600 dark:text-emerald-400">🏫 {activeCourse.presencial} Presencial</span>
                  <span className="text-purple-600 dark:text-purple-400">💻 {activeCourse.virtual} Virtual</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{activeCourse.fullPayment} Contado</span>
                  <span>{activeCourse.abono} Abonos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Filas: Asesores y Canales que venden este curso */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 border-b border-border/60 pb-5">
            {/* Asesores más destacados en este curso */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
              <h5 className="font-semibold text-xs text-foreground mb-2 flex items-center gap-1.5">
                <Award className="size-3.5 text-primary" /> Vendedores con más cierres en este curso:
              </h5>
              <div className="space-y-2">
                {activeCourse.advisorsList.slice(0, 4).map((adv: any) => (
                  <div key={adv.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium truncate max-w-[180px]">
                      {adv.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[11px] font-bold text-primary">
                        {adv.won} {adv.won === 1 ? "venta" : "ventas"}
                      </span>
                      <span className="font-mono text-foreground font-semibold">
                        ${adv.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {activeCourse.advisorsList.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin registros de asesores en el período.</p>
                )}
              </div>
            </div>

            {/* Canales que más prospectos ganados aportaron a este curso */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5">
              <h5 className="font-semibold text-xs text-foreground mb-2 flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-emerald-500" /> Canales de captación para este curso:
              </h5>
              <div className="space-y-2">
                {activeCourse.channelsList.slice(0, 4).map((ch: any) => (
                  <div key={ch.name} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium truncate max-w-[180px]">
                      {ch.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {ch.won} alumnos
                      </span>
                      <span className="font-mono text-foreground font-semibold">
                        ${ch.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {activeCourse.channelsList.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sin fuentes registradas en el período.</p>
                )}
              </div>
            </div>
          </div>

          {/* Listado Detallado de Alumnos de este Curso */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                <h5 className="font-semibold text-xs text-foreground">
                  Alumnos Inscritos en {activeCourse.label} ({activeCourseStudents.length})
                </h5>
              </div>

              {/* Botón de exportar alumnos de este curso + Buscador */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleExportSingleCourse(activeCourse)}
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30"
                  title={`Exportar listado de alumnos de ${activeCourse.label} a Excel`}
                >
                  <FileSpreadsheet className="size-3.5" />
                  <span>Exportar Alumnos ({activeCourse.label})</span>
                </Button>

                {/* Buscador dentro del curso */}
                <div className="relative min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Buscar alumno, asesor, estado..."
                    className="h-8 w-full rounded-md border border-input bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
                    <th className="py-2.5 px-3 font-medium">Alumno</th>
                    <th className="py-2.5 px-3 font-medium">Fecha</th>
                    <th className="py-2.5 px-3 font-medium">Modalidad</th>
                    <th className="py-2.5 px-3 font-medium">Asesor Comercial</th>
                    <th className="py-2.5 px-3 font-medium">Tipo de Pago</th>
                    <th className="py-2.5 px-3 font-medium text-right">Recaudado</th>
                    <th className="py-2.5 px-3 font-medium text-right">Saldo Pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {activeCourseStudents.map((st: any) => (
                    <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <p className="font-semibold">{st.name}</p>
                        <p className="text-[10px] text-muted-foreground">{st.email || st.phone || "—"}</p>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {st.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                            st.modality === "Presencial"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
                          )}
                        >
                          {st.modality === "Presencial" ? <Building2 className="size-3" /> : <Laptop className="size-3" />}
                          {st.modality}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {st.advisor}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                            st.paymentStatus === "Pago completo"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {st.paymentStatus === "Pago completo" ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <CreditCard className="size-3" />
                          )}
                          {st.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        ${st.paid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {st.saldo > 0 ? `$${st.saldo.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                  {activeCourseStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                        No se encontraron alumnos para este curso en el período seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
