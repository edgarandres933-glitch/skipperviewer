// Datos simulados de asesores para el panel Skipper View.
// Browser-safe para que cualquier ruta pueda importarlo.

import { getLeads } from "./leads-data";

export interface Advisor {
  id: string;
  name: string;
  email: string;
  region: string;
  /** IDs de leads asignados a este asesor */
  assignedLeadIds: string[];
  /** Monto total de ventas cerradas (Ganado) en el rango */
  salesAmount: number;
  avatarColor: string;
}

const ADVISOR_NAMES = [
  {
    name: "Valeria Núñez",
    email: "valeria.nunez@skipperview.com",
    region: "Madrid, ES",
    color: "var(--color-chart-1)",
  },
  {
    name: "Diego Salas",
    email: "diego.salas@skipperview.com",
    region: "Barcelona, ES",
    color: "var(--color-chart-2)",
  },
  {
    name: "Lucía Romero",
    email: "lucia.romero@skipperview.com",
    region: "Valencia, ES",
    color: "var(--color-chart-3)",
  },
  {
    name: "Mateo Herrera",
    email: "mateo.herrera@skipperview.com",
    region: "Sevilla, ES",
    color: "var(--color-chart-5)",
  },
  {
    name: "Sofía Castro",
    email: "sofia.castro@skipperview.com",
    region: "Bilbao, ES",
    color: "var(--color-primary)",
  },
  {
    name: "Andrés Vega",
    email: "andres.vega@skipperview.com",
    region: "Málaga, ES",
    color: "var(--color-accent)",
  },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

let cached: Advisor[] | null = null;

export function getAdvisors(): Advisor[] {
  if (cached) return cached;
  const rand = seededRandom(99);
  const leads = getLeads();
  const advisors: Advisor[] = ADVISOR_NAMES.map((meta, i) => ({
    id: `#ADV-${(200 + i).toString()}`,
    name: meta.name,
    email: meta.email,
    region: meta.region,
    avatarColor: meta.color,
    assignedLeadIds: [],
    salesAmount: 0,
  }));

  // Reparte los leads entre los asesores de forma determinista.
  leads.forEach((lead, idx) => {
    const advisor = advisors[idx % advisors.length];
    advisor.assignedLeadIds.push(lead.id);
  });

  // Asigna un monto de ventas simulado por asesor.
  advisors.forEach((a) => {
    a.salesAmount = Math.round(2000 + rand() * 18000);
  });

  cached = advisors;
  return advisors;
}

export type LeadOutcome = "Ganado" | "Perdido" | "En proceso";

/** Resultado de cierre de cada lead asignado (determinista por id de lead). */
export function leadOutcome(leadId: string): LeadOutcome {
  // Hash simple y estable a partir del id del lead.
  let h = 0;
  for (let i = 0; i < leadId.length; i++) h = (h * 31 + leadId.charCodeAt(i)) % 1000;
  const r = h / 1000;
  if (r < 0.42) return "Ganado";
  if (r < 0.72) return "En proceso";
  return "Perdido";
}

export interface AdvisorStats {
  advisor: Advisor;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  /** Porcentaje de ventas = leads Ganado / total asignados */
  winRate: number;
  salesAmount: number;
}

/**
 * Calcula estadísticas por asesor respetando el rango de fechas:
 * solo cuenta los leads asignados cuya fecha cae dentro del rango.
 */
export function advisorStats(start: string, end: string): AdvisorStats[] {
  const advisors = getAdvisors();
  const leads = getLeads();
  const byId = new Map(leads.map((l) => [l.id, l]));

  return advisors.map((advisor) => {
    const rangeLeads = advisor.assignedLeadIds
      .map((id) => byId.get(id))
      .filter((l): l is NonNullable<typeof l> => !!l && l.date >= start && l.date <= end);

    const outcomes = rangeLeads.map((l) => leadOutcome(l.id));
    const won = outcomes.filter((o) => o === "Ganado").length;
    const lost = outcomes.filter((o) => o === "Perdido").length;
    const inProgress = outcomes.filter((o) => o === "En proceso").length;
    const total = rangeLeads.length;

    return {
      advisor,
      totalLeads: total,
      wonLeads: won,
      lostLeads: lost,
      inProgressLeads: inProgress,
      winRate: total ? (won / total) * 100 : 0,
      // Ventas proporcionales a los leads ganados en el rango.
      salesAmount: total ? Math.round((won / Math.max(total, 1)) * advisor.salesAmount) : 0,
    };
  });
}

/** Serie de ventas por asesor para gráfica de barras comparativa. */
export function advisorSalesSeries(start: string, end: string) {
  return advisorStats(start, end)
    .map((s) => ({
      name: s.advisor.name.split(" ")[0],
      ventas: s.salesAmount,
      ganados: s.wonLeads,
    }))
    .sort((a, b) => b.ventas - a.ventas);
}

export function getAdvisorById(id: string): Advisor | undefined {
  return getAdvisors().find((a) => a.id === id);
}

export interface AdvisorLeadDetail {
  lead: Lead;
  outcome: LeadOutcome;
}

/** Leads asignados a un asesor dentro del rango de fechas, con su estado de cierre. */
export function advisorLeads(advisorId: string, start: string, end: string): AdvisorLeadDetail[] {
  const advisor = getAdvisors().find((a) => a.id === advisorId);
  if (!advisor) return [];
  const leads = getLeads();
  const byId = new Map(leads.map((l) => [l.id, l]));
  return advisor.assignedLeadIds
    .map((id) => byId.get(id))
    .filter((l): l is NonNullable<typeof l> => !!l && l.date >= start && l.date <= end)
    .map((l) => ({ lead: l, outcome: leadOutcome(l.id) }))
    .sort((a, b) => (a.lead.date < b.lead.date ? 1 : -1));
}
