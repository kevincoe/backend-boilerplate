import { PrismaClient, Order, OrderAsset } from "@prisma/client";
import { OrderState } from "../domain/OrderState";
import { AssetState } from "../domain/AssetState";

export type OrderWithAssets = Order & { assets: OrderAsset[] };

export interface CreateOrderDTO {
  customerId: string;
  pickUpDate: Date | string;
  returnDate: Date | string;
  state: OrderState;
  assetIds: string[];
  totalAmount: number;
}

export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateOrderDTO): Promise<OrderWithAssets> {
    return this.prisma.order.create({
      data: {
        customerId: data.customerId,
        pickUpDate: new Date(data.pickUpDate),
        returnDate: new Date(data.returnDate),
        state: data.state,
        totalAmount: data.totalAmount,
        assets: {
          create: data.assetIds.map((id: string) => ({
            asset: { connect: { id } },
          })),
        },
      },
      include: { assets: true },
    });
  }

  public async findById(id: string): Promise<OrderWithAssets | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        assets: {
          include: {
            asset: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  public async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        assets: {
          include: {
            asset: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });
  }

  public async updateState(id: string, state: OrderState, amountPaid?: number): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { 
        state,
        ...(amountPaid !== undefined && { amountPaid })
      },
    });
  }

  public async updateAssetStates(
    assetIds: string[],
    state: AssetState,
  ): Promise<void> {
    await this.prisma.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { state },
    });
  }

  public async checkAssetsAvailability(
    assetIds: string[],
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ): Promise<string[]> {
    const blockingStates = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION,
    ];

    const overlappingOrders = await this.prisma.order.findMany({
      where: {
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        state: { in: blockingStates },
        AND: [
          { pickUpDate: { lt: endDate } },
          { returnDate: { gt: startDate } },
        ],
        assets: { some: { assetId: { in: assetIds } } },
      },
      include: { assets: true },
    });

    const unavailableAssets = new Set<string>();
    for (const order of overlappingOrders) {
      for (const orderAsset of order.assets) {
        if (assetIds.includes(orderAsset.assetId)) {
          unavailableAssets.add(orderAsset.assetId);
        }
      }
    }

    return Array.from(unavailableAssets);
  }

  public async update(
    id: string,
    data: { pickUpDate?: Date; returnDate?: Date; totalAmount?: number },
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.orderAsset.deleteMany({
      where: { orderId: id },
    });

    await this.prisma.order.delete({
      where: { id },
    });
  }
}
