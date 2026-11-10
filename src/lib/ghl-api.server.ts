// Capa de acceso crudo a la API de la subcuenta.
// SOLO servidor: lee el token de process.env y nunca se importa desde el cliente.
// ghl.server.ts importa este módulo para construir el dataset cacheado.

const GHL_BASE = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

// Location ID de la subcuenta conectada (por defecto o desde variable).
export let LOCATION_ID = process.env["GHL_LOCATION_ID"] || "OfPmk79SLGEKgbhdmS9U";

export function setLocationId(loc: string) {
  LOCATION_ID = loc.trim();
  process.env["GHL_LOCATION_ID"] = LOCATION_ID;
}

export function getLocationId(): string {
  return LOCATION_ID;
}

let dynamicToken: string | null = null;

export function setSecretToken(token: string) {
  dynamicToken = token.trim();
  process.env["GHL_PRIVATE_TOKEN"] = dynamicToken;
}

export function getSecretToken(): string {
  return dynamicToken || process.env["GHL_PRIVATE_TOKEN"] || "";
}

function getToken(): string {
  const token = getSecretToken();
  if (!token) throw new Error("Falta el secreto GHL_PRIVATE_TOKEN");
  return token;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getToken()}`,
    Version: API_VERSION,
    Accept: "application/json",
  };
}

/** Fetch con manejo de errores, reintentos suaves y backoff para 429. */
export async function ghlFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${GHL_BASE}${path}`;
  // 4 reintentos con backoff corto. En 429 se respeta el header Retry-After
  // si está presente; si no, backoff modesto (500ms, 1s, 2s, 4s) — mucho más
  // rápido que el backoff exponencial largo anterior (que sumaba 63s por fallo).
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
    });
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delay = retryAfter
        ? Math.min(Number(retryAfter) * 1000, 10_000)
        : 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GHL ${res.status} en ${path}: ${body.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
  throw new Error(`GHL 429 persistente en ${path} tras reintentos`);
}

/**
 * Ejecuta fn sobre cada elemento con concurrencia limitada (procesa en
 * lotes de `concurrency` en paralelo). Respeta los rate limits de la API
 * sin secuencializar todo.
 */
async function mapParallel<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const worker = async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// ---------------------------------------------------------------------------
// Tipos crudos de la API
// ---------------------------------------------------------------------------

export interface RawContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  dateAdded?: string;
  source?: string;
  assignedTo?: string | null;
  contactName?: string;
  customFields?: { id: string; name: string; value: string }[];
  attributionSource?: any;
  lastAttributionSource?: any;
}

export interface RawOpportunity {
  id: string;
  name?: string;
  contactId?: string;
  contactName?: string;
  monetaryValue?: number | null;
  status?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string | null;
}

export interface RawPipeline {
  id: string;
  name?: string;
}

export interface RawUser {
  id: string;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface RawCustomField {
  id: string;
  name: string;
  fieldKey?: string;
}

// ---------------------------------------------------------------------------
// Paginación paralela: trae todos los registros
// ---------------------------------------------------------------------------

/**
 * Trae páginas de un endpoint de búsqueda.
 * Para /contacts/search: usa `pageLimit` + `page`.
 * Para /opportunities/search: la API rechaza `pageLimit` y requiere `limit` + `page` o GET /opportunities/search?location_id=...
 */
async function fetchAllContactsPages(pageLimit = 100): Promise<RawContact[]> {
  const fetchPage = async (page: number): Promise<RawContact[]> => {
    const data = await ghlFetch<{ contacts?: RawContact[] }>("/contacts/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: LOCATION_ID,
        pageLimit,
        page,
      }),
    });
    return data.contacts ?? [];
  };

  const first = await fetchPage(1);
  if (first.length === 0) return [];
  if (first.length < pageLimit) return first;
  const collected: RawContact[][] = [first];
  let page = 2;
  const MAX = 100;
  while (page <= MAX) {
    const batch = Array.from({ length: Math.min(2, MAX - page + 1) }, (_, i) => page + i);
    const pages = await mapParallel(batch, 2, fetchPage);
    let empty = false;
    for (const p of pages) {
      collected.push(p);
      if (p.length < pageLimit) {
        empty = true;
        break;
      }
    }
    if (empty) break;
    page += batch.length;
    await new Promise((r) => setTimeout(r, 200));
  }
  return collected.flat();
}

