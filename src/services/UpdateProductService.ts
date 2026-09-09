import { IProductRepository } from "../repositories/contracts/IProductRepository";
import { AppError } from "../errors/AppError";
import { ProductCategory } from "@prisma/client";

export interface UpdateProductRequest {
  id: string;
  name?: string;
  description?: string;
  category?: ProductCategory;
  pricePerDay?: number;
  imageUrl?: string;
}

export class UpdateProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute({ id, pricePerDay, ...data }: UpdateProductRequest) {
    const productExists = await this.productRepository.findById(id);
    if (!productExists) {
      throw new AppError("Product not found.", 404);
    }

    if (pricePerDay !== undefined && pricePerDay <= 0) {
      throw new AppError("Daily price must be greater than zero.", 400);
    }

    const updateData = {
      ...data,
      ...(pricePerDay !== undefined && { dailyPrice: pricePerDay }),
    };

    const updatedProduct = await this.productRepository.update(id, updateData);

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
