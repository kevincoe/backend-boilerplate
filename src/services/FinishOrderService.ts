import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";
import { AssetState } from "../domain/AssetState";
import { IOrderRepository } from "../repositories/contracts/IOrderRepository";

export interface OrderAssetData {
  assetId: string;
}

export interface OrderData {
  id: string;
  state: string;
  assets: OrderAssetData[];
}

export { IOrderRepository };

export class FinishOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(orderId: string): Promise<any> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (
      order.state === OrderState.DRAFT ||
      order.state === OrderState.COMPLETED
    ) {
      throw new AppError("Order cannot be finished in its current state", 400);
    }

    // 1. Mark order as COMPLETED
    const updatedOrder = await this.orderRepository.updateState(
      order.id,
      OrderState.COMPLETED,
    );

    // 2. Mark assets as AVAILABLE
    const assetIds = order.assets.map((a: OrderAssetData) => a.assetId);
    if (assetIds.length > 0) {
      await this.orderRepository.updateAssetStates(
        assetIds,
        AssetState.AVAILABLE,
      );
    }

    return updatedOrder;
  }
}
