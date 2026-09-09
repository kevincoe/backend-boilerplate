import { AppError } from "../errors/AppError";
import { IProductRepository } from "../repositories/contracts/IProductRepository";

export interface PricingInput {
  items: { productId: string; quantity: number }[];
  pickUpDate: string;
  returnDate: string;
  discountCode?: string;
}

export interface ItemPricing {
  productId: string;
  productName: string;
  quantity: number;
  dailyPrice: number;
  days: number;
  lineTotal: number;
}

export interface Discount {
  type: "BULK" | "DURATION" | "CODE";
  description: string;
  percentage: number;
  amount: number;
}

export interface PricingBreakdown {
  items: ItemPricing[];
  subtotal: number;
  discounts: Discount[];
  total: number;
}

const BULK_DISCOUNT_THRESHOLD = 5;
const BULK_DISCOUNT_PERCENTAGE = 5;
const DURATION_DISCOUNT_THRESHOLD_DAYS = 7;
const DURATION_DISCOUNT_PERCENTAGE = 10;

const DISCOUNT_CODES: Record<string, number> = {
  WELCOME10: 10,
  LOYALTY15: 15,
  SPECIAL20: 20,
};

export class CalculatePricingService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(input: PricingInput): Promise<PricingBreakdown> {
    if (input.items.length === 0) {
      throw new AppError("At least one item is required", 400);
    }

    const pickUpDate = new Date(input.pickUpDate);
    const returnDate = new Date(input.returnDate);

    if (returnDate <= pickUpDate) {
      throw new AppError("Return date must be after pick-up date", 400);
    }

    const timeDiff = returnDate.getTime() - pickUpDate.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const totalQuantity = input.items.reduce((sum, item) => sum + item.quantity, 0);

    const itemPricings: ItemPricing[] = [];

    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);

      if (!product) {
        throw new AppError(`Product ${item.productId} not found.`, 404);
      }

      const dailyPrice = Number(product.dailyPrice);
      const lineTotal = dailyPrice * days * item.quantity;

      itemPricings.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        dailyPrice,
        days,
        lineTotal,
      });
    }

    const subtotal = itemPricings.reduce((sum, item) => sum + item.lineTotal, 0);
    const discounts: Discount[] = [];

    if (totalQuantity >= BULK_DISCOUNT_THRESHOLD) {
      const bulkAmount = subtotal * (BULK_DISCOUNT_PERCENTAGE / 100);
      discounts.push({
        type: "BULK",
        description: `Bulk discount for ${totalQuantity} items (${BULK_DISCOUNT_PERCENTAGE}% off)`,
        percentage: BULK_DISCOUNT_PERCENTAGE,
        amount: bulkAmount,
      });
    }

    if (days >= DURATION_DISCOUNT_THRESHOLD_DAYS) {
      const durationAmount = subtotal * (DURATION_DISCOUNT_PERCENTAGE / 100);
      discounts.push({
        type: "DURATION",
        description: `Duration discount for ${days} days (${DURATION_DISCOUNT_PERCENTAGE}% off)`,
        percentage: DURATION_DISCOUNT_PERCENTAGE,
        amount: durationAmount,
      });
    }

    if (input.discountCode) {
      const codePercentage = DISCOUNT_CODES[input.discountCode];

      if (!codePercentage) {
        throw new AppError(`Invalid discount code: ${input.discountCode}`, 400);
      }

      const codeAmount = subtotal * (codePercentage / 100);
      discounts.push({
        type: "CODE",
        description: `Discount code "${input.discountCode}" (${codePercentage}% off)`,
        percentage: codePercentage,
        amount: codeAmount,
      });
    }

    const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0);
    const total = Math.max(subtotal - totalDiscount, 0);

    return {
      items: itemPricings,
      subtotal,
      discounts,
      total,
    };
  }
}
