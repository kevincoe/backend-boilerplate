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
  totalAmount: unknown;
  pickUpDate: Date | string;
  returnDate: Date | string;
  assets: OrderAssetData[];
}

export { IOrderRepository };

export class ConfirmOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(
    orderId: string,
    paymentAmount: number,
  ): Promise<any> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Rule: Only confirm orders in DRAFT or AWAITING_DEPOSIT state
    if (
      order.state !== OrderState.DRAFT &&
      order.state !== OrderState.AWAITING_DEPOSIT
    ) {
      throw new AppError("Order cannot be confirmed in its current state", 400);
    }

    // Rule: Require at least 50% deposit
    const minDeposit = Number(order.totalAmount) * 0.5;
    if (paymentAmount < minDeposit) {
      throw new AppError(
        `Deposit amount must be at least 50% (${minDeposit})`,
        400,
      );
    }

    // Race condition prevention: re-check asset availability with buffer
    const returnDateWithBuffer = new Date(order.returnDate);
    returnDateWithBuffer.setDate(returnDateWithBuffer.getDate() + 1);

    const unavailableAssetIds =
      await this.orderRepository.checkAssetsAvailability(
        order.assets.map((a: OrderAssetData) => a.assetId),
        new Date(order.pickUpDate),
        returnDateWithBuffer,
        order.id,
      );

    if (unavailableAssetIds.length > 0) {
      throw new AppError(
        "Reservation conflict detected: Some equipment is no longer available for the selected dates.",
        409,
      );
    }

    // Se tudo estiver ok, alteramos o status para RESERVADO (Efetiva a trava da agenda)
    const updatedOrder = await this.orderRepository.updateState(
      order.id,
      OrderState.RESERVED,
      paymentAmount // Salvando o sinal recebido
    );

    // E retiramos os itens do estoque disponível
    const assetIds = order.assets.map((a: OrderAssetData) => a.assetId);
    if (assetIds.length > 0) {
      await this.orderRepository.updateAssetStates(assetIds, AssetState.RENTED);
    }

    return updatedOrder;
  }
}
