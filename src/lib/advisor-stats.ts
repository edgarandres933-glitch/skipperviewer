// Estadísticas de asesores derivadas de los datos reales de la subcuenta.
// Browser-safe: recibe los datos ya cargados desde el servidor.

import type { NormalizedLead, NormalizedAdvisor } from "./ghl.server";
import type { Lead } from "./leads-data";

export type LeadOutcome = "Ganado" | "Perdido" | "En proceso";

/** True si el estado crudo de la oportunidad indica "ganado". */
function isWonStatus(raw?: string): boolean {
  const s = (raw ?? "").toLowerCase();
  return s === "won" || s.includes("gan") || s.includes("closed") || s.includes("pag");
}

/** True si el estado crudo de la oportunidad indica "perdido". */
function isLostStatus(raw?: string): boolean {
  const s = (raw ?? "").toLowerCase();
  return s === "lost" || s.includes("perd");
}

/**
 * Deriva el estado de cierre de un lead a partir de su estado normalizado
 * y, si está disponible, del status crudo de la oportunidad.
 */
export function leadOutcome(lead: { status: Lead["status"]; oppStatus?: string }): LeadOutcome {
  // Prioriza el status crudo de la oportunidad cuando existe.
  if (lead.oppStatus) {
    if (isWonStatus(lead.oppStatus)) return "Ganado";
    if (isLostStatus(lead.oppStatus)) return "Perdido";
    return "En proceso";
  }
  switch (lead.status) {
    case "Calificado":
      return "Ganado";
    case "Perdido":
      return "Perdido";
    default:
      return "En proceso";
  }
}

export interface AdvisorStats {
  advisor: NormalizedAdvisor;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  inProgressLeads: number;
  /** Porcentaje de ventas = leads Ganado / total asignados */
  winRate: number;
  salesAmount: number;
}

/**
 * Fecha relevante del lead para filtrar por rango:
 * usa la fecha de la oportunidad (cuando se cerró/actualizó) si existe,
 * si no, la fecha de creación del contacto.
 */
function leadDate(l: NormalizedLead): string {
  return l.oppDate || l.date;
}

/**
 * Calcula estadísticas por asesor respetando el rango de fechas:
 * solo cuenta los leads asignados cuya fecha cae dentro del rango.
 */
export function advisorStats(
  advisors: NormalizedAdvisor[],
  leads: NormalizedLead[],
  start: string,
  end: string,
): AdvisorStats[] {
  return advisors.map((advisor) => {
    const rangeLeads = leads.filter(
      (l) =>
        advisor.assignedLeadIds.includes(l.id) &&
        // Coincide por assignedTo del contacto o de la oportunidad.
        (l.assignedTo === advisor.id || l.oppAssignedTo === advisor.id) &&
        inDateRange(leadDate(l), start, end),
    );
    const outcomes = rangeLeads.map((l) => leadOutcome(l));
    const won = outcomes.filter((o) => o === "Ganado").length;
    const lost = outcomes.filter((o) => o === "Perdido").length;
    const inProgress = outcomes.filter((o) => o === "En proceso").length;
    const total = rangeLeads.length;

    // Suma real de todos los pagos completos y abonos de los leads ganados en el rango
    const wonLeadsList = rangeLeads.filter((l) => leadOutcome(l) === "Ganado");
    const salesAmount = wonLeadsList.reduce((sum, l) => {
      const paid = Number(l.deposit || l.total || 0);
      return sum + paid;
    }, 0);

    return {
      advisor,
      totalLeads: total,
      wonLeads: won,
      lostLeads: lost,
      inProgressLeads: inProgress,
      winRate: total ? (won / total) * 100 : 0,
      salesAmount,
    };
  });
}

function inDateRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Serie de ventas por asesor para gráfica de barras comparativa. */
export function advisorSalesSeries(stats: AdvisorStats[]) {
  return stats
    .map((s) => ({
      name: s.advisor.name.split(" ")[0],
      ventas: s.salesAmount,
      ganados: s.wonLeads,
    }))
    .sort((a, b) => b.ventas - a.ventas);
}

export interface AdvisorLeadDetail {
  lead: NormalizedLead;
  outcome: LeadOutcome;
}

/** Leads asignados a un asesor dentro del rango de fechas, con su estado de cierre. */
export function advisorLeads(
  advisor: NormalizedAdvisor | undefined,
  leads: NormalizedLead[],
  start: string,
  end: string,
): AdvisorLeadDetail[] {
  if (!advisor) return [];
  return leads
    .filter(
      (l) =>
        advisor.assignedLeadIds.includes(l.id) &&
        (l.assignedTo === advisor.id || l.oppAssignedTo === advisor.id) &&
        inDateRange(leadDate(l), start, end),
    )
    .map((l) => ({ lead: l, outcome: leadOutcome(l) }))
    .sort((a, b) => (leadDate(a.lead) < leadDate(b.lead) ? 1 : -1));
}
