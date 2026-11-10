// Hooks de React Query para consumir las funciones de servidor de la subcuenta.
// Browser-safe: importa solo ghl.functions.ts (wrappers delgados).

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  fetchLeads,
  fetchCustomers,
  fetchOrders,
  fetchAdvisors,
  fetchDashboard,
  fetchAdvisorById,
  fetchSourceStatus,
} from "./ghl.functions";

export const GHL_QUERY_KEYS = {
  leads: ["ghl", "leads"] as const,
  customers: ["ghl", "customers"] as const,
  orders: ["ghl", "orders"] as const,
  advisors: ["ghl", "advisors"] as const,
  dashboard: ["ghl", "dashboard"] as const,
  sourceStatus: ["ghl", "source-status"] as const,
  advisor: (id: string) => ["ghl", "advisor", id] as const,
};

// Los datos de la subcuenta se cachean 5 minutos en el cliente para que
// navegar entre páginas NO dispare un refetch cada vez. El servidor además
// mantiene su propio cache (10 min) con deduplicación, así que la información
// de los últimos 3 meses siempre queda disponible sin tener que actualizar.
const STALE_TIME = 5 * 60 * 1000; // 5 min

/** Hook de carga con suspense para usar en loaders / componentes. */
export function useLeadsQuery() {
  const fn = useServerFn(fetchLeads);
  return useSuspenseQuery({
    queryKey: GHL_QUERY_KEYS.leads,
    queryFn: fn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCustomersQuery() {
  const fn = useServerFn(fetchCustomers);
  return useSuspenseQuery({
    queryKey: GHL_QUERY_KEYS.customers,
    queryFn: fn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useOrdersQuery() {
  const fn = useServerFn(fetchOrders);
  return useSuspenseQuery({
    queryKey: GHL_QUERY_KEYS.orders,
    queryFn: fn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useAdvisorsQuery() {
  const fn = useServerFn(fetchAdvisors);
  return useSuspenseQuery({
    queryKey: GHL_QUERY_KEYS.advisors,
    queryFn: fn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useDashboardQuery() {
  const fn = useServerFn(fetchDashboard);
  return useSuspenseQuery({
    queryKey: GHL_QUERY_KEYS.dashboard,
    queryFn: fn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useAdvisorQuery(id: string) {
  const fn = useServerFn(fetchAdvisorById);
  return useQuery({
    queryKey: GHL_QUERY_KEYS.advisor(id),
    queryFn: () => fn({ data: { id } }),
    enabled: !!id,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

/**
 * Estado de las fuentes de datos (cuáles fallaron).
 * Usa useQuery (no suspense) para no bloquear el render de la página.
 */
export function useSourceStatusQuery() {
  const fn = useServerFn(fetchSourceStatus);
  return useQuery({
    queryKey: GHL_QUERY_KEYS.sourceStatus,
    queryFn: fn,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
