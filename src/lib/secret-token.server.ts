// Server-only: gestión y persistencia del Identificador Secreto (PIT) y subcuenta de GoHighLevel.
import fs from "node:fs";
import path from "node:path";
import {
  getLocationId,
  setLocationId,
  getSecretToken,
  setSecretToken,
} from "./ghl-api.server";
import { clearGhlCache } from "./ghl.server";

const API_VERSION = "2021-07-28";
const GHL_BASE = "https://services.leadconnectorhq.com";

/**
 * Actualiza pares clave=valor en el archivo .env de forma persistente.
 */
function updateEnvFile(updates: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content = content.trimEnd() + (content.length > 0 ? "\n" : "") + `${key}=${value}\n`;
    }
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

/**
 * Enmascara un token para mostrarlo seguro en el cliente (ej: pit-a867••••••••••••••••••••••••7f9ac5).
 */
export function maskToken(token: string): string {
  if (!token) return "";
  const trimmed = token.trim();
  if (trimmed.length <= 10) return "••••••••";
  const start = trimmed.slice(0, 8);
  const end = trimmed.slice(-6);
  return `${start}${"•".repeat(Math.max(8, trimmed.length - 14))}${end}`;
}

/**
 * Prueba la validez del Identificador Secreto y Location ID contra la API de GoHighLevel.
 */
export async function testGhlConnection(
  token: string,
  locationId?: string,
): Promise<{ ok: boolean; message: string; usersCount?: number }> {
  const effectiveToken = (token || "").trim();
  const effectiveLoc = (locationId || getLocationId() || "").trim();

  if (!effectiveToken) {
    return { ok: false, message: "Debes ingresar un Identificador Secreto." };
  }

  try {
    const url = `${GHL_BASE}/users/?locationId=${encodeURIComponent(effectiveLoc)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${effectiveToken}`,
        Version: API_VERSION,
        Accept: "application/json",
      },
    });

    if (res.status === 200) {
      const data = (await res.json()) as { users?: unknown[] };
      const usersCount = data.users?.length ?? 0;
      return {
        ok: true,
        message: `Conexión exitosa. Se validó la subcuenta (${usersCount} usuarios encontrados).`,
        usersCount,
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message:
          "El Identificador Secreto es inválido o no tiene permisos de lectura suficientes (Error " +
          res.status +
          ").",
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        message:
          "No se encontró la ubicación con el Location ID especificado. Verifica el ID de subcuenta.",
      };
    }

    const text = await res.text().catch(() => "");
    return {
      ok: false,
      message: `Error al verificar con GoHighLevel (HTTP ${res.status}): ${text.slice(0, 180)}`,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Error de red al conectar con GoHighLevel: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Retorna el estado actual de las credenciales configuradas.
 */
export async function getGhlCredentialsInfo(): Promise<{
  configured: boolean;
  maskedToken: string;
  rawToken: string;
  locationId: string;
  isLive: boolean;
}> {
  const currentToken = getSecretToken();
  const currentLoc = getLocationId();

  let isLive = false;
  if (currentToken) {
    const test = await testGhlConnection(currentToken, currentLoc);
    isLive = test.ok;
  }

  return {
    configured: Boolean(currentToken),
    maskedToken: maskToken(currentToken),
    rawToken: currentToken,
    locationId: currentLoc,
    isLive,
  };
}

/**
 * Guarda el Identificador Secreto (y opcionalmente Location ID) en memoria y en .env,
 * limpia la caché y revalida.
 */
export async function saveGhlCredentials(
  token: string,
  locationId?: string,
): Promise<{ ok: boolean; message: string; maskedToken: string }> {
  const cleanToken = token.trim();
  const cleanLoc = (locationId || getLocationId()).trim();

  // Validar primero antes de persistir
  const test = await testGhlConnection(cleanToken, cleanLoc);
  if (!test.ok) {
    return {
      ok: false,
      message: test.message,
      maskedToken: maskToken(cleanToken),
    };
  }

  // Actualizar en memoria activa
  setSecretToken(cleanToken);
  setLocationId(cleanLoc);

  // Persistir en .env
  updateEnvFile({
    GHL_PRIVATE_TOKEN: cleanToken,
    GHL_LOCATION_ID: cleanLoc,
  });

  // Limpiar la caché de datos de la subcuenta para que se actualice de inmediato
  clearGhlCache();

  return {
    ok: true,
    message: "Identificador Secreto guardado correctamente. La subcuenta está sincronizada.",
    maskedToken: maskToken(cleanToken),
  };
}
