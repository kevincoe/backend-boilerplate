import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateQuoteService, IOrderRepository, IAssetRepository, ICustomerRepository, IProductRepository } from "../../services/CreateQuoteService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";

describe("CreateQuoteService", () => {
  let orderRepositoryMock: ReturnType<typeof vi.fn>;
  let assetRepositoryMock: ReturnType<typeof vi.fn>;
  let customerRepositoryMock: ReturnType<typeof vi.fn>;
  let productRepositoryMock: ReturnType<typeof vi.fn>;
  let createQuoteService: CreateQuoteService;

  beforeEach(() => {
    orderRepositoryMock = {
      create: vi.fn(),
      checkAssetsAvailability: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    assetRepositoryMock = {
      findAssetsByIds: vi.fn(),
      countAvailableAssetsForProduct: vi.fn(),
      findAvailableAssetsForProduct: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    customerRepositoryMock = {
      upsertCustomer: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    productRepositoryMock = {
      findById: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    createQuoteService = new CreateQuoteService(
      orderRepositoryMock as unknown as IOrderRepository,
      assetRepositoryMock as unknown as IAssetRepository,
      customerRepositoryMock as unknown as ICustomerRepository,
      productRepositoryMock as unknown as IProductRepository
    );
  });

  const validQuoteRequest = {
    customer: { name: "John", email: "john@doe.com", phone: "123", document: "123" },
    items: [{ productId: "prod-1", quantity: 2 }],
    pickUpDate: "2026-08-01",
    returnDate: "2026-08-05", // 4 days duration
  };

  it("should throw an error if a product does not exist", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(createQuoteService.execute(validQuoteRequest)).rejects.toThrow(
      new AppError("Product prod-1 not found.", 404)
    );
  });

  it("should throw an error if there is not enough stock", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue({ name: "Cadeira" });
    (assetRepositoryMock.countAvailableAssetsForProduct as Mock).mockResolvedValue(1); // Needs 2, only 1 available

    await expect(createQuoteService.execute(validQuoteRequest)).rejects.toThrow(
      new AppError('Estoque insuficiente para o produto "Cadeira". Quantidade solicitada: 2, Disponível: 1.', 409)
    );
  });

  it("should successfully create a quote and calculate totalAmount correctly", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue({ name: "Cadeira" });
    (assetRepositoryMock.countAvailableAssetsForProduct as Mock).mockResolvedValue(5);
    (assetRepositoryMock.findAvailableAssetsForProduct as Mock).mockResolvedValue([
      { id: "asset-1", product: { dailyPrice: 10 } },
      { id: "asset-2", product: { dailyPrice: 10 } },
    ]);
    (customerRepositoryMock.upsertCustomer as Mock).mockResolvedValue({ id: "cust-1" });
    (orderRepositoryMock.create as Mock).mockResolvedValue({ id: "order-123" });

    const result = await createQuoteService.execute(validQuoteRequest);

    // 5 days diff (4 + 1 day buffer), daily price 10, qty 2 => 5 * 10 * 2 = 100 totalAmount
    expect(orderRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "cust-1",
        assetIds: ["asset-1", "asset-2"],
        totalAmount: 100,
        state: OrderState.DRAFT,
      })
    );

    expect(result).toEqual({ id: "order-123" });
  });
});
