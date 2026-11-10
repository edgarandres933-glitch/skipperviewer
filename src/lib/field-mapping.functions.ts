// Wrappers delgados con createServerFn para exponer el mapeo de campos
// y la lista de campos personalizados de la subcuenta al cliente.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getFieldMappings, saveFieldMappings } from "./field-mapping.server";
import { getCustomFieldsList, clearGhlCache } from "./ghl.server";

const mappingSchema = z.object({
  course: z.string(),
  modality: z.string(),
  schedule: z.string(),
  deposit: z.string(),
  total: z.string(),
  campaign: z.string(),
  saleDate: z.string(),
  owner: z.string(),
});

export const fetchFieldMappings = createServerFn({ method: "GET" }).handler(async () => {
  return getFieldMappings();
});

export const saveFieldMappingsFn = createServerFn({ method: "POST" })
  .validator((data) => mappingSchema.parse(data))
  .handler(async ({ data }) => {
    const saved = saveFieldMappings(data);
    // Limpia el cache de la API para que los datos se relean con el nuevo mapeo.
    clearGhlCache();
    return saved;
  });

export const fetchCustomFieldsList = createServerFn({ method: "GET" }).handler(async () => {
  return getCustomFieldsList();
});
