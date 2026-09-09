import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { DeleteProductService } from "../../services/DeleteProductService";
import { AppError } from "../../errors/AppError";
import { Prisma } from "@prisma/client";

describe("DeleteProductService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let deleteProductService: DeleteProductService;

  beforeEach(() => {
    productRepositoryMock = {
      findByIdWithAssets: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    deleteProductService = new DeleteProductService(
      productRepositoryMock as unknown as import("../../repositories/ProductRepository").ProductRepository
    );
  });

  it("should throw an error if product is not found", async () => {
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(null);
    (productRepositoryMock.update as Mock).mockResolvedValue(null);

    await expect(deleteProductService.execute("invalid-id")).rejects.toThrow(
      new AppError("Product not found.", 404)
    );
  });

  it("should throw an error if product has rented or reserved assets", async () => {
    const mockData = {
      id: "prod-1",
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "RENTED" },
      ],
    };
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mockData);
    (productRepositoryMock.update as Mock).mockResolvedValue(mockData);

    await expect(deleteProductService.execute("prod-1")).rejects.toThrow(
      new AppError(
        "Cannot delete this product because there are rented or reserved assets associated with it. Remove them from available stock first.",
        400
      )
    );
  });

  it("should delete the product if all assets are AVAILABLE", async () => {
    const mockData = {
      id: "prod-1",
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "AVAILABLE" },
      ],
    };
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mockData);
    (productRepositoryMock.update as Mock).mockResolvedValue(mockData);

    const result = await deleteProductService.execute("prod-1");

    expect(productRepositoryMock.delete).toHaveBeenCalledWith("prod-1");
    expect(result).toEqual({ success: true });
  });

  it("should gracefully handle Prisma P2003 foreign key constraint errors", async () => {
    const mockData = {
      id: "prod-1",
      assets: [{ id: "asset-1", state: "AVAILABLE" }],
    };
    (productRepositoryMock.findByIdWithAssets as Mock).mockResolvedValue(mockData);
    (productRepositoryMock.update as Mock).mockResolvedValue(mockData);

    // Simulate a foreign key constraint failure
    const prismaError = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
      code: "P2003",
      clientVersion: "7.8.0",
    });
    
    (productRepositoryMock.delete as Mock).mockRejectedValue(prismaError);

    await expect(deleteProductService.execute("prod-1")).rejects.toThrow(
      new AppError(
        "Cannot delete this product because it has rental history in previous orders. Consider setting its stock to zero instead.",
        400
      )
    );
  });
});
