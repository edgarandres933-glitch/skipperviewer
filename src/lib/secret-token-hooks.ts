// Hooks de React Query para consultar, probar y guardar el Identificador Secreto.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  fetchSecretTokenStatus,
  testSecretTokenFn,
  saveSecretTokenFn,
} from "./secret-token.functions";

export function useSecretTokenStatusQuery() {
  const fn = useServerFn(fetchSecretTokenStatus);
  return useQuery({
    queryKey: ["secret-token-status"],
    queryFn: fn,
    staleTime: 1000 * 60,
  });
}

export function useTestSecretTokenMutation() {
  const fn = useServerFn(testSecretTokenFn);
  return useMutation({
    mutationFn: (data: { token: string; locationId?: string | undefined }) =>
      fn({
        data: {
          token: data.token,
          ...(data.locationId ? { locationId: data.locationId } : {}),
        },
      }),
  });
}

export function useSaveSecretTokenMutation() {
  const fn = useServerFn(saveSecretTokenFn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { token: string; locationId?: string | undefined }) =>
      fn({
        data: {
          token: data.token,
          ...(data.locationId ? { locationId: data.locationId } : {}),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secret-token-status"] });
      // Invalida todos los datos de GoHighLevel para releer con el nuevo token
      qc.invalidateQueries({ queryKey: ["ghl"] });
      qc.invalidateQueries({ queryKey: ["custom-fields-list"] });
      qc.invalidateQueries({ queryKey: ["field-mappings"] });
    },
  });
}
