import { PrismaClient, Prisma, ProductCategory, ProductBase } from "@prisma/client";
import {
  IProductRepository,
  ProductWithAssets,
  FindAllProductsParams,
  CreateProductDTO,
  UpdateProductDTO,
} from "./contracts/IProductRepository";

export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findAll({
    page,
    limit,
    search,
    category,
  }: FindAllProductsParams) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductBaseWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (category && category in ProductCategory) {
      where.category = category as ProductCategory;
    }

    const [products, total] = await Promise.all([
      this.prisma.productBase.findMany({
        where,
        skip,
        take: limit,
        include: {
          assets: true,
        },
      }),
      this.prisma.productBase.count({ where }),
    ]);

    return { products, total };
  }

  public async findById(id: string): Promise<ProductBase | null> {
    return this.prisma.productBase.findUnique({
      where: { id },
    });
  }

  public async findByIdWithAssets(id: string): Promise<ProductWithAssets | null> {
    return this.prisma.productBase.findUnique({
      where: { id },
      include: {
        assets: true,
      },
    });
  }

  public async create(
    data: {
      name: string;
      description?: string;
      dailyPrice: number;
      category: ProductCategory;
      imageUrl?: string;
    },
    stock: number,
  ) {
    return this.prisma.productBase.create({
      data: {
        name: data.name,
        description: data.description,
        dailyPrice: data.dailyPrice,
        category: data.category,
        imageUrl: data.imageUrl,
        assets: {
          create: Array.from({ length: stock }).map((_, index) => ({
            serialNumber: `${data.name.substring(0, 3).toUpperCase()}-${Date.now()}-${index}`,
            state: "AVAILABLE",
          })),
        },
      },
      include: {
        assets: true,
      },
    });
  }

  public async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      dailyPrice?: number;
      category?: ProductCategory;
      imageUrl?: string;
    },
  ) {
    return this.prisma.productBase.update({
      where: { id },
      data,
      include: {
        assets: true,
      },
    });
  }

  public async addAssets(
    productId: string,
    quantity: number,
    namePrefix: string,
  ) {
    return this.prisma.asset.createMany({
      data: Array.from({ length: quantity }).map((_, index) => ({
        productBaseId: productId,
        serialNumber: `${namePrefix.substring(0, 3).toUpperCase()}-${Date.now()}-${index}`,
        state: "AVAILABLE",
      })),
    });
  }

  public async getAvailableAssets(productId: string, limit: number) {
    return this.prisma.asset.findMany({
      where: {
        productBaseId: productId,
        state: "AVAILABLE",
      },
      take: limit,
      select: { id: true },
    });
  }

  public async removeAssets(assetIds: string[]) {
    return this.prisma.asset.deleteMany({
      where: {
        id: { in: assetIds },
      },
    });
  }

  public async delete(id: string): Promise<ProductBase> {
    return this.prisma.$transaction(async (tx) => {
      await tx.asset.deleteMany({
        where: { productBaseId: id },
      });
      return tx.productBase.delete({
        where: { id },
      });
    });
  }
}
