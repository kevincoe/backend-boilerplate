import { PrismaClient, Order, OrderAsset } from "@prisma/client";
import { OrderState } from "../domain/OrderState";
import { AssetState } from "../domain/AssetState";
import {
  IOrderRepository,
  OrderWithAssets,
  CreateOrderDTO,
  FindAllOrdersParams,
  PaginatedOrdersResult,
} from "./contracts/IOrderRepository";

export { OrderWithAssets, CreateOrderDTO, FindAllOrdersParams, PaginatedOrdersResult };

export class OrderRepository implements IOrderRepository {
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

  public async findAll(
    params?: FindAllOrdersParams,
  ): Promise<PaginatedOrdersResult | Order[]> {
    if (!params || (params.page === undefined && params.limit === undefined)) {
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

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
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
      }),
      this.prisma.order.count(),
    ]);

    return { orders, total, page, limit };
  }

  public async updateState(
    id: string,
    state: OrderState,
    amountPaid?: number,
  ): Promise<OrderWithAssets> {
    return this.prisma.order.update({
      where: { id },
      data: {
        state,
        ...(amountPaid !== undefined && { amountPaid }),
      },
      include: { assets: true },
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

  public async confirmOrderTransaction(
    orderId: string,
    amountPaid: number,
    assetIds: string[],
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          state: OrderState.RESERVED,
          amountPaid,
        },
      });
      if (assetIds.length > 0) {
        await tx.asset.updateMany({
          where: { id: { in: assetIds } },
          data: { state: AssetState.RENTED },
        });
      }
      return order;
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
    await this.prisma.$transaction(async (tx) => {
      await tx.orderAsset.deleteMany({
        where: { orderId: id },
      });

      await tx.order.delete({
        where: { id },
      });
    });
  }
}
