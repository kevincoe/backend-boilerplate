import { z } from "zod";

export const checkInventorySchema = z
  .object({
    productIds: z
      .array(z.string().uuid("Each product ID must be a valid UUID"))
      .min(1, "At least one product ID is required"),
    startDate: z
      .string()
      .datetime("Invalid start date format (ISO 8601 required)"),
    endDate: z
      .string()
      .datetime("Invalid end date format (ISO 8601 required)"),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });
