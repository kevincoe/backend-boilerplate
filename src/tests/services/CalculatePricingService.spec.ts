import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  CalculatePricingService,
  PricingInput,
} from "../../services/CalculatePricingService";
import { IProductRepository } from "../../repositories/contracts/IProductRepository";
import { AppError } from "../../errors/AppError";

describe("CalculatePricingService", () => {
  let productRepositoryMock: {
    findById: Mock;
  };
  let calculatePricingService: CalculatePricingService;

  beforeEach(() => {
    productRepositoryMock = {
      findById: vi.fn(),
    };

    calculatePricingService = new CalculatePricingService(
      productRepositoryMock as unknown as IProductRepository,
    );
  });

  const makeInput = (overrides?: Partial<PricingInput>): PricingInput => ({
    items: [{ productId: "prod-1", quantity: 2 }],
    pickUpDate: "2026-08-01T00:00:00.000Z",
    returnDate: "2026-08-04T00:00:00.000Z",
    ...overrides,
  });

  it("should calculate pricing correctly for a simple request", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      dailyPrice: 10,
    });

    const result = await calculatePricingService.execute(makeInput());

    // 3 days * 10 dailyPrice * 2 quantity = 60
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      productId: "prod-1",
      productName: "Chair",
      quantity: 2,
      dailyPrice: 10,
      days: 3,
      lineTotal: 60,
    });
    expect(result.subtotal).toBe(60);
    expect(result.discounts).toHaveLength(0);
    expect(result.total).toBe(60);
  });

  it("should apply bulk discount when total quantity is 5 or more", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      dailyPrice: 10,
    });

    const input = makeInput({
      items: [{ productId: "prod-1", quantity: 5 }],
    });

    const result = await calculatePricingService.execute(input);

    // 3 days * 10 * 5 = 150 subtotal
    expect(result.subtotal).toBe(150);
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0]).toEqual(
      expect.objectContaining({
        type: "BULK",
        percentage: 5,
        amount: 7.5, // 5% of 150
      }),
    );
    expect(result.total).toBe(142.5);
  });

  it("should apply duration discount when rental is 7+ days", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Table",
      dailyPrice: 20,
    });

    const input = makeInput({
      items: [{ productId: "prod-1", quantity: 1 }],
      pickUpDate: "2026-08-01T00:00:00.000Z",
      returnDate: "2026-08-08T00:00:00.000Z", // 7 days
    });

    const result = await calculatePricingService.execute(input);

    // 7 days * 20 * 1 = 140 subtotal
    expect(result.subtotal).toBe(140);
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0]).toEqual(
      expect.objectContaining({
        type: "DURATION",
        percentage: 10,
        amount: 14, // 10% of 140
      }),
    );
    expect(result.total).toBe(126);
  });

  it("should apply both bulk and duration discounts when applicable", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Table",
      dailyPrice: 10,
    });

    const input = makeInput({
      items: [{ productId: "prod-1", quantity: 6 }],
      pickUpDate: "2026-08-01T00:00:00.000Z",
      returnDate: "2026-08-10T00:00:00.000Z", // 9 days
    });

    const result = await calculatePricingService.execute(input);

    // 9 days * 10 * 6 = 540 subtotal
    expect(result.subtotal).toBe(540);
    expect(result.discounts).toHaveLength(2);

    const bulkDiscount = result.discounts.find((d) => d.type === "BULK");
    const durationDiscount = result.discounts.find((d) => d.type === "DURATION");

    expect(bulkDiscount).toEqual(
      expect.objectContaining({
        type: "BULK",
        percentage: 5,
        amount: 27, // 5% of 540
      }),
    );
    expect(durationDiscount).toEqual(
      expect.objectContaining({
        type: "DURATION",
        percentage: 10,
        amount: 54, // 10% of 540
      }),
    );
    // total = 540 - 27 - 54 = 459
    expect(result.total).toBe(459);
  });

  it("should apply a valid discount code", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      dailyPrice: 50,
    });

    const input = makeInput({
      items: [{ productId: "prod-1", quantity: 1 }],
      discountCode: "WELCOME10",
    });

    const result = await calculatePricingService.execute(input);

    // 3 days * 50 * 1 = 150 subtotal
    expect(result.subtotal).toBe(150);
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0]).toEqual(
      expect.objectContaining({
        type: "CODE",
        percentage: 10,
        amount: 15, // 10% of 150
      }),
    );
    expect(result.total).toBe(135);
  });

  it("should throw an error for an invalid discount code", async () => {
    productRepositoryMock.findById.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      dailyPrice: 10,
    });

    const input = makeInput({ discountCode: "INVALID" });

    await expect(calculatePricingService.execute(input)).rejects.toThrow(
      new AppError("Invalid discount code: INVALID", 400),
    );
  });

  it("should throw an error when items array is empty", async () => {
    const input = makeInput({ items: [] });

    await expect(calculatePricingService.execute(input)).rejects.toThrow(
      new AppError("At least one item is required", 400),
    );
  });

  it("should throw an error when a product is not found", async () => {
    productRepositoryMock.findById.mockResolvedValue(null);

    const input = makeInput();

    await expect(calculatePricingService.execute(input)).rejects.toThrow(
      new AppError("Product prod-1 not found.", 404),
    );
  });

  it("should throw an error when return date is before pick-up date", async () => {
    const input = makeInput({
      pickUpDate: "2026-08-10T00:00:00.000Z",
      returnDate: "2026-08-05T00:00:00.000Z",
    });

    await expect(calculatePricingService.execute(input)).rejects.toThrow(
      new AppError("Return date must be after pick-up date", 400),
    );
  });

  it("should handle multiple items from different products", async () => {
    productRepositoryMock.findById
      .mockResolvedValueOnce({ id: "prod-1", name: "Chair", dailyPrice: 10 })
      .mockResolvedValueOnce({ id: "prod-2", name: "Table", dailyPrice: 25 });

    const input = makeInput({
      items: [
        { productId: "prod-1", quantity: 2 },
        { productId: "prod-2", quantity: 1 },
      ],
    });

    const result = await calculatePricingService.execute(input);

    // Chair: 3 * 10 * 2 = 60, Table: 3 * 25 * 1 = 75 => subtotal = 135
    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(135);
    expect(result.total).toBe(135);
  });
});
