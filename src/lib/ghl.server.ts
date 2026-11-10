// Capa de datos normalizada y cacheada de la subcuenta.
// SOLO servidor: importa ghl-api.server.ts (que lee el token de process.env).
// Los componentes importan ghl.functions.ts (wrappers delgados con createServerFn).

import {
  LOCATION_ID,
  ghlFetch,
  fetchAllContacts,
  fetchAllOpportunities,
  fetchUsers,
  fetchCustomFields,
  fetchPipelines,
  safe,
  type RawContact,
  type RawOpportunity,
  type RawPipeline,
  type RawUser,
} from "./ghl-api.server";

// Re-exporta tipos/utilidades que consumen otros módulos del servidor.
export {
  LOCATION_ID,
  ghlFetch,
  fetchPipelines,
  type RawContact,
  type RawOpportunity,
  type RawPipeline,
  type RawUser,
};

import { getLeads, type Lead } from "./leads-data";
import { getAdvisors } from "./advisors-data";
import {
  orders as mockOrders,
  customers as mockCustomers,
  type Customer,
  type Order,
  type OrderStatus,
  type CourseSchedule,
} from "./dashboard-data";
import { getFieldMappings } from "./field-mapping.server";
import { type FieldMapping } from "./field-mapping";

// ---------------------------------------------------------------------------
// Resolución del pipeline de ventas
// ---------------------------------------------------------------------------

/**
 * Resuelve el ID del pipeline "COORDINACIÓN ACADEMICA" (donde viven todas
 * las ventas). Compara sin tildes ni mayúsculas para ser tolerante.
 */
async function resolveSalesPipelineId(): Promise<string | null> {
  const pipelines = await safe(fetchPipelines(), [] as RawPipeline[]);
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const target = normalize("COORDINACIÓN ACADEMICA");
  const hit = pipelines.find((p) => normalize(p.name ?? "") === target);
  if (!hit) {
    const fuzzy = pipelines.find((p) => {
      const n = normalize(p.name ?? "");
      return n.includes("coordinacion") || n.includes("academica");
    });
    return fuzzy?.id ?? null;
  }
  return hit.id;
}

// ---------------------------------------------------------------------------
// Utilidades de normalización
// ---------------------------------------------------------------------------

/** Convierte un timestamp ISO/ms a fecha yyyy-mm-dd (o devuelve tal cual). */
export function toISODate(ts?: string): string {
  if (!ts) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(ts)) return ts.slice(0, 10);
  const d = new Date(Number(ts) || ts);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function fullName(c: RawContact): string {
  if (c.name?.trim()) return c.name.trim();
  const f = (c.firstName ?? "").trim();
  const l = (c.lastName ?? "").trim();
  if (f || l) return `${f} ${l}`.trim();
  return c.contactName?.trim() || c.email?.trim() || "Sin nombre";
}

/**
 * Busca el valor de un campo personalizado.
 * 1) Si el mapeo configura un campo para `key`, usa ese campo (por nombre o id).
 * 2) Si no, cae a búsqueda por palabra clave en el nombre (automático).
 */
export function findField(
  customFields: { id: string; name: string; fieldKey?: string; value: any }[] | undefined,
  mapping: FieldMapping,
  key: keyof FieldMapping,
  keywords: string[],
): string {
  if (!customFields) return "";
  const formatVal = (v: any): string => {
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.join(", ");
    return String(v).trim();
  };
  const safeName = (f: { name?: string }) => (f.name ?? "").toLowerCase();
  const safeKey = (f: { fieldKey?: string }) => (f.fieldKey ?? "").toLowerCase();
  const mapped = (mapping[key] ?? "").toLowerCase().trim();
  if (mapped) {
    const hit = customFields.find(
      (f) =>
        safeName(f) === mapped ||
        f.id.toLowerCase() === mapped ||
        safeKey(f) === mapped ||
        safeKey(f) === `contact.${mapped}` ||
        safeKey(f).includes(mapped),
    );
    if (hit?.value !== undefined && hit.value !== null && hit.value !== "") {
      return formatVal(hit.value);
    }
  }
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    const hit = customFields.find(
      (f) =>
        safeName(f).includes(kwLower) ||
        safeKey(f).includes(kwLower) ||
        f.id.toLowerCase() === kwLower,
    );
    if (hit?.value !== undefined && hit.value !== null && hit.value !== "") {
      return formatVal(hit.value);
    }
  }
  return "";
}


