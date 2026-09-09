import { PrismaClient, Kit, KitItem } from "@prisma/client";
import {
  IKitRepository,
  KitWithItems,
  CreateKitDTO,
  FindAllKitsParams,
  PaginatedKitsResult,
} from "./contracts/IKitRepository";

export { KitWithItems, CreateKitDTO, FindAllKitsParams, PaginatedKitsResult };

export class KitRepository implements IKitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateKitDTO): Promise<KitWithItems> {
    return this.prisma.kit.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        isFavorited: data.isFavorited ?? false,
        items: {
          create: data.items.map((item) => ({
            productBaseId: item.productBaseId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            productBase: true,
          },
        },
      },
    });
  }

  public async findAll(
    params?: FindAllKitsParams,
  ): Promise<PaginatedKitsResult | KitWithItems[]> {
    if (!params || (params.page === undefined && params.limit === undefined)) {
      return this.prisma.kit.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              productBase: true,
            },
          },
        },
      });
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const [kits, total] = await Promise.all([
      this.prisma.kit.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              productBase: true,
            },
          },
        },
      }),
      this.prisma.kit.count(),
    ]);

    return { kits, total, page, limit };
  }

  public async findById(id: string): Promise<KitWithItems | null> {
    return this.prisma.kit.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productBase: true,
          },
        },
      },
    });
  }

  public async toggleFavorite(id: string, isFavorited: boolean): Promise<Kit> {
    return this.prisma.kit.update({
      where: { id },
      data: { isFavorited },
    });
  }
}
