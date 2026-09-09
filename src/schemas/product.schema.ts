import { z } from "zod";
import { ProductCategory } from "@prisma/client";

export const searchProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory),
  pricePerDay: z.number().positive("Price per day must be greater than zero"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  imageUrl: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  pricePerDay: z.number().positive().optional(),
  imageUrl: z.string().optional(),
});

export const updateStockSchema = z.object({
  newStockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
});
