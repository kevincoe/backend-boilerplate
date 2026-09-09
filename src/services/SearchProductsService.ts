import { IProductRepository } from "../repositories/contracts/IProductRepository";

export interface SearchProductsRequest {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export class SearchProductsService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute({
    page,
    limit,
    search,
    category,
  }: SearchProductsRequest) {
    const { products, total } = await this.productRepository.findAll({
      page,
      limit,
      search,
      category,
    });

    const formattedProducts = products.map((product) => {
      const totalStock = product.assets.length;
      const availableStock = product.assets.filter(
        (asset) => asset.state === "AVAILABLE",
      ).length;

      return {
        id: product.id,
        name: product.name,
        description: product.description || "",
        pricePerDay: Number(product.dailyPrice),
        imageUrl: product.imageUrl || "",
        isAvailable: availableStock > 0,
        totalStock,
        availableStock,
        category: product.category,
      };
    });

    return {
      data: formattedProducts,
      total,
      page,
      limit,
    };
  }
}
