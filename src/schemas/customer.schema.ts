import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  document: z.string().min(11, "Document must be at least 11 characters"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
  document: z.string().min(11, "Document must be at least 11 characters").optional(),
  score: z.number().int().optional(),
});
