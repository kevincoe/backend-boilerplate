import { ProductRepository } from "../repositories/ProductRepository";
import { AppError } from "../errors/AppError";

interface UpdateStockRequest {
  id: string;
  newStockQuantity: number;
}

export class UpdateProductStockService {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute({ id, newStockQuantity }: UpdateStockRequest) {
    if (newStockQuantity < 0) {
      throw new AppError("O estoque não pode ser negativo.", 400);
    }

    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    // We need to fetch the assets to know the current stock
    // Since findById doesn't include assets, we can use findAll or just assume we know it via another query
    // Let's modify the service to find the product with assets, or just use a custom query.
    // Actually, we can just use Prisma directly or add a findWithAssets to the repo.
    // To keep it simple, let's use the repo's findAll with a search for this exact ID. No, that's paginated.
    // Let's add `findWithAssets` to repository in a moment, but for now let's assume it exists or use update.
    // We can just use the Prisma client here if needed, but sticking to clean arch:
    // Let's rely on a getProductWithAssets that we'll add to the repo.
    const productWithAssets = await this.productRepository.update(id, {}); // update with empty data returns include: {assets: true}

    const currentStock = productWithAssets.assets.length;
    const difference = newStockQuantity - currentStock;

    if (difference > 0) {
      // Add assets
      await this.productRepository.addAssets(id, difference, product.name);
    } else if (difference < 0) {
      // Remove assets. We can only remove AVAILABLE assets.
      const quantityToRemove = Math.abs(difference);
      const availableAssets = await this.productRepository.getAvailableAssets(
        id,
        quantityToRemove,
      );

      if (availableAssets.length < quantityToRemove) {
        throw new AppError(
          `Não é possível reduzir o estoque em ${quantityToRemove}. Apenas ${availableAssets.length} unidades estão 'AVAILABLE' (as demais estão alugadas ou reservadas).`,
          400,
        );
      }

      await this.productRepository.removeAssets(
        availableAssets.map((a) => a.id),
      );
    }

    // Return the updated product
    const updatedProduct = await this.productRepository.update(id, {});
    const totalStock = updatedProduct.assets.length;
    const availableStock = updatedProduct.assets.filter(
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
