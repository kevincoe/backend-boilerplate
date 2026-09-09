import { z } from "zod";

export const calculatePricingSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid("Invalid Product ID"),
          quantity: z.number().int().positive("Quantity must be positive"),
        }),
      )
      .min(1, "At least one item is required"),
    pickUpDate: z
      .string()
      .datetime("Invalid pick-up date format (ISO 8601 required)"),
    returnDate: z
      .string()
      .datetime("Invalid return date format (ISO 8601 required)"),
    discountCode: z.string().optional(),
  })
  .refine((data) => new Date(data.pickUpDate) < new Date(data.returnDate), {
    message: "Return date must be after pick-up date",
    path: ["returnDate"],
  });
