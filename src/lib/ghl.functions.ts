// Wrappers delgados con createServerFn para exponer los datos de la subcuenta
// al cliente. Solo importan desde ghl.server.ts (que queda fuera del bundle).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getLeadsData,
  getCustomersData,
  getOrdersData,
  getAdvisorsData,
  getDashboardData,
  getSourceStatus,
  clearGhlCache,
} from "./ghl.server";

export const fetchLeads = createServerFn({ method: "GET" }).handler(async () => {
  return getLeadsData();
});

export const fetchCustomers = createServerFn({ method: "GET" }).handler(async () => {
  return getCustomersData();
});

export const fetchOrders = createServerFn({ method: "GET" }).handler(async () => {
  return getOrdersData();
});

export const fetchAdvisors = createServerFn({ method: "GET" }).handler(async () => {
  return getAdvisorsData();
});

export const fetchDashboard = createServerFn({ method: "GET" }).handler(async () => {
  return getDashboardData();
});

export const fetchAdvisorById = createServerFn({ method: "GET" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const advisors = await getAdvisorsData();
    const advisor = advisors.find((a) => a.id === data.id);
    if (!advisor) throw new Error("Asesor no encontrado");
    const leads = await getLeadsData();
    const assigned = leads.filter((l) => advisor.assignedLeadIds.includes(l.id));
    return { advisor, leads: assigned };
  });

export const fetchSourceStatus = createServerFn({ method: "GET" }).handler(async () => {
  return getSourceStatus();
});

export const refreshGhlData = createServerFn({ method: "POST" }).handler(async () => {
  clearGhlCache();
  return { ok: true, clearedAt: new Date().toISOString() };
});
