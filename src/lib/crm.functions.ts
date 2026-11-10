// Wrapper delgado con createServerFn para exponer la vista CRM al cliente.

import { createServerFn } from "@tanstack/react-start";
import { getCrmData } from "./crm.server";

export const fetchCrmData = createServerFn({ method: "GET" }).handler(async () => {
  return getCrmData();
});
