import { IProductRepository } from "../repositories/contracts/IProductRepository";
import { AppError } from "../errors/AppError";
import { ProductCategory } from "@prisma/client";

export interface CreateProductRequest {
  name: string;
  description?: string;
  category: ProductCategory;
  pricePerDay: number;
  stock: number;
  imageUrl?: string;
}

export class CreateProductService {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(data: CreateProductRequest) {
    if (data.pricePerDay <= 0) {
      throw new AppError("Daily price must be greater than zero.", 400);
    }
    if (data.stock < 0) {
      throw new AppError("Stock quantity cannot be negative.", 400);
    }
    if (!(data.category in ProductCategory)) {
      throw new AppError("Invalid category.", 400);
    }

    const product = await this.productRepository.create(
      {
        name: data.name,
        description: data.description,
        dailyPrice: data.pricePerDay,
        category: data.category,
        imageUrl: data.imageUrl,
      },
      data.stock,
    );

    return {
      id: product.id,
      name: product.name,
      description: product.description || "",
      pricePerDay: Number(product.dailyPrice),
      imageUrl: product.imageUrl || "",
      isAvailable: product.assets.some((asset) => asset.state === "AVAILABLE"),
      category: product.category,
    };
  }
}
