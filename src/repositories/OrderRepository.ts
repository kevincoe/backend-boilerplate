import { PrismaClient, Order, OrderAsset } from '@prisma/client';
import { OrderState } from '../domain/OrderState';

export type OrderWithAssets = Order & { assets: OrderAsset[] };

export interface CreateOrderDTO {
  customerId: string;
  pickUpDate: Date | string;
  returnDate: Date | string;
  state: OrderState;
  assetIds: string[];
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
        totalAmount: 0, // TODO: Calcular dinamicamente baseado na soma de dailyPrice
        assets: {
          create: data.assetIds.map((id: string) => ({
            asset: { connect: { id } }
          }))
        }
      },
      include: { assets: true }
    });
  }

  public async findById(id: string): Promise<OrderWithAssets | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { assets: true }
    });
  }

  public async updateState(id: string, state: OrderState): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { state }
    });
  }

  public async checkAssetsAvailability(assetIds: string[], startDate: Date, endDate: Date, excludeOrderId?: string): Promise<string[]> {
    const blockingStates = [
      OrderState.AWAITING_DEPOSIT,
      OrderState.RESERVED,
      OrderState.IN_PROGRESS,
      OrderState.PENDING_INSPECTION
    ];

    const overlappingOrders = await this.prisma.order.findMany({
      where: {
        id: excludeOrderId ? { not: excludeOrderId } : undefined,
        state: { in: blockingStates },
        AND: [
          { pickUpDate: { lt: endDate } },
          { returnDate: { gt: startDate } }
        ],
        assets: { some: { assetId: { in: assetIds } } }
      },
      include: { assets: true }
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
}