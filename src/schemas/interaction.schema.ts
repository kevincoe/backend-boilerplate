import { z } from "zod";

export const createInteractionSchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID"),
  type: z.enum([
    "NOTE",
    "CALL",
    "EMAIL",
    "MEETING",
    "QUOTE_CREATED",
    "ORDER_CONFIRMED",
    "ORDER_COMPLETED",
    "COMPLAINT",
    "FEEDBACK",
  ]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
