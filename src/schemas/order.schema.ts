import { z } from 'zod';

export const createQuoteSchema = z.object({
  customer: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(10, "Phone number is too short"),
    document: z.string().min(11, "Document must be at least 11 characters")
  }),
  items: z.array(z.object({
    productId: z.string().uuid("Invalid Product ID"),
    quantity: z.number().int().positive("Quantity must be positive")
  })).min(1, "At least one item is required"),
  pickUpDate: z.string().datetime("Invalid pick-up date format (ISO 8601 required)"),
  returnDate: z.string().datetime("Invalid return date format (ISO 8601 required)"),
}).refine((data) => new Date(data.pickUpDate) < new Date(data.returnDate), {
  message: "Return date must be after pick-up date",
  path: ["returnDate"],
});

export const confirmOrderSchema = z.object({
  paymentAmount: z.number().positive("Payment amount must be greater than zero"),
});