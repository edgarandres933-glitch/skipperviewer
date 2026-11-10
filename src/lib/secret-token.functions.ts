// Server functions para consultar, probar y guardar el Identificador Secreto de GoHighLevel.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getGhlCredentialsInfo,
  testGhlConnection,
  saveGhlCredentials,
} from "./secret-token.server";

const credentialsSchema = z.object({
  token: z.string().min(1, "El Identificador Secreto es requerido"),
  locationId: z.string().optional(),
});

export const fetchSecretTokenStatus = createServerFn({ method: "GET" }).handler(async () => {
  return getGhlCredentialsInfo();
});

export const testSecretTokenFn = createServerFn({ method: "POST" })
  .validator((data) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    return testGhlConnection(data.token, data.locationId);
  });

export const saveSecretTokenFn = createServerFn({ method: "POST" })
  .validator((data) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    return saveGhlCredentials(data.token, data.locationId);
  });
