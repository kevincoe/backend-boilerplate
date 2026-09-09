import { AppError } from "../errors/AppError";
import { IProductRepository } from "../repositories/contracts/IProductRepository";
import { IAssetRepository } from "../repositories/contracts/IAssetRepository";

export { IProductRepository, IAssetRepository };

export interface InventoryCheckInput {
  productIds: string[];
  startDate: string;
  endDate: string;
}

export interface ProductAvailability {
  productId: string;
  productName: string;
  totalAssets: number;
  availableAssets: number;
  reservedAssets: number;
}

export interface InventoryCheckResult {
  products: ProductAvailability[];
  checkedAt: string;
}

export class CheckInventoryService {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly assetRepository: IAssetRepository,
  ) {}

  public async execute(input: InventoryCheckInput): Promise<InventoryCheckResult> {
    if (input.productIds.length === 0) {
      throw new AppError("At least one product ID is required", 400);
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400);
    }

    const products: ProductAvailability[] = [];

    for (const productId of input.productIds) {
      const product = await this.productRepository.findByIdWithAssets(productId);

      if (!product) {
        throw new AppError(`Product ${productId} not found.`, 404);
      }

      const totalAssets = product.assets.length;

      const availableAssets =
        await this.assetRepository.countAvailableAssetsForProduct(
          productId,
          startDate,
          endDate,
        );

      const reservedAssets = totalAssets - availableAssets;

      products.push({
        productId,
        productName: product.name,
        totalAssets,
        availableAssets,
        reservedAssets,
      });
    }

    return {
      products,
      checkedAt: new Date().toISOString(),
    };
  }
}
