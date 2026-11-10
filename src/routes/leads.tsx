import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Tag,
  UsersRound,
  TrendingUp,
  Mail,
  Phone,
  Filter,
  Loader2,
  Share2,
  CheckCircle2,
  X,
  Sparkles,
  GraduationCap,
  BookOpen,
  Megaphone,
  Target,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, Card } from "@/components/dashboard";
import { ExplainTooltip } from "@/components/ui/tooltip";
import { DataSourceBanner } from "@/components/data-source-banner";
import { useLeadsQuery } from "@/lib/ghl-hooks";
import { useDateRange, inRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Skipper View" },
      {
        name: "description",
        content: "Tabla de leads con desglose de fuentes de captación, etiquetas y rango de fechas.",
      },
      { property: "og:title", content: "Leads — Skipper View" },
      {
        property: "og:description",
        content: "Tabla de leads con desglose de fuentes de captación, etiquetas y rango de fechas.",
      },
    ],
  }),
  component: LeadsPage,
});

function getSourceVisual(sourceName: string) {
  const s = sourceName.toLowerCase();
  if (s.includes("meta") || s.includes("face") || s.includes("ig") || s.includes("insta")) {
    return {
      icon: "📱",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      barColor: "bg-blue-500",
      desc: "Anuncios y campañas de Facebook / Instagram",
    };
  }
  if (s.includes("tiktok")) {
    return {
      icon: "🎵",
      badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
      barColor: "bg-pink-500",
      desc: "Tráfico publicitario y conversiones desde TikTok",
    };
  }
  if (s.includes("whats") || s.includes("wp")) {
    return {
      icon: "💬",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      barColor: "bg-emerald-500",
      desc: "Chat directo y prospectos recibidos por WhatsApp",
    };
  }
  if (s.includes("kommo")) {
    return {
      icon: "🗂️",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      barColor: "bg-amber-500",
      desc: "Prospectos sincronizados o migrados desde Kommo CRM",
    };
  }
  if (s.includes("web") || s.includes("landing") || s.includes("sitio") || s.includes("form")) {
    return {
      icon: "🌐",
      badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
      barColor: "bg-sky-500",
      desc: "Formularios web y páginas de captura de cursos",
    };
  }
  if (s.includes("refer") || s.includes("recom")) {
    return {
      icon: "🤝",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      barColor: "bg-purple-500",
      desc: "Recomendaciones y referidos de alumnos actuales",
    };
  }
  return {
    icon: "📋",
    badgeClass: "bg-muted text-muted-foreground border-border",
    barColor: "bg-primary",
    desc: "Canal interno o fuente general del CRM",
  };
}

function getCourseVisual(courseName: string) {
  const c = courseName.toLowerCase();
  if (c.includes("market") || c.includes("mrk") || c.includes("tiktok")) {
    return {
      icon: "🚀",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      barColor: "bg-blue-500",
      desc: "Programa de Marketing Digital, Redes Sociales y Estrategia Comercial",
    };
  }
  if (c.includes("excel")) {
    return {
      icon: "📊",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      barColor: "bg-emerald-500",
      desc: "Curso de Excel Profesional, Tablas Dinámicas y Automatización",
    };
  }
  if (c.includes("contab") || c.includes("asistent")) {
    return {
      icon: "📑",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      barColor: "bg-amber-500",
      desc: "Formación de Asistente Contable, Tributario y Facturación",
    };
  }
  if (c.includes("ofimat") || c.includes("office") || c.includes("word")) {
    return {
      icon: "💻",
      badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
      barColor: "bg-teal-500",
      desc: "Curso de Ofimática Profesional: Word, Excel, PowerPoint y Productividad",
    };
  }
  if (c.includes("capcut") || c.includes("video") || c.includes("edicion") || c.includes("edición")) {
    return {
      icon: "🎬",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      barColor: "bg-rose-500",
      desc: "Edición y Creación de Video con CapCut para Redes Sociales y Contenido Viral",
    };
  }
  if (
    c.includes("inteligencia") ||
    c.includes("artificial") ||
    c.includes("chatgpt") ||
    c.includes(" ia") ||
    c.startsWith("ia") ||
    c.includes("ai")
  ) {
    return {
      icon: "🤖",
      badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
      barColor: "bg-violet-500",
      desc: "Inteligencia Artificial: ChatGPT, Herramientas de IA y Automatización",
    };
  }
  if (c.includes("canva") || c.includes("diseñ") || c.includes("design")) {
    return {
      icon: "🎨",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      barColor: "bg-purple-500",
      desc: "Curso de Canva y Creación de Contenido Digital",
    };
  }
  if (c.includes("finanz")) {
    return {
      icon: "💰",
      badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      barColor: "bg-indigo-500",
      desc: "Programa de Finanzas Prácticas, Presupuestos e Inversión",
    };
  }
  return {
    icon: "🎓",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
    barColor: "bg-sky-500",
    desc: "Programa académico o taller de capacitación",
  };
}

