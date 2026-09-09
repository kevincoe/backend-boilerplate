import { z } from "zod";

export const createContactSchema = z.object({
  customerId: z.string().uuid("customerId must be a valid UUID"),
  type: z.enum(["EMAIL", "PHONE", "WHATSAPP", "IN_PERSON", "OTHER"]),
  value: z.string().min(1, "Value is required"),
  label: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const updateContactSchema = z.object({
  type: z.enum(["EMAIL", "PHONE", "WHATSAPP", "IN_PERSON", "OTHER"]).optional(),
  value: z.string().min(1, "Value is required").optional(),
  label: z.string().optional(),
  isPrimary: z.boolean().optional(),
});
