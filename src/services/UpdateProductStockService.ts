import { IProductRepository } from "../repositories/contracts/IProductRepository";
import { AppError } from "../errors/AppError";

export interface UpdateStockRequest {
  id: string;
  newStockQuantity: number;
}

export class UpdateProductStockService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute({ id, newStockQuantity }: UpdateStockRequest) {
    if (newStockQuantity < 0) {
      throw new AppError("Stock quantity cannot be negative.", 400);
    }

    const productWithAssets =
      (await this.productRepository.findByIdWithAssets(id)) ||
      (await this.productRepository.findById(id));

    if (!productWithAssets) {
      throw new AppError("Product not found.", 404);
    }

    const assets =
      "assets" in productWithAssets && Array.isArray(productWithAssets.assets)
        ? productWithAssets.assets
        : [];
    const currentStock = assets.length;
    const difference = newStockQuantity - currentStock;

    if (difference > 0) {
      await this.productRepository.addAssets(
        id,
        difference,
        productWithAssets.name,
      );
    } else if (difference < 0) {
      const quantityToRemove = Math.abs(difference);
      const availableAssets = await this.productRepository.getAvailableAssets(
        id,
        quantityToRemove,
      );

      if (availableAssets.length < quantityToRemove) {
        throw new AppError(
          `Cannot reduce stock by ${quantityToRemove}. Only ${availableAssets.length} units are AVAILABLE (the rest are rented or reserved).`,
          400,
        );
      }

      await this.productRepository.removeAssets(
        availableAssets.map((a) => a.id),
      );
    }

    const updatedProduct =
      (await this.productRepository.findByIdWithAssets(id)) ||
      productWithAssets;
    const updatedAssets =
      "assets" in updatedProduct && Array.isArray(updatedProduct.assets)
        ? updatedProduct.assets
        : [];
    const totalStock = updatedAssets.length;
    const availableStock = updatedAssets.filter(
      (a) => a.state === "AVAILABLE",
    ).length;

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description || "",
      pricePerDay: Number(updatedProduct.dailyPrice),
      imageUrl: updatedProduct.imageUrl || "",
      isAvailable: availableStock > 0,
      totalStock,
      availableStock,
      category: updatedProduct.category,
    };
  }
}
