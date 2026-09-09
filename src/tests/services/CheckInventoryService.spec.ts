import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  CheckInventoryService,
  IProductRepository,
  IAssetRepository,
} from "../../services/CheckInventoryService";
import { AppError } from "../../errors/AppError";

describe("CheckInventoryService", () => {
  let productRepositoryMock: {
    findByIdWithAssets: Mock;
  };
  let assetRepositoryMock: {
    countAvailableAssetsForProduct: Mock;
  };
  let checkInventoryService: CheckInventoryService;

  beforeEach(() => {
    productRepositoryMock = {
      findByIdWithAssets: vi.fn(),
    };

    assetRepositoryMock = {
      countAvailableAssetsForProduct: vi.fn(),
    };

    checkInventoryService = new CheckInventoryService(
      productRepositoryMock as unknown as IProductRepository,
      assetRepositoryMock as unknown as IAssetRepository,
    );
  });

  const validInput = {
    productIds: ["prod-1"],
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2026-08-10T00:00:00.000Z",
  };

  it("should return availability for each product", async () => {
    productRepositoryMock.findByIdWithAssets.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "RENTED" },
        { id: "asset-3", state: "AVAILABLE" },
      ],
    });
    assetRepositoryMock.countAvailableAssetsForProduct.mockResolvedValue(2);

    const result = await checkInventoryService.execute(validInput);

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual({
      productId: "prod-1",
      productName: "Chair",
      totalAssets: 3,
      availableAssets: 2,
      reservedAssets: 1,
    });
    expect(result.checkedAt).toBeDefined();
  });

  it("should handle multiple products", async () => {
    productRepositoryMock.findByIdWithAssets
      .mockResolvedValueOnce({
        id: "prod-1",
        name: "Chair",
        assets: [{ id: "a1" }, { id: "a2" }],
      })
      .mockResolvedValueOnce({
        id: "prod-2",
        name: "Table",
        assets: [{ id: "a3" }, { id: "a4" }, { id: "a5" }],
      });

    assetRepositoryMock.countAvailableAssetsForProduct
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);

    const input = {
      ...validInput,
      productIds: ["prod-1", "prod-2"],
    };

    const result = await checkInventoryService.execute(input);

    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toEqual({
      productId: "prod-1",
      productName: "Chair",
      totalAssets: 2,
      availableAssets: 1,
      reservedAssets: 1,
    });
    expect(result.products[1]).toEqual({
      productId: "prod-2",
      productName: "Table",
      totalAssets: 3,
      availableAssets: 3,
      reservedAssets: 0,
    });
  });

  it("should throw an error when a product is not found", async () => {
    productRepositoryMock.findByIdWithAssets.mockResolvedValue(null);

    await expect(checkInventoryService.execute(validInput)).rejects.toThrow(
      new AppError("Product prod-1 not found.", 404),
    );
  });

  it("should throw an error when product IDs array is empty", async () => {
    const emptyInput = {
      ...validInput,
      productIds: [],
    };

    await expect(checkInventoryService.execute(emptyInput)).rejects.toThrow(
      new AppError("At least one product ID is required", 400),
    );
  });

  it("should throw an error when end date is before start date", async () => {
    const invalidInput = {
      ...validInput,
      startDate: "2026-08-10T00:00:00.000Z",
      endDate: "2026-08-01T00:00:00.000Z",
    };

    await expect(checkInventoryService.execute(invalidInput)).rejects.toThrow(
      new AppError("End date must be after start date", 400),
    );
  });

  it("should return zero available when all assets are reserved", async () => {
    productRepositoryMock.findByIdWithAssets.mockResolvedValue({
      id: "prod-1",
      name: "Chair",
      assets: [{ id: "a1" }, { id: "a2" }, { id: "a3" }],
    });
    assetRepositoryMock.countAvailableAssetsForProduct.mockResolvedValue(0);

    const result = await checkInventoryService.execute(validInput);

    expect(result.products[0]).toEqual({
      productId: "prod-1",
      productName: "Chair",
      totalAssets: 3,
      availableAssets: 0,
      reservedAssets: 3,
    });
  });
});
