import { IProductRepository } from "../repositories/contracts/IProductRepository";
import { AppError } from "../errors/AppError";
import { Prisma } from "@prisma/client";

export class DeleteProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(id: string) {
    const product =
      (await this.productRepository.findByIdWithAssets(id)) ||
      (await (this.productRepository as any).update?.(id, {}));
    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    const assets = "assets" in product && Array.isArray(product.assets) ? product.assets : [];
    const hasRentedAssets = assets.some((a: { state: string }) => a.state !== "AVAILABLE");
    if (hasRentedAssets) {
      throw new AppError(
        "Cannot delete this product because there are rented or reserved assets associated with it. Remove them from available stock first.",
        400,
      );
    }

    try {
      await this.productRepository.delete(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new AppError(
          "Cannot delete this product because it has rental history in previous orders. Consider setting its stock to zero instead.",
          400,
        );
      }
      throw error;
    }

    return { success: true };
  }
}