/**
 * Trae todas las oportunidades probando primero GET /opportunities/search con query params
 * y si no, POST con { location_id / locationId, limit, page }.
 */
async function fetchAllOpportunitiesPages(): Promise<RawOpportunity[]> {
  // Probar GET /opportunities/search con limit y location_id
  const tryGet = async (page: number, limit = 100): Promise<RawOpportunity[]> => {
    const qs = new URLSearchParams({
      location_id: LOCATION_ID,
      limit: String(limit),
      page: String(page),
    });
    const res = await ghlFetch<{ opportunities?: RawOpportunity[] }>(
      `/opportunities/search?${qs.toString()}`,
    );
    return res.opportunities ?? [];
  };

  // Probar POST /opportunities/search con `limit` (sin pageLimit)
  const tryPost = async (page: number, limit = 100): Promise<RawOpportunity[]> => {
    const res = await ghlFetch<{ opportunities?: RawOpportunity[] }>("/opportunities/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: LOCATION_ID,
        limit,
        page,
      }),
    });
    return res.opportunities ?? [];
  };

  // Determinar método funcional
  let fetchPage: (page: number) => Promise<RawOpportunity[]>;
  try {
    const firstGet = await tryGet(1);
    fetchPage = tryGet;
    if (firstGet.length < 100) return firstGet;
    const collected: RawOpportunity[][] = [firstGet];
    let page = 2;
    while (page <= 100) {
      const batch = Array.from({ length: Math.min(2, 100 - page + 1) }, (_, i) => page + i);
      const pages = await mapParallel(batch, 2, fetchPage);
      let empty = false;
      for (const p of pages) {
        collected.push(p);
        if (p.length < 100) {
          empty = true;
          break;
        }
      }
      if (empty) break;
      page += batch.length;
      await new Promise((r) => setTimeout(r, 200));
    }
    return collected.flat();
  } catch {
    // Si GET falla, usar POST con `limit`
    fetchPage = tryPost;
    const first = await fetchPage(1);
    if (first.length === 0) return [];
    if (first.length < 100) return first;
    const collected: RawOpportunity[][] = [first];
    let page = 2;
    while (page <= 100) {
      const batch = Array.from({ length: Math.min(2, 100 - page + 1) }, (_, i) => page + i);
      const pages = await mapParallel(batch, 2, fetchPage);
      let empty = false;
      for (const p of pages) {
        collected.push(p);
        if (p.length < 100) {
          empty = true;
          break;
        }
      }
      if (empty) break;
      page += batch.length;
      await new Promise((r) => setTimeout(r, 200));
    }
    return collected.flat();
  }
}

export function fetchAllContacts(): Promise<RawContact[]> {
  return fetchAllContactsPages();
}

export function fetchAllOpportunities(): Promise<RawOpportunity[]> {
  return fetchAllOpportunitiesPages();
}

export async function fetchUsers(): Promise<RawUser[]> {
  const qs = new URLSearchParams({ locationId: LOCATION_ID });
  const data = await ghlFetch<{ users: RawUser[] }>(`/users/?${qs.toString()}`);
  return data.users ?? [];
}

export async function fetchCustomFields(): Promise<RawCustomField[]> {
  const out: RawCustomField[] = [];
  let startAfter: string | undefined;
  let guard = 0;
  do {
    const qs = new URLSearchParams({ locationId: LOCATION_ID, limit: "100" });
    if (startAfter) qs.set("startAfter", startAfter);
    const data = await ghlFetch<{
      customFields: RawCustomField[];
      meta?: { startAfter?: string };
    }>(`/custom-fields/?${qs.toString()}`);
    out.push(...(data.customFields ?? []));
    startAfter = data.meta?.startAfter;
    guard++;
  } while (startAfter && guard < 50);
  return out;
}

export async function fetchPipelines(): Promise<RawPipeline[]> {
  const qs = new URLSearchParams({ locationId: LOCATION_ID });
  const data = await ghlFetch<{ pipelines: RawPipeline[] }>(
    `/opportunities/pipelines?${qs.toString()}`,
  );
  return data.pipelines ?? [];
}

/** Utilidad: captura errores de una promesa devolviendo un fallback. */
export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error("[GHL] fuente fallida:", err instanceof Error ? err.message : err);
    return fallback;
  }
}