function normalizeSchedule(raw: string): "Mañana" | "Tarde" | "Noche" {
  const v = raw.toLowerCase();
  if (v.includes("mañ") || v.includes("mana") || v.includes("morn")) return "Mañana";
  if (v.includes("tarde") || v.includes("after")) return "Tarde";
  if (v.includes("noch") || v.includes("even")) return "Noche";
  if (v === "1") return "Mañana";
  if (v === "2") return "Tarde";
  if (v === "3") return "Noche";
  return "Mañana";
}

// ---------------------------------------------------------------------------
// Cache en memoria del servidor con deduplicación de llamadas en vuelo
// ---------------------------------------------------------------------------

interface GhlDataset {
  contacts: RawContact[];
  opportunities: RawOpportunity[];
  users: RawUser[];
  /** ID del pipeline "COORDINACIÓN ACADEMICA" (donde viven las ventas). */
  salesPipelineId: string | null;
  /** Fuentes que no pudieron cargarse (para mostrar un indicador en la UI). */
  failedSources: string[];
  fetchedAt: number;
}

const CACHE_TTL = 600_000; // 10 min — el conjunto completo es costoso de cargar
let cache: GhlDataset | null = null;
// Deduplicación de llamadas en vuelo: si varias server functions piden el
// dataset a la vez (getDashboardData lanza 4 en paralelo), todas comparten
// la misma promesa en lugar de disparar 4 fetches idénticos.
let inflight: Promise<GhlDataset> | null = null;

export async function getDataset(): Promise<GhlDataset> {
  // Cache fresco y sin fallos → reutilízalo al instante.
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL && cache.failedSources.length === 0) {
    return cache;
  }
  // Si ya hay un fetch en vuelo, reutilízalo.
  if (inflight) return inflight;

  inflight = (async () => {
    const failedSources: string[] = [];
    const safeTrack = <T>(label: string, p: Promise<T>, fallback: T): Promise<T> =>
      p.catch((err) => {
        console.error(`[GHL] fuente fallida (${label}):`, err instanceof Error ? err.message : err);
        if (!failedSources.includes(label)) failedSources.push(label);
        return fallback;
      });

    const [contacts, opportunities, users, salesPipelineId] = await Promise.all([
      safeTrack("contacts", fetchAllContacts(), [] as RawContact[]),
      safeTrack("opportunities", fetchAllOpportunities(), [] as RawOpportunity[]),
      safeTrack("users", fetchUsers(), [] as RawUser[]),
      safeTrack("pipelines", resolveSalesPipelineId(), null),
    ]);
    const result: GhlDataset = {
      contacts,
      opportunities,
      users,
      salesPipelineId,
      failedSources,
      fetchedAt: Date.now(),
    };
    // Solo guardamos en cache si todo cargó bien. Si hubo fallos, dejamos el
    // cache anterior (o null) para que la próxima llamada reintente.
    if (failedSources.length === 0) {
      cache = result;
    }
    return result;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

// ---------------------------------------------------------------------------
// Tipos normalizados que consume la app
// ---------------------------------------------------------------------------

export interface NormalizedLead extends Lead {
  assignedTo?: string | null;
  ownerName?: string;
  oppAssignedTo?: string | null;
  oppDate?: string;
  oppStatus?: string;
  course: string;
  modality: "Presencial" | "Virtual";
  paymentStatus: "Pago completo" | "Abono" | "Pendiente" | "Sin pago";
  deposit: number;
  total: number;
  saldo: number;
  campaign?: string | undefined;
  adName?: string | undefined;
  internalSource?: string | undefined;
}

export interface NormalizedCustomer extends Customer {
  rawId: string;
  modality: string;
}

export interface NormalizedAdvisor {
  id: string;
  name: string;
  email: string;
  region: string;
  avatarColor: string;
  assignedLeadIds: string[];
  salesAmount: number;
}

const AVATAR_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-5)",
  "var(--color-primary)",
  "var(--color-accent)",
];

