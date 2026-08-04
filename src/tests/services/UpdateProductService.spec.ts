import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { UpdateProductService } from "../../services/UpdateProductService";
import { AppError } from "../../errors/AppError";

describe("UpdateProductService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let updateProductService: UpdateProductService;

  beforeEach(() => {
    productRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
    };

    updateProductService = new UpdateProductService(productRepositoryMock as unknown as import("../../repositories/ProductRepository").ProductRepository);
  });

  const mockProduct = {
    id: "prod-1",
    name: "Cadeira",
    dailyPrice: 15,
    assets: [{ state: "AVAILABLE" }],
  };

  it("should throw an error if product is not found", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(updateProductService.execute({ id: "invalid" })).rejects.toThrow(
      new AppError("Produto não encontrado.", 404)
    );
  });

  it("should throw an error if pricePerDay is negative or zero", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(mockProduct);

    await expect(
      updateProductService.execute({ id: "prod-1", pricePerDay: -5 })
    ).rejects.toThrow(new AppError("O preço por dia deve ser maior que zero.", 400));
  });

  it("should successfully update a product mapping pricePerDay to dailyPrice", async () => {
    (productRepositoryMock.findById as Mock).mockResolvedValue(mockProduct);
    (productRepositoryMock.update as Mock).mockResolvedValue({
      ...mockProduct,
      dailyPrice: 20,
    });

    const result = await updateProductService.execute({
      id: "prod-1",
      name: "Cadeira Nova",
      pricePerDay: 20,
    });

    expect(productRepositoryMock.update).toHaveBeenCalledWith("prod-1", {
      name: "Cadeira Nova",
      dailyPrice: 20,
    });

    expect(result.pricePerDay).toEqual(20);
  });
});
