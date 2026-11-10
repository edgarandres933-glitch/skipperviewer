import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type DateRangePreset = "7d" | "30d" | "90d" | "12m" | "ytd" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  /** ISO date string (yyyy-mm-dd), inclusive */
  start: string;
  /** ISO date string (yyyy-mm-dd), inclusive */
  end: string;
  /** Human-readable label in Spanish */
  label: string;
}

export const PRESETS: { value: DateRangePreset; label: string; days: number }[] = [
  { value: "7d", label: "Últimos 7 días", days: 7 },
  { value: "30d", label: "Últimos 30 días", days: 30 },
  { value: "90d", label: "Últimos 90 días", days: 90 },
  { value: "12m", label: "Últimos 12 meses", days: 365 },
  { value: "ytd", label: "Año hasta hoy", days: 0 },
];

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatRangeLabel(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

export function rangeFromPreset(preset: DateRangePreset): DateRange {
  const end = new Date();
  const endStr = toISO(end);
  const presetMeta = PRESETS.find((p) => p.value === preset)!;
  let start: Date;
  if (preset === "ytd") {
    start = new Date(end.getFullYear(), 0, 1);
  } else {
    start = new Date(end);
    start.setDate(start.getDate() - presetMeta.days + 1);
  }
  return {
    preset,
    start: toISO(start),
    end: endStr,
    label: presetMeta.label,
  };
}

/** Construye un intervalo personalizado a partir de dos fechas (inclusive). */
export function customRange(start: string, end: string): DateRange {
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  return {
    preset: "custom",
    start: lo,
    end: hi,
    label: formatRangeLabel(lo, hi),
  };
}

/** True when an ISO date (yyyy-mm-dd) falls within [start, end] inclusive. */
export function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

interface DateRangeContextValue {
  range: DateRange;
  setRange: (preset: DateRangePreset) => void;
  setCustomRange: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  // Por defecto mostramos los últimos 3 meses (90 días) para que la
  // información relevante siempre esté cargada sin tener que actualizar.
  const [range, setRangeState] = useState<DateRange>(() => rangeFromPreset("90d"));

  const value = useMemo<DateRangeContextValue>(
    () => ({
      range,
      setRange: (preset) => setRangeState(rangeFromPreset(preset)),
      setCustomRange: (start, end) => setRangeState(customRange(start, end)),
    }),
    [range],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange debe usarse dentro de DateRangeProvider");
  return ctx;
}
