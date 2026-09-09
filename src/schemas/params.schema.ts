import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("Parameter :id must be a valid UUID"),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid("Parameter :orderId must be a valid UUID"),
});
