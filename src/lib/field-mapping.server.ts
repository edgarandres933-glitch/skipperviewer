// Server-only: almacena la configuración de mapeo de campos en memoria.
// Se reinicia al redesplegar; al guardar se limpia el cache de la API para
// que los cambios se reflejen de inmediato en todas las secciones.

import { DEFAULT_MAPPING, type FieldMapping } from "./field-mapping";

let current: FieldMapping = { ...DEFAULT_MAPPING };

export function getFieldMappings(): FieldMapping {
  return { ...current };
}

export function saveFieldMappings(next: FieldMapping): FieldMapping {
  current = { ...next };
  return current;
}
