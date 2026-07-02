import { PrismaClient, Asset } from "@prisma/client";
import { OrderState } from "../domain/OrderState";

export class AssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findAssetsByIds(assetIds: string[]): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
      },
    });
  }

  public async findAvailableAssetsForProduct(
    productId: string,
    quantity: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    (Asset & {
      product: { dailyPrice: import("@prisma/client/runtime/library").Decimal };
    })[]
  > {
    const blockingStates: OrderState[] = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION,
    ];
    return this.prisma.asset.findMany({
      where: {
        productBaseId: productId,
        state: "AVAILABLE",
        orders: {
          none: {
            order: {
              state: { in: blockingStates },
              AND: [
                { pickUpDate: { lt: endDate } },
                { returnDate: { gt: startDate } },
              ],
            },
          },
        },
      },
      include: {
        product: {
          select: { dailyPrice: true },
        },
      },
      take: quantity,
    });
  }

  public async countAvailableAssetsForProduct(
    productId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const blockingStates: OrderState[] = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION,
    ];
    return this.prisma.asset.count({
      where: {
        productBaseId: productId,
        state: "AVAILABLE",
        orders: {
          none: {
            order: {
              state: { in: blockingStates },
              AND: [
                { pickUpDate: { lt: endDate } },
                { returnDate: { gt: startDate } },
              ],
            },
          },
        },
      },
    });
  }
}
