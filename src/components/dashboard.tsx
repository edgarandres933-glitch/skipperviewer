import { ArrowDownRight, ArrowUpRight, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/dashboard-data";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export const DEFAULT_KPI_EXPLANATIONS: Record<string, string> = {
  // Panel de Productos / Inicio
  "Ingresos por cursos": "Suma de todos los pagos completos y abonos recaudados por matrículas en el período seleccionado.",
  "Alumnos matriculados": "Cantidad total de alumnos que completaron su proceso de inscripción en estado Ganado.",
  "Leads interesados": "Total de prospectos registrados en el CRM interesados en inscribirse en los programas.",
  "Tasa de cierre global": "Porcentaje de prospectos registrados que se convirtieron en alumnos matriculados.",

  // Analíticas
  "Tasa de cierre de leads": "Porcentaje de prospectos calificados que finalizaron con una matrícula exitosa.",
  "Ticket promedio por alumno": "Monto promedio pagado por cada alumno al momento de formalizar su matrícula.",
  "Tasa de pago completo": "Porcentaje de estudiantes que cancelaron el valor total del curso de contado vs. abonos.",
  "Eficiencia de asignación": "Porcentaje de prospectos del CRM que ya cuentan con un asesor comercial asignado.",

  // Asesores
  "Leads asignados": "Total de prospectos comerciales asignados a este asesor para seguimiento y venta.",
  "Leads ganados": "Total de ventas cerradas y alumnos matriculados con éxito por este asesor.",
  "Ventas cerradas": "Total acumulado en dólares ($) cobrado por pagos completos y abonos gestionados.",
  "Tasa de cierre prom.": "Efectividad promedio de cierre de ventas del equipo de asesores sobre leads asignados.",
  "En proceso / Perdidos": "Prospectos que aún están en negociación activa frente a los que no llegaron a concretarse.",

  // CRM & Leads
  "Total de leads": "Volumen consolidado de contactos registrados en la base de datos.",
  "En seguimiento": "Contactos activos con conversaciones y seguimiento comercial en curso.",
  "Oportunidades": "Negociaciones activas registradas en los embudos de venta.",
};

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "primary",
  tooltip,
}: {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "warning" | "chart-3";
  tooltip?: string;
}) {
  const up = delta >= 0;
  const accentMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    accent: "from-accent/20 to-accent/5 text-accent",
    warning: "from-warning/20 to-warning/5 text-warning",
    "chart-3": "from-chart-3/20 to-chart-3/5 text-chart-3",
  };

  const tip = tooltip || DEFAULT_KPI_EXPLANATIONS[label] || `Resumen y métricas correspondientes a ${label.toLowerCase()}.`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              title={tip}
              aria-label={tip}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg bg-gradient-to-br cursor-help transition-all duration-200 hover:scale-110 hover:shadow-md ring-1 ring-border/50",
                accentMap[accent],
              )}
            >
              <Icon className="size-5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="max-w-[260px] text-left">
            <p className="font-semibold text-foreground mb-1 text-[12px]">{label}</p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">{tip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
            up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(delta)}%
        </span>
        <span className="text-muted-foreground">vs mes anterior</span>
      </div>
    </div>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  Pagado: "bg-success/15 text-success",
  Pendiente: "bg-warning/15 text-warning",
  Reembolsado: "bg-muted text-muted-foreground",
  Fallido: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

const tierStyles: Record<string, string> = {
  Bronce: "bg-warning/15 text-warning",
  Plata: "bg-muted text-muted-foreground",
  Oro: "bg-chart-3/15 text-chart-3",
  Platino: "bg-primary/15 text-primary",
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        tierStyles[tier],
      )}
    >
      {tier}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const DEFAULT_CARD_EXPLANATIONS: Record<string, string> = {
  // Panel
  "Evolución de ventas por producto": "Historial mensual de ingresos en dólares ($) desglosado por cada curso ofertado.",
  "Cuota de ventas por producto": "Porcentaje de recaudación que aporta cada curso al total de ventas de la academia.",
  "Modalidad de estudio": "Comparación de estudiantes inscritos en clases presenciales en aula vs. clases virtuales en vivo.",
  "Últimos alumnos inscritos": "Listado de las inscripciones confirmadas recientemente con su curso, modalidad y tipo de pago.",

  // Analíticas
  "Embudo de conversión de cursos": "Embudo de 5 etapas para medir el avance de prospectos desde el primer contacto hasta el pago.",
  "Canales de captación": "Volumen de prospectos, alumnos ganados e ingresos según la plataforma publicitaria de origen (Meta, TikTok, etc.).",
  "Eficiencia por producto / curso": "Tabla comparativa de prospectos, matrículas, tasa de cierre, ticket promedio y recaudación.",
  "Comportamiento de pagos": "Proporción de alumnos que pagaron el total de contado frente a los que abonaron cuotas parciales.",
  "Histórico de facturación y matrículas por mes": "Tendencia mensual acumulada de dinero recaudado y alumnos incorporados.",

  // Asesores
  "Carrera hacia la Meta de Ventas": "Pista estilo hipódromo del avance de cada asesor comercial hacia las metas de $5,000, $7,500 y $10,000.",
  "Filtro y lista de Asesores": "Directorio de vendedores con búsqueda, ordenamiento por ventas o leads y paginación.",
  "Histórico de ventas mensuales": "Monto acumulado vendido por este asesor en cada mes del año.",
  "Distribución por programa": "Cursos y talleres más vendidos por este asesor comercial.",
  "Leads ganados y matriculados": "Alumnos matriculados por este asesor con detalle de curso, modalidad y monto cobrado.",

  // Leads
  "Personas Ingresadas por Curso": "Muestra la cantidad total de personas que han ingresado solicitando información para cada curso, su porcentaje de participación y estado.",
  "Fuentes de Captación de Leads": "Tabla detallada con cada fuente de captación publicitaria, total de leads, tasa de conversión e histórico.",
  "Leads por mes": "Gráfico de barras con la cantidad de prospectos captados en cada mes.",

  // Consolidados
  "Consolidado General por Curso": "Resumen financiero y comercial con la recaudación, saldo pendiente y alumnos de cada curso.",
  "Distribución de Facturación por Curso": "Comparativa de ingresos recaudados y saldos por cobrar de cada programa educativo.",
  "Cuota de Ingresos Consolidados": "Participación porcentual de cada curso en el total de facturación de la academia.",
  "Detalle Consolidado del Curso": "Expediente con desglose de modalidad, asesores comerciales, canales y alumnos matriculados.",
};

export function Card({
  title,
  subtitle,
  icon: Icon,
  tooltip,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const tip = tooltip || (title ? DEFAULT_CARD_EXPLANATIONS[title] : undefined);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {Icon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    title={tip || subtitle || title}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary cursor-help transition-all duration-200 hover:scale-110 hover:bg-primary/20"
                  >
                    <Icon className="size-4.5" />
                  </div>
                </TooltipTrigger>
                {tip && (
                  <TooltipContent side="top" align="start" className="max-w-[280px] text-xs">
                    <p className="font-semibold text-foreground mb-0.5">{title}</p>
                    <p className="text-muted-foreground">{tip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                {!Icon && tip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        title={tip}
                        aria-label={tip}
                        className="text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors"
                      >
                        <HelpCircle className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-[280px] text-xs">
                      <p className="font-semibold text-foreground mb-0.5">{title}</p>
                      <p className="text-muted-foreground">{tip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

