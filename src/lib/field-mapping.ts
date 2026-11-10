// Definiciones de mapeo de campos (browser-safe).
// Cada clave semántica se asocia a un campo personalizado de la subcuenta.

export type SemanticFieldKey =
  "course" | "modality" | "schedule" | "deposit" | "total" | "campaign" | "saleDate" | "owner";

export interface FieldMapping extends Record<SemanticFieldKey, string> {}

export const MAPPING_KEYS: SemanticFieldKey[] = [
  "course",
  "modality",
  "schedule",
  "deposit",
  "total",
  "campaign",
  "saleDate",
  "owner",
];

export const FIELD_LABELS: Record<SemanticFieldKey, string> = {
  course: "Nombre del curso",
  modality: "Modalidad",
  schedule: "Horario del curso",
  deposit: "Abono / pago parcial",
  total: "Pago total",
  campaign: "Campaña",
  saleDate: "Fecha de venta",
  owner: "Propietario del lead",
};

export const FIELD_HINTS: Record<SemanticFieldKey, string> = {
  course: "Campo donde se guarda el nombre del curso contratado.",
  modality: "Modalidad del curso (Virtual, Presencial, etc.).",
  schedule: "Jornada del curso: Mañana, Tarde o Noche.",
  deposit: "Monto abonado como pago parcial.",
  total: "Valor total de la venta.",
  campaign: "Nombre de la campaña de origen del lead.",
  saleDate: "Fecha de venta (si no usas la de la oportunidad).",
  owner: "Asesor propietario (si no usas el asignado nativo).",
};

/**
 * Mapeo por defecto con los fieldKey reales de la subcuenta.
 * campaign, saleDate y owner se resuelven desde la oportunidad
 * (source / createdAt / assignedTo) cuando el mapeo está vacío.
 */
export const DEFAULT_MAPPING: FieldMapping = {
  course: "curso_que_aplica",
  modality: "modalidad",
  schedule: "horario",
  deposit: "abono",
  total: "valor_total",
  campaign: "",
  saleDate: "",
  owner: "",
};

/** Token usado en el UI para representar "Automático" (Radix no admite valor vacío). */
export const AUTO_VALUE = "__auto__";
