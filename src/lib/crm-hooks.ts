// Hook de React Query para consumir la vista CRM (todos los contactos y oportunidades).

import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchCrmData } from "./crm.functions";

export const CRM_QUERY_KEY = ["ghl", "crm"] as const;

export function useCrmQuery() {
  const fn = useServerFn(fetchCrmData);
  return useSuspenseQuery({
    queryKey: CRM_QUERY_KEY,
    queryFn: fn,
    // Cachea 5 min en el cliente para no refrescar al navegar.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