export interface LeadCoursePaymentInfo {
  course: string;
  modality: "Presencial" | "Virtual";
  paymentStatus: "Pago completo" | "Abono" | "Pendiente" | "Sin pago";
  deposit: number;
  total: number;
  saldo: number;
}

export function resolveCourseAndPayment(
  c: RawContact,
  opp: RawOpportunity | undefined,
  mapping: FieldMapping,
): LeadCoursePaymentInfo {
  const cf = c.customFields ?? [];
  const tags = c.tags ?? [];

  // Helper de búsqueda de campos
  const findVal = (keywords: string[], exactId?: string) => {
    if (exactId) {
      const hit = cf.find((f) => f.id === exactId);
      if (hit?.value !== undefined && hit.value !== null && hit.value !== "") {
        return Array.isArray(hit.value) ? hit.value.join(", ") : String(hit.value).trim();
      }
    }
    return findField(cf, mapping, keywords[0] as any, keywords);
  };

  // 1. CURSO
  let rawCourse =
    findVal(["course", "curso_que_aplica", "curso", "programa", "producto"], "idR8NE8XqMKkCArqPMFJ") ||
    findVal([], "YuMLXHJIE84l7qdpJLzm");

  let course = "";
  if (rawCourse) {
    const cLower = rawCourse.toLowerCase();
    if (cLower.includes("asistent") || cLower.includes("contable")) course = "Asistente Contable";
    else if (cLower.includes("marketing") || cLower.includes("tiktok") || cLower.includes("mrk"))
      course = "Marketing Digital";
    else if (cLower.includes("excel")) course = "Excel Profesional";
    else if (cLower.includes("ofimat") || cLower.includes("office") || cLower.includes("word"))
      course = "Ofimática";
    else if (cLower.includes("capcut") || cLower.includes("video") || cLower.includes("edicion") || cLower.includes("edición"))
      course = "CapCut";
    else if (
      cLower.includes("inteligencia") ||
      cLower.includes("artificial") ||
      cLower.includes("chatgpt") ||
      cLower.includes(" ia") ||
      cLower.startsWith("ia") ||
      cLower.includes("ai")
    )
      course = "Inteligencia Artificial";
    else if (cLower.includes("canva")) course = "Canva & Diseño";
    else if (cLower.includes("finanz")) course = "Finanzas";
    else course = rawCourse;
  }

  if (!course) {
    if (tags.some((t) => /ac[-_ ]|asistente contable|info-ac/i.test(t))) course = "Asistente Contable";
    else if (tags.some((t) => /mrk[-_ ]|marketing|info-mrk/i.test(t))) course = "Marketing Digital";
    else if (tags.some((t) => /excel|info-excel/i.test(t))) course = "Excel Profesional";
    else if (tags.some((t) => /ofimat|office|word/i.test(t))) course = "Ofimática";
    else if (tags.some((t) => /capcut|edici[oó]n|video/i.test(t))) course = "CapCut";
    else if (tags.some((t) => /\bia\b|inteligencia artificial|chatgpt|prompts|\bai\b/i.test(t)))
      course = "Inteligencia Artificial";
    else if (tags.some((t) => /canva/i.test(t))) course = "Canva & Diseño";
    else if (tags.some((t) => /finanzas/i.test(t))) course = "Finanzas";
    else if (
      opp?.name &&
      /curso|programa|taller|diplomado|marketing|mrk|excel|contab|cconta|ofimat|capcut|ia\b|artificial|canva|finanz|rmq/i.test(opp.name)
    ) {
      course = opp.name;
    } else {
      course = "General";
    }
  }

  // 2. MODALIDAD
  let rawModality = findVal(["modality", "modalidad", "modal"], "WrZk5A0RCcl3IErtgFL2");
  let modality: "Presencial" | "Virtual" = "Virtual";
  if (rawModality) {
    modality = rawModality.toLowerCase().includes("pres") ? "Presencial" : "Virtual";
  } else {
    if (tags.some((t) => /presencial/i.test(t))) modality = "Presencial";
    else if (tags.some((t) => /online|virtual|zoom/i.test(t))) modality = "Virtual";
    else {
      const scheduleCf =
        findVal(["schedule", "horario", "turno", "jornada"], "u6Q8bmesYaIo4u2Mx3mJ") ||
        findVal([], "n9X1k5YB9Pxrrr1PkPBJ") ||
        findVal([], "OeeecLF0bLr3vih00duU") ||
        findVal([], "CujQ22xorNOmgULgDkwU");
      if (/presencial/i.test(scheduleCf)) modality = "Presencial";
      else modality = "Virtual";
    }
  }

  // 3. PAGO COMPLETO O ABONO
  const abonoRaw = findVal(["deposit", "abono", "abonado", "pago parcial", "anticipo"], "CFei5Znl3wFGoRkEaUc5");
  const totalRaw = findVal(["total", "valor_total", "precio"], "W6jP9XM2KXtW8D3g7w9s");
  const saldoRaw = findVal(["saldo"], "IfHz6xCpdgxuasspjzXG");

  const deposit = Number(abonoRaw) || 0;
  const total = Number(totalRaw) || Number(opp?.monetaryValue) || 0;
  const saldo = Number(saldoRaw) || 0;

  const oppStatus = (opp?.status ?? "").toLowerCase();
  const isWon =
    oppStatus.includes("won") ||
    oppStatus.includes("gan") ||
    oppStatus.includes("closed") ||
    oppStatus.includes("pag");
  const isLost = oppStatus.includes("lost") || oppStatus.includes("perd");

  let paymentStatus: "Pago completo" | "Abono" | "Pendiente" | "Sin pago" = "Pendiente";

  if (deposit > 0) {
    if (saldo === 0 && (total > 0 || deposit >= 197)) {
      paymentStatus = "Pago completo";
    } else if (deposit < total || saldo > 0) {
      paymentStatus = "Abono";
    } else {
      paymentStatus = "Pago completo";
    }
  } else if (tags.some((t) => /id_separar_cupo|separar_cupo/i.test(t))) {
    paymentStatus = "Abono";
  } else if (isWon || tags.some((t) => /id_pago/i.test(t))) {
    if (total > 0 && total < 100) {
      paymentStatus = "Abono";
    } else {
      paymentStatus = "Pago completo";
    }
  } else if (isLost) {
    paymentStatus = "Sin pago";
  } else {
    paymentStatus = "Pendiente";
  }

  return {
    course,
    modality,
    paymentStatus,
    deposit: deposit || (paymentStatus === "Pago completo" ? total : 0),
    total,
    saldo,
  };
}

