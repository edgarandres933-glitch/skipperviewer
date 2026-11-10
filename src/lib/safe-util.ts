// Utilidad de captura de errores con fallback. Server-safe.

export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error("[GHL] fuente fallida:", err instanceof Error ? err.message : err);
    return fallback;
  }
}
