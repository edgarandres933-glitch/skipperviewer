// Capa de normalización para la vista CRM: TODOS los contactos y
// TODAS las oportunidades de la subcuenta. Server-only.

import {
  getDataset,
  fetchPipelines,
  toISODate,
  fullName,
  type RawContact,
  type RawOpportunity,
} from "./ghl.server";
import { safe } from "./safe-util";
import { getLeads } from "./leads-data";
import { getAdvisors } from "./advisors-data";

export interface CrmContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  dateAdded: string;
  assignedTo: string;
  opportunityId?: string;
  opportunityStatus?: string;
}

export interface CrmOpportunity {
  id: string;
  name: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  monetaryValue: number;
  status: string;
  pipelineId: string;
  pipelineName: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
}

export interface CrmData {
  contacts: CrmContact[];
  opportunities: CrmOpportunity[];
  pipelines: { id: string; name: string }[];
}

export async function getCrmData(): Promise<CrmData> {
  const ds = await getDataset();
  if (ds.contacts.length === 0) {
    const mockLeads = getLeads();
    const mockAdvisors = getAdvisors();
    const pipelines = [{ id: "pipe-sales", name: "COORDINACIÓN ACADÉMICA" }];
    const contacts: CrmContact[] = mockLeads.map((l, idx) => {
      const adv = mockAdvisors[idx % mockAdvisors.length];
      const status = l.status === "Calificado" ? "won" : l.status === "Perdido" ? "lost" : "open";
      return {
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        tags: l.tags,
        dateAdded: l.date,
        assignedTo: adv.name,
        opportunityId: `opp-${l.id}`,
        opportunityStatus: status,
      };
    });
    const opportunities: CrmOpportunity[] = mockLeads.slice(0, 32).map((l, idx) => {
      const adv = mockAdvisors[idx % mockAdvisors.length];
      const status = l.status === "Calificado" ? "won" : l.status === "Perdido" ? "lost" : "open";
      return {
        id: `opp-${l.id}`,
        name: `Oportunidad ${l.name}`,
        contactId: l.id,
        contactName: l.name,
        contactEmail: l.email,
        contactPhone: l.phone,
        monetaryValue: 350 + (idx * 85) % 1500,
        status,
        pipelineId: "pipe-sales",
        pipelineName: "COORDINACIÓN ACADÉMICA",
        source: l.source,
        createdAt: l.date,
        updatedAt: l.date,
        assignedTo: adv.name,
      };
    });
    return { contacts, opportunities, pipelines };
  }
  const userNames = new Map(ds.users.map((u) => [u.id, u.name || u.email || "Sin asignar"]));

  const pipelines = await safe(fetchPipelines(), [] as Awaited<ReturnType<typeof fetchPipelines>>);
  const pipelineName = new Map(pipelines.map((p) => [p.id, p.name ?? "—"]));
  const pipelineList = pipelines.map((p) => ({ id: p.id, name: p.name ?? "Sin nombre" }));

  // Indexa oportunidades por contactId (primera oportunidad)
  const oppByContact = new Map<string, RawOpportunity>();
  for (const o of ds.opportunities) {
    if (o.contactId && !oppByContact.has(o.contactId)) oppByContact.set(o.contactId, o);
  }

  const contacts: CrmContact[] = ds.contacts
    .map((c): CrmContact => {
      const opp = c.id ? oppByContact.get(c.id) : undefined;
      const ownerAssignedId = opp?.assignedTo ?? c.assignedTo ?? null;
      return {
        id: c.id,
        name: fullName(c),
        email: c.email ?? "",
        phone: c.phone ?? "",
        source: c.source ?? "Importado",
        tags: (c.tags ?? []).filter(Boolean),
        dateAdded: toISODate(c.dateAdded),
        assignedTo: ownerAssignedId
          ? (userNames.get(ownerAssignedId) ?? "Sin asignar")
          : "Sin asignar",
        opportunityId: opp?.id,
        opportunityStatus: opp?.status ?? "",
      };
    })
    .filter((c) => c.dateAdded)
    .sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1));

  const contactById = new Map(ds.contacts.map((c) => [c.id, c] as const));

  const opportunities: CrmOpportunity[] = ds.opportunities
    .map((o): CrmOpportunity => {
      const contact = o.contactId ? contactById.get(o.contactId) : undefined;
      return {
        id: o.id,
        name: o.name ?? o.contactName ?? "—",
        contactId: o.contactId ?? "",
        contactName: o.contactName ?? (contact ? fullName(contact) : "—"),
        contactEmail: contact?.email ?? "",
        contactPhone: contact?.phone ?? "",
        monetaryValue: Number(o.monetaryValue || 0),
        status: o.status ?? "",
        pipelineId: o.pipelineId ?? "",
        pipelineName: (o.pipelineId && pipelineName.get(o.pipelineId)) || "—",
        source: o.source ?? "",
        createdAt: toISODate(o.createdAt),
        updatedAt: toISODate(o.updatedAt),
        assignedTo: o.assignedTo ? (userNames.get(o.assignedTo) ?? "Sin asignar") : "Sin asignar",
      };
    })
    .filter((o) => o.createdAt)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return { contacts, opportunities, pipelines: pipelineList };
}
