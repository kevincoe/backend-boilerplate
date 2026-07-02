import { AppError } from '../errors/AppError';
import { OrderState } from '../domain/OrderState';
import { AssetState } from '../domain/AssetState';

export interface IOrderRepository {
  findById(id: string): Promise<any>;
  updateState(id: string, state: OrderState): Promise<any>;
  updateAssetStates(assetIds: string[], state: AssetState): Promise<void>;
}

export class FinishOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(orderId: string): Promise<any> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.state === OrderState.DRAFT || order.state === OrderState.COMPLETED || order.state === OrderState.TOTAL_LOSS) {
      throw new AppError('Order cannot be finished in its current state', 400);
    }

    // 1. Mark order as COMPLETED
    const updatedOrder = await this.orderRepository.updateState(order.id, OrderState.COMPLETED);

    // 2. Mark assets as AVAILABLE
    const assetIds = order.assets.map((a: any) => a.assetId);
    if (assetIds.length > 0) {
      await this.orderRepository.updateAssetStates(assetIds, AssetState.AVAILABLE);
    }

    return updatedOrder;
  }
}
