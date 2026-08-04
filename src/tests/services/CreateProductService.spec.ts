import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateProductService } from "../../services/CreateProductService";

describe("CreateProductService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let createProductService: CreateProductService;

  beforeEach(() => {
    productRepositoryMock = {
      create: vi.fn(),
    };

    createProductService = new CreateProductService(productRepositoryMock as unknown as import("../../repositories/ProductRepository").ProductRepository);
  });

  it("should create a product successfully", async () => {
    const newProductRequest = {
      name: "Mesa",
      pricePerDay: 50,
      stock: 10,
      category: "MOVEIS" as import("@prisma/client").ProductCategory,
    };

    const mockResponse = {
      id: "prod-1",
      ...newProductRequest,
      dailyPrice: 50,
      assets: Array(10).fill({ state: "AVAILABLE" }),
    };

    (productRepositoryMock.create as Mock).mockResolvedValue(mockResponse);

    const result = await createProductService.execute(newProductRequest);

    expect(productRepositoryMock.create).toHaveBeenCalledWith(
      {
        name: "Mesa",
        dailyPrice: 50,
        category: "MOVEIS",
        description: undefined,
        imageUrl: undefined,
      },
      10
    );

    expect(result.id).toEqual("prod-1");
  });
});
