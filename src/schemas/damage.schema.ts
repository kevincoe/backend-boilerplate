import { z } from "zod";

export const reportDamageSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  assetId: z.string().uuid("Asset ID must be a valid UUID"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
  estimatedCost: z
    .number()
    .positive("Estimated cost must be positive")
    .optional(),
});
