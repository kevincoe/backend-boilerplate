import { z } from 'zod';

export const createQuoteSchema = z.object({
  customerId: z.string().uuid("Invalid Customer ID"),
  assetIds: z.array(z.string().uuid("Invalid Asset ID")).min(1, "At least one asset is required"),
  pickUpDate: z.string().datetime("Invalid pick-up date format (ISO 8601 required)"),
  returnDate: z.string().datetime("Invalid return date format (ISO 8601 required)"),
}).refine((data) => new Date(data.pickUpDate) < new Date(data.returnDate), {
  message: "Return date must be after pick-up date",
  path: ["returnDate"],
});

export const confirmOrderSchema = z.object({
  paymentAmount: z.number().positive("Payment amount must be greater than zero"),
});