const tagStyles: Record<string, string> = {
  Newsletter: "bg-primary/15 text-primary",
  "Demo solicitada": "bg-accent/15 text-accent",
  Precio: "bg-warning/15 text-warning",
  Enterprise: "bg-chart-3/15 text-chart-3",
  Referido: "bg-chart-1/15 text-chart-1",
  Webinario: "bg-chart-5/15 text-chart-5",
  Frío: "bg-muted text-muted-foreground",
};

const statusStyles: Record<string, string> = {
  Nuevo: "bg-success/15 text-success",
  Contactado: "bg-chart-1/15 text-chart-1",
  Calificado: "bg-accent/15 text-accent",
  Perdido: "bg-destructive/15 text-destructive",
};

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

const PAGE_SIZE = 8;

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

function getLeadCampaign(lead: any): string {
  if (
    lead.campaign &&
    typeof lead.campaign === "string" &&
    lead.campaign.trim() &&
    lead.campaign !== "—"
  ) {
    return lead.campaign.trim();
  }
  const tagCampaign = lead.tags?.find((t: string) =>
    /campa[ñn]a|camp:|utm_campaign/i.test(t),
  );
  if (tagCampaign) {
    return tagCampaign.replace(/^[^:]+:\s*/, "").trim();
  }
  const source = (lead.source || "").trim();
  if (source) {
    if (/meta|facebook|fb/i.test(source)) return "Meta Ads — Convocatoria Principal";
    if (/google/i.test(source)) return "Google Ads — Búsqueda & Display";
    if (/tiktok/i.test(source)) return "TikTok Ads — Campaña Viral 2026";
    if (/instagram|ig/i.test(source)) return "Instagram — Reels & Stories";
    if (/webinario|webinar/i.test(source)) return "Webinario — Masterclass Abierta";
    if (/referid/i.test(source)) return "Referidos — Red de Egresados";
    if (/whatsapp|wp/i.test(source)) return "WhatsApp — Difusión Directa";
    return `Campaña ${source}`;
  }
  return "Campaña Principal";
}

function getLeadInternalSource(lead: any): string {
  if (
    lead.internalSource &&
    typeof lead.internalSource === "string" &&
    lead.internalSource.trim() &&
    lead.internalSource !== "—"
  ) {
    return lead.internalSource.trim();
  }
  if (lead.source && typeof lead.source === "string" && lead.source.trim()) {
    return lead.source.trim();
  }
  const tagSource = lead.tags?.find((t: string) =>
    /source:|fuente:|internal/i.test(t),
  );
  if (tagCampaignSafe(tagSource)) {
    return tagSource.replace(/^[^:]+:\s*/, "").trim();
  }
  return "Interno Directo";
}

function tagCampaignSafe(str?: string): boolean {
  return Boolean(str && str.trim());
}

function getLeadAdName(lead: any): string {
  if (
    lead.adName &&
    typeof lead.adName === "string" &&
    lead.adName.trim() &&
    lead.adName !== "—"
  ) {
    return lead.adName.trim();
  }
  const tagAd = lead.tags?.find((t: string) =>
    /anuncio:|ad:|creativo:/i.test(t),
  );
  if (tagAd) {
    return tagAd.replace(/^[^:]+:\s*/, "").trim();
  }
  const s = (lead.source || "").toLowerCase();
  if (s.includes("tiktok")) return "ADS3: Video Viral TikTok";
  if (s.includes("face") || s.includes("meta")) return "ADS2: Imagen Principal Meta";
  if (s.includes("goog")) return "ADS1: Anuncio Búsqueda Google";
  return "Anuncio Principal";
}

