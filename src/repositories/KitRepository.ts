import { PrismaClient, Kit, KitItem } from "@prisma/client";

export type KitWithItems = Kit & { items: KitItem[] };

export interface CreateKitDTO {
  name: string;
  description?: string;
  price: number;
  isFavorited?: boolean;
  items: {
    productBaseId: string;
    quantity: number;
  }[];
}

export class KitRepository {
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

  public async findAll(): Promise<KitWithItems[]> {
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
