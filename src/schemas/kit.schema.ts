import { z } from "zod";

export const createKitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  isFavorited: z.boolean().optional(),
  items: z
    .array(
      z.object({
        productBaseId: z.string().uuid("Invalid product base ID"),
        quantity: z.number().int().positive("Quantity must be positive"),
      }),
    )
    .min(1, "At least one item is required"),
});

export const toggleFavoriteKitSchema = z.object({
  isFavorited: z.boolean(),
});
