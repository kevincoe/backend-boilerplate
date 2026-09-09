import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { SearchProductsService } from "../../services/SearchProductsService";
import { IProductRepository } from "../../repositories/contracts/IProductRepository";

describe("SearchProductsService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let searchProductsService: SearchProductsService;

  beforeEach(() => {
    productRepositoryMock = {
      findAll: vi.fn(),
    };

    searchProductsService = new SearchProductsService(
      productRepositoryMock as unknown as IProductRepository,
    );
  });

  it("should search products and format availability and stock counts correctly", async () => {
    const mockProducts = [
      {
        id: "prod-1",
        name: "Camera A7S",
        description: "Mirrorless Camera",
        dailyPrice: 150,
        imageUrl: "http://example.com/cam.jpg",
        category: "ELETRONICOS",
        assets: [
          { id: "asset-1", state: "AVAILABLE" },
          { id: "asset-2", state: "RENTED" },
        ],
      },
      {
        id: "prod-2",
        name: "Tripod",
        description: "Carbon Tripod",
        dailyPrice: 40,
        imageUrl: "",
        category: "GERAL",
        assets: [
          { id: "asset-3", state: "RENTED" },
        ],
      },
    ];

    (productRepositoryMock.findAll as Mock).mockResolvedValue({
      products: mockProducts,
      total: 2,
    });

    const result = await searchProductsService.execute({
      page: 1,
      limit: 10,
      search: "Camera",
    });

    expect(productRepositoryMock.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "Camera",
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.data).toHaveLength(2);

    // Product 1 has 1 available asset
    expect(result.data[0].id).toBe("prod-1");
    expect(result.data[0].isAvailable).toBe(true);
    expect(result.data[0].totalStock).toBe(2);
    expect(result.data[0].availableStock).toBe(1);
    expect(result.data[0].pricePerDay).toBe(150);

    // Product 2 has 0 available assets
    expect(result.data[1].id).toBe("prod-2");
    expect(result.data[1].isAvailable).toBe(false);
    expect(result.data[1].totalStock).toBe(1);
    expect(result.data[1].availableStock).toBe(0);
  });
});