// ---------------------------------------------------------------------------
// Normalizadores principales
// ---------------------------------------------------------------------------

export async function getLeadsData(): Promise<NormalizedLead[]> {
  const ds = await getDataset();
  if (ds.contacts.length === 0) {
    const mockLeads = getLeads();
    const mockAdvisors = getAdvisors();
    const sampleCourses = [
      "Marketing Digital",
      "Excel Profesional",
      "Asistente Contable",
      "Ofimática",
      "CapCut",
      "Inteligencia Artificial",
      "Canva & Diseño",
      "Finanzas Prácticas",
    ];
    const sampleModalities: ("Presencial" | "Virtual")[] = ["Presencial", "Virtual"];

    return mockLeads.map((l, i): NormalizedLead => {
      const adv = mockAdvisors[i % mockAdvisors.length];
      const isWon = l.status === "Calificado";
      const isLost = l.status === "Perdido";
      const course = sampleCourses[i % sampleCourses.length] ?? "General";
      const modality: "Presencial" | "Virtual" =
        sampleModalities[i % sampleModalities.length] ?? "Virtual";
      const paymentStatus: NormalizedLead["paymentStatus"] = isWon
        ? i % 3 === 0
          ? "Abono"
          : "Pago completo"
        : isLost
          ? "Sin pago"
          : i % 4 === 0
            ? "Abono"
            : "Pendiente";
      const total = 297;
      const deposit =
        paymentStatus === "Pago completo" ? 297 : paymentStatus === "Abono" ? 75 : 0;

      return {
        ...l,
        assignedTo: adv?.id ?? null,
        ownerName: adv?.name ?? "Sin asignar",
        oppAssignedTo: adv?.id ?? null,
        oppDate: l.date,
        oppStatus: isWon ? "won" : isLost ? "lost" : "open",
        course,
        modality,
        paymentStatus,
        deposit,
        total,
        saldo: Math.max(0, total - deposit),
      };
    });
  }
  const userNames = new Map(ds.users.map((u) => [u.id, u.name || u.email || "Sin asignar"]));
  const mapping = getFieldMappings();
  const oppByContact = new Map<string, RawOpportunity>();
  for (const o of ds.opportunities) {
    if (o.contactId && !oppByContact.has(o.contactId)) oppByContact.set(o.contactId, o);
  }

  const deriveStatus = (c: RawContact): Lead["status"] => {
    const opp = c.id ? oppByContact.get(c.id) : undefined;
    const s = (opp?.status ?? "").toLowerCase();
    if (s.includes("won") || s.includes("gan") || s.includes("closed") || s.includes("pag"))
      return "Calificado";
    if (s.includes("lost") || s.includes("perd")) return "Perdido";
    if (opp) return "Contactado";
    return "Nuevo";
  };

  return ds.contacts
    .map((c): NormalizedLead => {
      const tags = (c.tags ?? []).filter(Boolean);
      const opp = c.id ? oppByContact.get(c.id) : undefined;
      const ownerRaw = findField(c.customFields, mapping, "owner", [
        "propietario",
        "asesor",
        "responsable",
      ]);
      const ownerAssignedId = opp?.assignedTo ?? c.assignedTo ?? null;
      const ownerName =
        ownerRaw ||
        (ownerAssignedId ? (userNames.get(ownerAssignedId) ?? "Sin asignar") : undefined) ||
        "Sin asignar";

      const resolved = resolveCourseAndPayment(c, opp, mapping);

      const attr = (c as any).attributionSource || (c as any).lastAttributionSource || {};

      const internalSource =
        findField(c.customFields, mapping, "internalSource" as any, [
          "internal-source-lead",
          "internal_source_lead",
          "internal source lead",
          "internal-source",
          "internal_source",
          "origen lead",
        ]) ||
        c.source ||
        attr.utmSource ||
        attr.sessionSource ||
        "Interno Directo";

      const campaign =
        attr.campaign ||
        attr.utmCampaign ||
        findField(c.customFields, mapping, "campaign", [
          "campaña",
          "campaign",
          "nombre campaña",
          "utm_campaign",
          "origen lead",
        ]) ||
        tags.find((t) => /^campa[ñn]a:|^camp:/i.test(t))?.replace(/^[^:]+:\s*/, "") ||
        opp?.source ||
        (c.source ? `Campaña ${c.source}` : "Campaña Principal");

      const adName =
        attr.utmContent ||
        attr.adName ||
        findField(c.customFields, mapping, "adName" as any, [
          "anuncio",
          "nombre del anuncio",
          "nombre anuncio",
          "ad_name",
          "ad name",
          "creativo",
          "utm_content",
        ]) ||
        tags.find((t) => /^anuncio:|^ad:/i.test(t))?.replace(/^[^:]+:\s*/, "") ||
        (attr.adId ? `Anuncio ID: ${attr.adId}` : "—");

      return {
        id: c.id,
        name: fullName(c),
        email: c.email ?? "",
        phone: c.phone ?? "",
        source: c.source ?? internalSource,
        date: toISODate(c.dateAdded),
        status: deriveStatus(c),
        tags,
        assignedTo: c.assignedTo ?? null,
        ownerName,
        oppAssignedTo: opp?.assignedTo ?? null,
        oppDate: toISODate(opp?.createdAt || opp?.updatedAt || c.dateAdded),
        oppStatus: opp?.status ?? "",
        course: resolved.course,
        modality: resolved.modality,
        paymentStatus: resolved.paymentStatus,
        deposit: resolved.deposit,
        total: resolved.total,
        saldo: resolved.saldo,
        campaign,
        adName,
        internalSource,
      };
    })
    .filter((l) => l.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getCustomersData(): Promise<NormalizedCustomer[]> {
  const ds = await getDataset();
  if (ds.contacts.length === 0) {
    return mockCustomers.map((c): NormalizedCustomer => ({
      ...c,
      rawId: c.id,
      modality: c.modality || "Virtual",
    }));
  }
  const userNames = new Map(ds.users.map((u) => [u.id, u.name || u.email || "Sin asignar"]));

  const salesOpps = ds.salesPipelineId
    ? ds.opportunities.filter((o) => o.pipelineId === ds.salesPipelineId)
    : ds.opportunities;

  const oppByContact = new Map<string, RawOpportunity>();
  for (const o of salesOpps) {
    if (o.contactId && !oppByContact.has(o.contactId)) oppByContact.set(o.contactId, o);
  }

  const mapping = getFieldMappings();
  return ds.contacts
    .filter((c) => oppByContact.has(c.id))
    .map((c): NormalizedCustomer => {
      const opp = oppByContact.get(c.id);
      const cf = c.customFields;
      const course =
        findField(cf, mapping, "course", ["curso", "programa", "producto"]) || opp?.name || "—";
      const modality = findField(cf, mapping, "modality", ["modalidad", "modal"]);
      const scheduleRaw = findField(cf, mapping, "schedule", ["horario", "turno", "jornada"]);
      const schedule: CourseSchedule = normalizeSchedule(scheduleRaw);
      const deposit = Number(
        findField(cf, mapping, "deposit", ["abono", "abonado", "pago parcial", "anticipo"]) || "0",
      );
      const total = Number(
        opp?.monetaryValue || findField(cf, mapping, "total", ["total", "valor", "precio"]) || "0",
      );
      const paymentStatus: "Pago completo" | "Abono" =
        deposit && total && deposit < total ? "Abono" : "Pago completo";
      const campaign =
        findField(cf, mapping, "campaign", ["campaña", "campaign", "origen lead", "fuente"]) ||
        opp?.source ||
        c.source ||
        "—";
      const ownerRaw = findField(cf, mapping, "owner", ["propietario", "asesor", "responsable"]);
      const ownerAssignedId = opp?.assignedTo ?? c.assignedTo ?? null;
      const owner =
        ownerRaw ||
        (ownerAssignedId ? (userNames.get(ownerAssignedId) ?? "Sin asignar") : "Sin asignar");
      const saleDateRaw = findField(cf, mapping, "saleDate", [
        "fecha venta",
        "fecha de venta",
        "fecha",
      ]);
      const saleDate = toISODate(saleDateRaw || opp?.createdAt || opp?.updatedAt || c.dateAdded);

      return {
        id: c.id,
        rawId: c.id,
        name: fullName(c),
        email: c.email ?? "",
        phone: c.phone ?? "",
        location: "",
        orders: 1,
        spent: total,
        since: toISODate(c.dateAdded),
        tier: "Oro",
        owner,
        deposit: deposit || total,
        paymentStatus,
        course,
        modality,
        schedule,
        saleDate,
        campaign,
      };
    })
    .filter((c) => c.saleDate)
    .sort((a, b) => (a.saleDate < b.saleDate ? 1 : -1));
}

export function extractContactCourse(
  contact: RawContact | undefined,
  opp: RawOpportunity | undefined,
  mapping: FieldMapping,
): string {
  const cf: any[] = contact?.customFields ?? [];
  const oppCf: any[] = (opp as any)?.customFields ?? [];
  const allCf = [...cf, ...oppCf];

  // 1. Buscar específicamente por el campo curso_que_aplica (por ID exacto o fieldKey)
  const knownCourseIds = ["idR8NE8XqMKkCArqPMFJ", "YuMLXHJIE84l7qdpJLzm"];
  for (const id of knownCourseIds) {
    const hit = allCf.find((f) => f && f.id === id);
    if (hit?.value !== undefined && hit.value !== null && String(hit.value).trim() !== "") {
      const val = Array.isArray(hit.value) ? hit.value.join(", ") : String(hit.value).trim();
      if (val) return val;
    }
  }

  // Buscar por coincidencia en fieldKey o nombre del campo
  for (const f of allCf) {
    if (!f) continue;
    const key = String(f.fieldKey || f.key || "").toLowerCase();
    const name = String(f.name || "").toLowerCase();
    if (
      key === "contact.curso_que_aplica" ||
      key === "curso_que_aplica" ||
      key.includes("curso_que_aplica") ||
      name.includes("curso_que_aplica") ||
      name.includes("curso que aplica")
    ) {
      if (f.value !== undefined && f.value !== null && String(f.value).trim() !== "") {
        const val = Array.isArray(f.value) ? f.value.join(", ") : String(f.value).trim();
        if (val) return val;
      }
    }
  }

  // 2. Mapeo configurado en ajustes y palabras clave
  if (cf.length > 0) {
    const fromMapping = findField(cf, mapping, "course", [
      "curso_que_aplica",
      "curso que aplica",
      "curso",
      "programa",
      "producto",
    ]);
    if (fromMapping && fromMapping.trim()) {
      return fromMapping.trim();
    }
  }

  // 3. Heurística completa (resolveCourseAndPayment que evalúa tags y aliases)
  if (contact) {
    const resolved = resolveCourseAndPayment(contact, opp, mapping);
    if (resolved.course && resolved.course !== "General") {
      return resolved.course;
    }
  }

  // 4. Tags de la oportunidad o contacto
  const tags: string[] = [
    ...(contact?.tags ?? []),
    ...((opp as any)?.contact?.tags ?? []),
    ...((opp as any)?.tags ?? []),
  ];
  for (const t of tags) {
    const low = t.toLowerCase();
    if (low.includes("cconta") || low.includes("contable")) return "Asistente Contable";
    if (low.includes("mrk") || low.includes("marketing")) return "Marketing Digital";
    if (low.includes("excel")) return "Excel Profesional";
    if (low.includes("ofimat") || low.includes("office")) return "Ofimática";
    if (low.includes("capcut")) return "CapCut";
    if (low.includes("ia") || low.includes("artificial") || low.includes("chatgpt")) return "Inteligencia Artificial";
    if (low.includes("canva")) return "Canva & Diseño";
    if (low.includes("finanz")) return "Finanzas";
  }

  // 5. Oportunidad sólo si explícitamente contiene palabras de cursos (NUNCA nombre de estudiante)
  const oppName = (opp?.name || "").trim();
  if (
    oppName &&
    /curso|programa|taller|diplomado|marketing|mrk|excel|contab|cconta|ofimat|capcut|ia\b|artificial|canva|finanz|rmq/i.test(oppName)
  ) {
    return oppName;
  }

  return "";
}

export async function getOrdersData(): Promise<Order[]> {
  const ds = await getDataset();
  if (ds.opportunities.length === 0) {
    return mockOrders;
  }
  const contactById = new Map(ds.contacts.map((c) => [c.id, c]));
  const mapping = getFieldMappings();

  const salesOpps = ds.salesPipelineId
    ? ds.opportunities.filter((o) => o.pipelineId === ds.salesPipelineId)
    : ds.opportunities;

  const statusMap = (raw?: string): OrderStatus => {
    const s = (raw ?? "").toLowerCase();
    if (s.includes("won") || s.includes("gan") || s.includes("closed") || s.includes("pag"))
      return "Pagado";
    if (s.includes("lost") || s.includes("perd") || s.includes("fail")) return "Fallido";
    if (s.includes("refund") || s.includes("reemb")) return "Reembolsado";
    return "Pendiente";
  };

  return salesOpps
    .map((o): Order => {
      const contact = (o.contactId ? contactById.get(o.contactId) : undefined) || (o as any).contact;
      const courseName = extractContactCourse(contact, o, mapping);
      const order: Order = {
        id: `#${o.id.slice(-6).toUpperCase()}`,
        customer: o.contactName || (contact ? fullName(contact) : "—"),
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        date: toISODate(o.createdAt || o.updatedAt),
        amount: Number(o.monetaryValue || 0),
        status: statusMap(o.status),
        items: 1,
      };
      if (courseName) order.course = courseName;
      return order;
    })
    .filter((o) => o.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getAdvisorsData(): Promise<NormalizedAdvisor[]> {
  const ds = await getDataset();
  if (ds.users.length === 0) {
    const mockAdvisors = getAdvisors();
    return mockAdvisors.map((a): NormalizedAdvisor => ({
      id: a.id,
      name: a.name,
      email: a.email,
      region: a.region,
      avatarColor: a.avatarColor,
      assignedLeadIds: a.assignedLeadIds,
      salesAmount: a.salesAmount,
    }));
  }
  const leads = ds.contacts;

  const salesOpps = ds.salesPipelineId
    ? ds.opportunities.filter(
        (o) =>
          o.pipelineId === ds.salesPipelineId && String(o.status ?? "").toLowerCase() === "won",
      )
    : ds.opportunities.filter((o) => String(o.status ?? "").toLowerCase() === "won");

  return ds.users.map((u, i): NormalizedAdvisor => {
    const assigned = leads.filter(
      (c) =>
        c.assignedTo === u.id ||
        salesOpps.some((o) => o.assignedTo === u.id && o.contactId === c.id),
    );
    const salesAmount = assigned
      .filter((c) => c.status === "Calificado" || c.oppStatus?.toLowerCase() === "won")
      .reduce((s, c) => s + Number(c.deposit || c.total || 0), 0);
    return {
      id: u.id,
      name: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "Asesor",
      email: u.email ?? "",
      region: "",
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length] ?? "var(--color-primary)",
      assignedLeadIds: assigned.map((c) => c.id),
      salesAmount,
    };
  });
}

/** Lista de campos personalizados disponibles en la subcuenta (para mapeo). */
export async function getCustomFieldsList(): Promise<{ id: string; name: string }[]> {
  const fields = await safe(fetchCustomFields(), [] as any[]);
  return fields
    .map((f: any) => ({ id: f.id, name: f.name }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
}

/** Datos combinados para el dashboard principal. */
export async function getDashboardData() {
  const [leads, customers, orders, advisors] = await Promise.all([
    getLeadsData(),
    getCustomersData(),
    getOrdersData(),
    getAdvisorsData(),
  ]);
  return { leads, customers, orders, advisors };
}

/**
 * Estado de las fuentes de datos: cuáles fallaron al cargar.
 * Lo consume el banner de advertencia de la UI.
 */
export async function getSourceStatus(): Promise<{
  failedSources: string[];
  fetchedAt: number;
}> {
  const ds = await getDataset();
  return { failedSources: ds.failedSources, fetchedAt: ds.fetchedAt };
}

// Limpia el cache (útil para forzar refresco manual).
export function clearGhlCache() {
  cache = null;
  inflight = null;
}
