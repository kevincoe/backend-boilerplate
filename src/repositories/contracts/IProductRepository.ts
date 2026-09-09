import { ProductBase, Asset, ProductCategory, Prisma } from "@prisma/client";

export type ProductWithAssets = ProductBase & { assets: Asset[] };

export interface FindAllProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  dailyPrice: number;
  category: ProductCategory;
  imageUrl?: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  dailyPrice?: number;
  category?: ProductCategory;
  imageUrl?: string;
}

export interface IProductRepository {
  findAll(params: FindAllProductsParams): Promise<{ products: ProductWithAssets[]; total: number }>;
  findById(id: string): Promise<ProductBase | null>;
  findByIdWithAssets(id: string): Promise<ProductWithAssets | null>;
  create(data: CreateProductDTO, stock: number): Promise<ProductWithAssets>;
  update(id: string, data: UpdateProductDTO): Promise<ProductWithAssets>;
  addAssets(productId: string, quantity: number, namePrefix: string): Promise<Prisma.BatchPayload>;
  getAvailableAssets(productId: string, limit: number): Promise<{ id: string }[]>;
  removeAssets(assetIds: string[]): Promise<Prisma.BatchPayload>;
  delete(id: string): Promise<ProductBase>;
}
