import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { UpdateProductStockService } from "../../services/UpdateProductStockService";
import { AppError } from "../../errors/AppError";

describe("UpdateProductStockService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let updateProductStockService: UpdateProductStockService;

  beforeEach(() => {
    productRepositoryMock = {
      findById: vi.fn(),
      findByIdWithAssets: vi.fn(),
      update: vi.fn(),
      addAssets: vi.fn(),
      getAvailableAssets: vi.fn(),
      removeAssets: vi.fn(),
    };

    updateProductStockService = new UpdateProductStockService(
      productRepositoryMock as unknown as import("../../repositories/ProductRepository").ProductRepository
    );
  });

  const mockProduct = {
    id: "prod-1",
    name: "Cadeira",
    dailyPrice: 15,
    category: "MOVEIS",
    description: "",
    imageUrl: "",
  };

  const mockProductWithAssets = {
    ...mockProduct,
    assets: [
      { id: "asset-1", state: "AVAILABLE" },
      { id: "asset-2", state: "AVAILABLE" },
    ],
  };

  it("should throw an error if new stock is negative", async () => {
    await expect(
      updateProductStockService.execute({ id: "prod-1", newStockQuantity: -1 })
    ).rejects.toThrow(new AppError("Stock quantity cannot be negative.", 400));
  });

  it("should throw an error if product is not found", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(null);
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(null);

    await expect(
      updateProductStockService.execute({ id: "invalid", newStockQuantity: 5 })
    ).rejects.toThrow(new AppError("Product not found.", 404));
  });

  it("should increase stock and add new assets", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(mockProduct);
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mockProductWithAssets);
    
    // Changing from 2 to 4
    await updateProductStockService.execute({ id: "prod-1", newStockQuantity: 4 });

    expect(productRepositoryMock.addAssets).toHaveBeenCalledWith("prod-1", 2, "Cadeira");
    expect(productRepositoryMock.removeAssets).not.toHaveBeenCalled();
  });

  it("should decrease stock and remove available assets", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(mockProduct);
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mockProductWithAssets);
    
    // Mock getAvailableAssets returning 1 asset to be removed
    (productRepositoryMock.getAvailableAssets as Mock).mockResolvedValue([{ id: "asset-1" }]);
    
    // Changing from 2 to 1 (difference is -1)
    await updateProductStockService.execute({ id: "prod-1", newStockQuantity: 1 });

    expect(productRepositoryMock.addAssets).not.toHaveBeenCalled();
    expect(productRepositoryMock.getAvailableAssets).toHaveBeenCalledWith("prod-1", 1);
    expect(productRepositoryMock.removeAssets).toHaveBeenCalledWith(["asset-1"]);
  });

  it("should throw an error when trying to reduce stock below available assets", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(mockProduct);
    
    // Simulate 2 assets total, but 1 is RENTED.
    const mixedAssetsProduct = {
      ...mockProduct,
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "RENTED" },
      ],
    };
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mixedAssetsProduct);
    
    // We want to remove 2 items (changing stock from 2 to 0)
    // But getAvailableAssets only returns 1
    (productRepositoryMock.getAvailableAssets as Mock).mockResolvedValue([{ id: "asset-1" }]);

    await expect(
      updateProductStockService.execute({ id: "prod-1", newStockQuantity: 0 })
    ).rejects.toThrow(
      new AppError(
        "Cannot reduce stock by 2. Only 1 units are AVAILABLE (the rest are rented or reserved).",
        400
      )
    );
  });
});
