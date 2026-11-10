// Hooks de React Query para el mapeo de campos.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  fetchFieldMappings,
  saveFieldMappingsFn,
  fetchCustomFieldsList,
} from "./field-mapping.functions";
import type { FieldMapping } from "./field-mapping";

export function useFieldMappingsQuery() {
  const fn = useServerFn(fetchFieldMappings);
  return useQuery({ queryKey: ["field-mappings"], queryFn: fn });
}

export function useCustomFieldsQuery() {
  const fn = useServerFn(fetchCustomFieldsList);
  return useQuery({ queryKey: ["custom-fields-list"], queryFn: fn });
}

export function useSaveFieldMappingsMutation() {
  const fn = useServerFn(saveFieldMappingsFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FieldMapping) => fn({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-mappings"] });
      // Refresca todos los datos del dashboard para que apliquen los cambios.
      qc.invalidateQueries({ queryKey: ["ghl"] });
    },
  });
}