function LeadsPage() {
  const { range } = useDateRange();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [courseGroupByMap, setCourseGroupByMap] = useState<
    Record<string, "internalSource" | "campaign" | "ad">
  >({});
  const [page, setPage] = useState(1);
  const [sourcesPage, setSourcesPage] = useState(1);
  const [coursesPage, setCoursesPage] = useState(1);
  const SOURCES_PER_PAGE = 10;
  const COURSES_PER_PAGE = 8;

  const toggleCourseExpand = (courseName: string) => {
    setExpandedCourses((prev) =>
      prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName],
    );
  };

  const { data: allLeads, isPending } = useLeadsQuery();

  const inRangeLeads = useMemo(
    () => (allLeads ?? []).filter((l) => inRange(l.date, range.start, range.end)),
    [allLeads, range.start, range.end],
  );

  // Estadísticas y desglose de personas ingresadas por cada curso
  const courseStats = useMemo(() => {
    const map = new Map<
      string,
      {
        course: string;
        total: number;
        allTimeTotal: number;
        newCount: number;
        contactedCount: number;
        qualifiedCount: number;
        lostCount: number;
      }
    >();

    // 1. Total histórico acumulado de cada curso en toda la subcuenta
    for (const l of allLeads ?? []) {
      const raw = ((l as any).course || "").trim() || "Sin especificar";
      if (!map.has(raw)) {
        map.set(raw, {
          course: raw,
          total: 0,
          allTimeTotal: 0,
          newCount: 0,
          contactedCount: 0,
          qualifiedCount: 0,
          lostCount: 0,
        });
      }
      map.get(raw)!.allTimeTotal++;
    }

    // 2. Personas que ingresaron en el rango de fechas seleccionado
    for (const l of inRangeLeads) {
      const raw = ((l as any).course || "").trim() || "Sin especificar";
      const item = map.get(raw);
      if (item) {
        item.total++;
        if (l.status === "Nuevo") item.newCount++;
        else if (l.status === "Contactado") item.contactedCount++;
        else if (l.status === "Calificado") item.qualifiedCount++;
        else if (l.status === "Perdido") item.lostCount++;
      }
    }

    const totalLeadsInRange = inRangeLeads.length || 1;

    return Array.from(map.values())
      .map((c) => ({
        ...c,
        pct: Math.round((c.total / totalLeadsInRange) * 100),
        convRate: c.total ? ((c.qualifiedCount / c.total) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.total - a.total || b.allTimeTotal - a.allTimeTotal);
  }, [allLeads, inRangeLeads]);

  // Estadísticas y desglose de cada fuente de leads (ordenado de mayor a menor)
  const sourceStats = useMemo(() => {
    const map = new Map<
      string,
      {
        source: string;
        total: number;
        allTimeTotal: number;
        newCount: number;
        contactedCount: number;
        qualifiedCount: number;
        lostCount: number;
      }
    >();

    // 1. Total histórico acumulado de cada fuente en toda la subcuenta
    for (const l of allLeads ?? []) {
      const raw = (l.source || "").trim() || "Sin especificar";
      if (!map.has(raw)) {
        map.set(raw, {
          source: raw,
          total: 0,
          allTimeTotal: 0,
          newCount: 0,
          contactedCount: 0,
          qualifiedCount: 0,
          lostCount: 0,
        });
      }
      map.get(raw)!.allTimeTotal++;
    }

    // 2. Leads que caen en el rango de fechas seleccionado
    for (const l of inRangeLeads) {
      const raw = (l.source || "").trim() || "Sin especificar";
      const item = map.get(raw);
      if (item) {
        item.total++;
        if (l.status === "Nuevo") item.newCount++;
        else if (l.status === "Contactado") item.contactedCount++;
        else if (l.status === "Calificado") item.qualifiedCount++;
        else if (l.status === "Perdido") item.lostCount++;
      }
    }

    const totalLeadsInRange = inRangeLeads.length || 1;

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        pct: Math.round((s.total / totalLeadsInRange) * 100),
        convRate: s.total ? ((s.qualifiedCount / s.total) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.total - a.total || b.allTimeTotal - a.allTimeTotal);
  }, [allLeads, inRangeLeads]);

  // Paginación para fuentes de captación (10 por página)
  const totalSourcePages = Math.max(1, Math.ceil(sourceStats.length / SOURCES_PER_PAGE));
  const currentSourcePage = Math.min(sourcesPage, totalSourcePages);
  const pagedSources = useMemo(() => {
    const start = (currentSourcePage - 1) * SOURCES_PER_PAGE;
    return sourceStats.slice(start, start + SOURCES_PER_PAGE);
  }, [sourceStats, currentSourcePage]);

  // Paginación para cursos
  const totalCoursePages = Math.max(1, Math.ceil(courseStats.length / COURSES_PER_PAGE));
  const currentCoursePage = Math.min(coursesPage, totalCoursePages);
  const pagedCourses = useMemo(() => {
    const start = (currentCoursePage - 1) * COURSES_PER_PAGE;
    return courseStats.slice(start, start + COURSES_PER_PAGE);
  }, [courseStats, currentCoursePage]);

  // Lista de etiquetas reales presentes en el rango.
  const leadTags = useMemo(() => {
    const set = new Set<string>();
    for (const l of inRangeLeads) for (const t of l.tags) set.add(t);
    return Array.from(set).sort();
  }, [inRangeLeads]);

  const monthly = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const l of inRangeLeads) {
      const m = l.date.slice(0, 7);
      buckets[m] = (buckets[m] || 0) + 1;
    }
    return Object.keys(buckets)
      .sort()
      .map((m) => {
        const mi = Number(m.slice(5, 7)) - 1;
        return { month: MONTH_LABELS[mi] ?? m, count: buckets[m] };
      });
  }, [range.start, range.end, inRangeLeads]);

  const filtered = useMemo(() => {
    return inRangeLeads.filter((l) => {
      const q = query.toLowerCase();
      const lCourse = ((l as any).course || "").trim();
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        lCourse.toLowerCase().includes(q) ||
        (l.ownerName ?? "").toLowerCase().includes(q);
      const matchesTags = activeTags.length === 0 || activeTags.every((t) => l.tags.includes(t));
      const leadSource = (l.source || "").trim() || "Sin especificar";
      const matchesSource = !selectedSource || leadSource === selectedSource;
      const leadCourse = lCourse || "Sin especificar";
      const matchesCourse = !selectedCourse || leadCourse === selectedCourse;
      return matchesQuery && matchesTags && matchesSource && matchesCourse;
    });
  }, [inRangeLeads, query, activeTags, selectedSource, selectedCourse]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setPage(1);
  };

  const newCount = inRangeLeads.filter((l) => l.status === "Nuevo").length;
  const qualifiedCount = inRangeLeads.filter((l) => l.status === "Calificado").length;
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of inRangeLeads) for (const t of l.tags) counts[t] = (counts[t] || 0) + 1;
    return counts;
  }, [inRangeLeads]);

  return (
    <div>
      <DataSourceBanner sources={["contacts", "opportunities"]} />
      <PageHeader
        title="Leads"
        subtitle={`${inRangeLeads.length} leads en ${range.label.toLowerCase()}`}
        action={
          <Button size="sm">
            <Mail className="size-4" /> Exportar leads
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Leads totales"
          value={inRangeLeads.length.toLocaleString()}
          delta={12.8}
          icon={UsersRound}
          accent="primary"
        />
        <KpiCard
          label="Nuevos"
          value={newCount.toLocaleString()}
          delta={8.4}
          icon={TrendingUp}
          accent="accent"
        />
        <KpiCard
          label="Calificados"
          value={qualifiedCount.toLocaleString()}
          delta={5.2}
          icon={Tag}
          accent="chart-3"
        />
        <KpiCard
          label="Tasa de calificación"
          value={`${inRangeLeads.length ? ((qualifiedCount / inRangeLeads.length) * 100).toFixed(1) : 0}%`}
          delta={2.1}
          icon={Filter}
          accent="warning"
        />
      </div>

      {/* SECCIÓN NUEVA: PERSONAS INGRESADAS POR CURSO */}
      <div className="mt-4">
        <Card
          title="Personas Ingresadas por Curso"
          subtitle={`Total de prospectos registrados según el programa académico solicitado · ${range.label.toLowerCase()}`}
          icon={GraduationCap}
          action={
            selectedCourse ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCourse(null);
                  setPage(1);
                }}
                className="h-7 text-xs text-primary hover:text-primary gap-1"
              >
                <X className="size-3.5" /> Quitar filtro ({selectedCourse})
              </Button>
            ) : null
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="pb-2.5 font-medium">Programa / Curso</th>
                  <th className="pb-2.5 font-medium text-center">Personas Ingresadas</th>
                  <th className="pb-2.5 font-medium">Participación</th>
                  <th className="pb-2.5 font-medium text-center">Nuevos</th>
                  <th className="pb-2.5 font-medium text-center">Contactados</th>
                  <th className="pb-2.5 font-medium text-center">Calificados</th>
                  <th className="pb-2.5 font-medium text-center">Tasa Cierre</th>
                  <th className="pb-2.5 font-medium text-right">Histórico</th>
                  <th className="pb-2.5 font-medium text-center">Acción / Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pagedCourses.map((item) => {
                  const visual = getCourseVisual(item.course);
                  const isSelected = selectedCourse === item.course;
                  const isExpanded = expandedCourses.includes(item.course);

                  return (
                    <Fragment key={item.course}>
                      <tr
                        onClick={() => toggleCourseExpand(item.course)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/40",
                          isExpanded && "bg-muted/25 font-semibold",
                          isSelected && "bg-primary/10 hover:bg-primary/15 font-semibold",
                        )}
                      >
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <ExplainTooltip
                              title={item.course}
                              description={visual.desc}
                            >
                              <span
                                role="button"
                                tabIndex={0}
                                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm shadow-2xs cursor-help transition-transform hover:scale-110"
                              >
                                {visual.icon}
                              </span>
                            </ExplainTooltip>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground text-xs truncate block">
                                {item.course}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block">
                                {item.contactedCount} en seguimiento
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="font-display font-bold text-sm text-foreground">
                            {item.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 min-w-[120px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono text-muted-foreground">{item.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", visual.barColor)}
                                style={{ width: `${Math.min(item.pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-mono text-muted-foreground">
                          {item.newCount}
                        </td>
                        <td className="py-2.5 text-center font-mono text-muted-foreground">
                          {item.contactedCount}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            <CheckCircle2 className="size-3" />
                            {item.qualifiedCount}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono font-medium text-foreground">
                          {item.convRate}%
                        </td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
                          {item.allTimeTotal.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-center">
                          <Button
                            variant={isExpanded ? "default" : "outline"}
                            size="sm"
                            className="h-6 px-2.5 text-[11px] gap-1 font-medium transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCourseExpand(item.course);
                            }}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="size-3" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="size-3" />
                                Ver leads
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* DESPLIEGUE HACIA ABAJO: LISTA DE PERSONAS AGRUPADAS POR CAMPAÑA */}
                      {isExpanded && (() => {
                        const courseLeads = inRangeLeads.filter(
                          (l) => (((l as any).course || "").trim() || "Sin especificar") === item.course,
                        );

                        const activeGroupBy = courseGroupByMap[item.course] ?? "internalSource";

                        const groupMap = new Map<string, typeof courseLeads>();
                        for (const lead of courseLeads) {
                          let key = "";
                          if (activeGroupBy === "internalSource") {
                            key = getLeadInternalSource(lead);
                          } else if (activeGroupBy === "campaign") {
                            key = getLeadCampaign(lead);
                          } else {
                            key = getLeadAdName(lead);
                          }
                          const list = groupMap.get(key) || [];
                          list.push(lead);
                          groupMap.set(key, list);
                        }

                        const groupedItems = Array.from(groupMap.entries())
                          .map(([groupKey, leads]) => {
                            const distinctCampaigns = Array.from(new Set(leads.map((l) => getLeadCampaign(l))));
                            const distinctAds = Array.from(new Set(leads.map((l) => getLeadAdName(l))));
                            const distinctSources = Array.from(new Set(leads.map((l) => getLeadInternalSource(l))));

                            return {
                              groupKey,
                              leads,
                              total: leads.length,
                              nuevos: leads.filter((l) => l.status === "Nuevo").length,
                              contactados: leads.filter((l) => l.status === "Contactado").length,
                              calificados: leads.filter((l) => l.status === "Calificado").length,
                              perdidos: leads.filter((l) => l.status === "Perdido").length,
                              distinctCampaigns,
                              distinctAds,
                              distinctSources,
                            };
                          })
                          .sort((a, b) => b.total - a.total);

                        return (
                          <tr className="border-b border-border/80 bg-muted/15">
                            <td colSpan={9} className="p-0">
                              <div className="border-t border-border/70 bg-gradient-to-b from-card via-card to-muted/20 p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
                                {/* Cabecera del desglose de curso */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-lg shadow-2xs">
                                      {visual.icon}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm text-foreground">
                                          Personas ingresadas en {item.course}
                                        </h4>
                                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary font-mono">
                                          {courseLeads.length} {courseLeads.length === 1 ? "lead" : "leads"} ({range.label.toLowerCase()})
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Prospectos agrupados por fuente interna (internal-source-lead), campaña y anuncio
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Selector de modo de agrupación */}
                                    <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/50 p-1 text-xs shadow-2xs">
                                      <span className="text-[11px] text-muted-foreground font-medium px-1.5 flex items-center gap-1">
                                        <Layers className="size-3 text-primary" /> Agrupar:
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCourseGroupByMap((prev) => ({
                                            ...prev,
                                            [item.course]: "internalSource",
                                          }));
                                        }}
                                        className={cn(
                                          "rounded px-2 py-0.5 text-xs font-semibold transition-all",
                                          activeGroupBy === "internalSource"
                                            ? "bg-background text-foreground shadow-2xs border border-border"
                                            : "text-muted-foreground hover:text-foreground",
                                        )}
                                        title="Agrupar por fuente interna (internal-source-lead)"
                                      >
                                        🏷️ Fuente Interna
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCourseGroupByMap((prev) => ({
                                            ...prev,
                                            [item.course]: "campaign",
                                          }));
                                        }}
                                        className={cn(
                                          "rounded px-2 py-0.5 text-xs font-semibold transition-all",
                                          activeGroupBy === "campaign"
                                            ? "bg-background text-foreground shadow-2xs border border-border"
                                            : "text-muted-foreground hover:text-foreground",
                                        )}
                                        title="Agrupar por Campaña"
                                      >
                                        📢 Campaña
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCourseGroupByMap((prev) => ({
                                            ...prev,
                                            [item.course]: "ad",
                                          }));
                                        }}
                                        className={cn(
                                          "rounded px-2 py-0.5 text-xs font-semibold transition-all",
                                          activeGroupBy === "ad"
                                            ? "bg-background text-foreground shadow-2xs border border-border"
                                            : "text-muted-foreground hover:text-foreground",
                                        )}
                                        title="Agrupar por Anuncio"
                                      >
                                        🎯 Anuncio
                                      </button>
                                    </div>

                                    <Button
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 text-xs gap-1.5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCourse(isSelected ? null : item.course);
                                        setPage(1);
                                      }}
                                    >
                                      <Filter className="size-3" />
                                      {isSelected ? `Filtro activo (${item.course})` : "Filtrar tabla"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCourseExpand(item.course);
                                      }}
                                      title="Cerrar lista de leads"
                                    >
                                      <X className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Si no hay leads en el rango seleccionado */}
                                {courseLeads.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">
                                      No hay personas registradas para este curso en el rango de fechas seleccionado ({range.label}).
                                    </p>
                                    {item.allTimeTotal > 0 && (
                                      <p className="mt-1 text-muted-foreground">
                                        (Existen {item.allTimeTotal} personas en el histórico acumulado de la subcuenta).
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3.5">
                                    {groupedItems.map((group) => (
                                      <div
                                        key={group.groupKey}
                                        className="rounded-xl border border-border/70 bg-background/80 shadow-xs overflow-hidden"
                                      >
                                        {/* Cabecera de cada Grupo */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/40 px-4 py-2.5">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs shadow-2xs">
                                              {activeGroupBy === "internalSource" ? (
                                                <Share2 className="size-3.5" />
                                              ) : activeGroupBy === "campaign" ? (
                                                <Megaphone className="size-3.5" />
                                              ) : (
                                                <Target className="size-3.5" />
                                              )}
                                            </span>
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-foreground truncate">
                                                  {activeGroupBy === "internalSource" && `Fuente Interna: ${group.groupKey}`}
                                                  {activeGroupBy === "campaign" && `Campaña: ${group.groupKey}`}
                                                  {activeGroupBy === "ad" && `Anuncio: ${group.groupKey}`}
                                                </span>
                                                {activeGroupBy === "internalSource" && (
                                                  <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[9px] font-mono text-primary">
                                                    internal-source-lead
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[10px] text-muted-foreground truncate">
                                                {activeGroupBy === "internalSource" && (
                                                  <>
                                                    {group.distinctCampaigns.length} campaña(s) · {group.distinctAds.length} anuncio(s)
                                                  </>
                                                )}
                                                {activeGroupBy === "campaign" && (
                                                  <>
                                                    Fuente: {group.distinctSources.join(", ")} · {group.distinctAds.length} anuncio(s)
                                                  </>
                                                )}
                                                {activeGroupBy === "ad" && (
                                                  <>
                                                    Campaña: {group.distinctCampaigns.join(", ")} · Fuente: {group.distinctSources.join(", ")}
                                                  </>
                                                )}
                                              </p>
                                            </div>
                                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground border border-border/60 font-mono">
                                              {group.total} {group.total === 1 ? "persona" : "personas"}
                                            </span>
                                          </div>

                                          {/* Resumen de estados en el grupo */}
                                          <div className="flex items-center gap-1.5 text-[10px] font-medium font-mono">
                                            {group.nuevos > 0 && (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-600 dark:text-blue-400">
                                                <span className="size-1.5 rounded-full bg-blue-500" />
                                                {group.nuevos} Nuevos
                                              </span>
                                            )}
                                            {group.contactados > 0 && (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-600 dark:text-amber-400">
                                                <span className="size-1.5 rounded-full bg-amber-500" />
                                                {group.contactados} En contacto
                                              </span>
                                            )}
                                            {group.calificados > 0 && (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3" />
                                                {group.calificados} Calificados
                                              </span>
                                            )}
                                            {group.perdidos > 0 && (
                                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-600 dark:text-rose-400">
                                                <span className="size-1.5 rounded-full bg-rose-500" />
                                                {group.perdidos} Perdidos
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Listado de personas en este grupo */}
                                        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="border-b border-border/40 text-left text-[11px] text-muted-foreground bg-muted/20 sticky top-0 backdrop-blur-xs">
                                                <th className="px-3.5 py-2 font-medium">Persona / Lead</th>
                                                <th className="px-3 py-2 font-medium">Fuente Interna</th>
                                                <th className="px-3 py-2 font-medium">Campaña</th>
                                                <th className="px-3 py-2 font-medium">Nombre del Anuncio</th>
                                                <th className="px-3 py-2 font-medium">Contacto</th>
                                                <th className="px-3 py-2 font-medium">Fecha</th>
                                                <th className="px-3 py-2 font-medium">Asesor</th>
                                                <th className="px-3.5 py-2 font-medium text-right">Estado</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                              {group.leads.map((lead) => {
                                                const leadCamp = getLeadCampaign(lead);
                                                const leadAd = getLeadAdName(lead);
                                                const leadSrc = getLeadInternalSource(lead);

                                                return (
                                                  <tr
                                                    key={lead.id}
                                                    className="transition-colors hover:bg-muted/30"
                                                  >
                                                    <td className="px-3.5 py-2.5">
                                                      <div className="flex items-center gap-2.5">
                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-[10px] font-bold text-foreground">
                                                          {lead.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .slice(0, 2)}
                                                        </div>
                                                        <div className="min-w-0">
                                                          <p className="font-semibold text-foreground text-xs truncate max-w-[130px]">
                                                            {lead.name}
                                                          </p>
                                                          <span className="text-[10px] text-muted-foreground font-mono">
                                                            {lead.id}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                      <span
                                                        className="inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground truncate max-w-[120px]"
                                                        title={`internal-source-lead: ${leadSrc}`}
                                                      >
                                                        <Share2 className="size-2.5 text-primary shrink-0" />
                                                        <span className="truncate">{leadSrc}</span>
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                      <span
                                                        className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-foreground truncate max-w-[160px]"
                                                        title={`Campaña: ${leadCamp}`}
                                                      >
                                                        <Megaphone className="size-2.5 text-primary shrink-0" />
                                                        <span className="truncate">{leadCamp}</span>
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                      <span
                                                        className="inline-flex items-center gap-1 rounded bg-accent/15 border border-accent/25 px-1.5 py-0.5 text-[10px] font-medium text-foreground truncate max-w-[150px]"
                                                        title={`Anuncio: ${leadAd}`}
                                                      >
                                                        <Target className="size-2.5 text-accent shrink-0" />
                                                        <span className="truncate">{leadAd}</span>
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                      <div className="space-y-0.5 text-[11px]">
                                                        {lead.email ? (
                                                          <a
                                                            href={`mailto:${lead.email}`}
                                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Enviar correo"
                                                          >
                                                            <Mail className="size-3 shrink-0 text-primary/70" />
                                                            <span className="truncate max-w-[140px]">{lead.email}</span>
                                                          </a>
                                                        ) : (
                                                          <span className="text-muted-foreground/60">—</span>
                                                        )}
                                                        {lead.phone && (
                                                          <a
                                                            href={`tel:${lead.phone}`}
                                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-mono"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Llamar o contactar"
                                                          >
                                                            <Phone className="size-3 shrink-0 text-emerald-500/70" />
                                                            <span>{lead.phone}</span>
                                                          </a>
                                                        )}
                                                      </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-muted-foreground font-mono text-[11px]">
                                                      {lead.date}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                                                          {(lead.ownerName ?? "—")
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                        </span>
                                                        <span className="truncate max-w-[100px]">
                                                          {lead.ownerName ?? "Sin asignar"}
                                                        </span>
                                                      </span>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right">
                                                      <span
                                                        className={cn(
                                                          "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                                          statusStyles[lead.status] ?? "bg-muted text-muted-foreground",
                                                        )}
                                                      >
                                                        {lead.status}
                                                      </span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </Fragment>
                  );
                })}
                {courseStats.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                      No se encontraron cursos con leads registrados en este periodo.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-xs text-foreground bg-muted/20">
                  <td className="py-2.5 pl-1">Total General</td>
                  <td className="py-2.5 text-center font-display font-bold">
                    {inRangeLeads.length.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-muted-foreground font-mono">100%</td>
                  <td className="py-2.5 text-center font-mono">{newCount}</td>
                  <td className="py-2.5 text-center font-mono">
                    {inRangeLeads.filter((l) => l.status === "Contactado").length}
                  </td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                    {qualifiedCount}
                  </td>
                  <td className="py-2.5 text-center font-mono">
                    {inRangeLeads.length ? ((qualifiedCount / inRangeLeads.length) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-muted-foreground">
                    {(allLeads ?? []).length.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-center">
                    {selectedCourse && (
                      <button
                        onClick={() => {
                          setSelectedCourse(null);
                          setPage(1);
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Ver todos
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Paginación de cursos si hay más de COURSES_PER_PAGE */}
          {totalCoursePages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Mostrando {(currentCoursePage - 1) * COURSES_PER_PAGE + 1} a{" "}
                {Math.min(currentCoursePage * COURSES_PER_PAGE, courseStats.length)} de{" "}
                {courseStats.length} programas
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  disabled={currentCoursePage <= 1}
                  onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Anterior
                </Button>
                <span className="px-1.5 font-medium text-foreground">
                  {currentCoursePage} / {totalCoursePages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  disabled={currentCoursePage >= totalCoursePages}
                  onClick={() => setCoursesPage((p) => Math.min(totalCoursePages, p + 1))}
                >
                  Siguiente <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* SECCIÓN DE FUENTES: TABLA CON FUENTES ORGANIZADAS DE MAYOR A MENOR (PRIMERAS 10 Y PAGINACIÓN) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Tabla de Fuentes de Captación y Total de Leads */}
        <Card
          title="Fuentes de Captación de Leads"
          subtitle={`Total de prospectos registrados por cada fuente publicitaria (10 por página) · ${range.label.toLowerCase()}`}
          icon={Share2}
          className="lg:col-span-2"
          action={
            selectedSource ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSource(null);
                  setPage(1);
                }}
                className="h-7 text-xs text-primary hover:text-primary gap-1"
              >
                <X className="size-3.5" /> Quitar filtro ({selectedSource})
              </Button>
            ) : null
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="pb-2.5 font-medium">Fuente / Canal</th>
                  <th className="pb-2.5 font-medium text-center">Total Leads</th>
                  <th className="pb-2.5 font-medium">Participación</th>
                  <th className="pb-2.5 font-medium text-center">Nuevos</th>
                  <th className="pb-2.5 font-medium text-center">Calificados</th>
                  <th className="pb-2.5 font-medium text-center">Tasa Cierre</th>
                  <th className="pb-2.5 font-medium text-right">Histórico</th>
                  <th className="pb-2.5 font-medium text-center">Filtrar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pagedSources.map((item) => {
                  const visual = getSourceVisual(item.source);
                  const isSelected = selectedSource === item.source;

                  return (
                    <tr
                      key={item.source}
                      onClick={() => {
                        setSelectedSource(isSelected ? null : item.source);
                        setPage(1);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40",
                        isSelected && "bg-primary/10 hover:bg-primary/15 font-semibold",
                      )}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <ExplainTooltip
                            title={item.source}
                            description={visual.desc}
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm shadow-2xs cursor-help transition-transform hover:scale-110"
                            >
                              {visual.icon}
                            </span>
                          </ExplainTooltip>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground text-xs truncate block">
                              {item.source}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {item.contactedCount} en contacto
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="font-display font-bold text-sm text-foreground">
                          {item.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 min-w-[120px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-muted-foreground">{item.pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", visual.barColor)}
                              style={{ width: `${Math.min(item.pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-muted-foreground">
                        {item.newCount}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                          <CheckCircle2 className="size-3" />
                          {item.qualifiedCount}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-mono font-medium text-foreground">
                        {item.convRate}%
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {item.allTimeTotal.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-center">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSource(isSelected ? null : item.source);
                            setPage(1);
                          }}
                        >
                          {isSelected ? "Activo" : "Ver"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {sourceStats.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No se encontraron fuentes de leads registradas.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-xs text-foreground bg-muted/20">
                  <td className="py-2.5 pl-1">Total General</td>
                  <td className="py-2.5 text-center font-display font-bold">
                    {inRangeLeads.length.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-muted-foreground font-mono">100%</td>
                  <td className="py-2.5 text-center font-mono">{newCount}</td>
                  <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400 font-mono">
                    {qualifiedCount}
                  </td>
                  <td className="py-2.5 text-center font-mono">
                    {inRangeLeads.length ? ((qualifiedCount / inRangeLeads.length) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="py-2.5 text-right font-mono text-muted-foreground">
                    {(allLeads ?? []).length.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-center">
                    {selectedSource && (
                      <button
                        onClick={() => {
                          setSelectedSource(null);
                          setPage(1);
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Ver todos
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Paginación de fuentes (10 por página) */}
          {totalSourcePages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Mostrando {(currentSourcePage - 1) * SOURCES_PER_PAGE + 1} a{" "}
                {Math.min(currentSourcePage * SOURCES_PER_PAGE, sourceStats.length)} de{" "}
                {sourceStats.length} fuentes
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  disabled={currentSourcePage <= 1}
                  onClick={() => setSourcesPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Anterior
                </Button>
                <span className="px-1.5 font-medium text-foreground">
                  {currentSourcePage} / {totalSourcePages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  disabled={currentSourcePage >= totalSourcePages}
                  onClick={() => setSourcesPage((p) => Math.min(totalSourcePages, p + 1))}
                >
                  Siguiente <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Gráfica de Leads por Mes */}
        <Card
          title="Leads por mes"
          subtitle={`Ingresos de leads · ${range.label}`}
          icon={TrendingUp}
          className="lg:col-span-1"
        >
          <div className="h-[280px] w-full">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sin datos de leads en este rango.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
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
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Leads"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card">
        {(selectedSource || selectedCourse) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary">
            <div className="flex flex-wrap items-center gap-3">
              {selectedCourse && (
                <span>
                  Filtrando por curso: <strong>{selectedCourse}</strong>
                </span>
              )}
              {selectedSource && (
                <span>
                  Filtrando por fuente: <strong>{selectedSource}</strong>
                </span>
              )}
              <span className="opacity-75">({filtered.length} leads coincidentes)</span>
            </div>
            <div className="flex gap-2">
              {selectedCourse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse(null);
                    setPage(1);
                  }}
                  className="h-6 text-xs text-primary hover:text-primary gap-1"
                >
                  <X className="size-3.5" /> Quitar curso
                </Button>
              )}
              {selectedSource && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSource(null);
                    setPage(1);
                  }}
                  className="h-6 text-xs text-primary hover:text-primary gap-1"
                >
                  <X className="size-3.5" /> Quitar fuente
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar leads, email, curso, fuente..."
              className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> Etiquetas:
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {leadTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  activeTags.includes(tag)
                    ? (tagStyles[tag] ?? "bg-primary/15 text-primary")
                    : "bg-muted/50 text-muted-foreground hover:text-foreground",
                )}
              >
                {tag}
                {tagCounts[tag] ? <span className="opacity-60">{tagCounts[tag]}</span> : null}
              </button>
            ))}
            {leadTags.length === 0 && (
              <span className="text-xs text-muted-foreground">Sin etiquetas en este rango.</span>
            )}
            {activeTags.length > 0 && (
              <button
                onClick={() => {
                  setActiveTags([]);
                  setPage(1);
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando leads de tu subcuenta...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Curso</th>
                  <th className="px-4 py-3 font-medium">Fuente</th>
                  <th className="px-4 py-3 font-medium">Asesor</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Etiquetas</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 text-xs font-bold text-foreground">
                          {l.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{l.name}</p>
                          <p className="text-xs text-muted-foreground">{l.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                          {getCourseVisual((l as any).course || "").icon}
                        </span>
                        <span
                          className="font-medium text-foreground text-xs truncate max-w-[140px]"
                          title={(l as any).course || "General"}
                        >
                          {(l as any).course || "General"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-foreground truncate max-w-[150px]">
                          {getLeadInternalSource(l)}
                        </p>
                        <p
                          className="text-[10px] text-muted-foreground truncate max-w-[150px]"
                          title={`Campaña: ${getLeadCampaign(l)} · Anuncio: ${getLeadAdName(l)}`}
                        >
                          {getLeadCampaign(l)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {(l.ownerName ?? "—")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        {l.ownerName ?? "Sin asignar"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {l.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                              tagStyles[tag] ?? "bg-muted text-muted-foreground",
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                        {l.tags.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                          statusStyles[l.status] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      Ningún lead coincide con tu búsqueda en este rango de fechas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

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
