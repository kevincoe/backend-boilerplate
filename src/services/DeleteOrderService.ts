import { IOrderRepository } from "../repositories/contracts/IOrderRepository";
import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";

export class DeleteOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(id: string) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new AppError("Order not found.", 404);
    }

    const deletableStates = [
      OrderState.DRAFT,
      OrderState.COMPLETED,
      OrderState.COMPLETED_WITH_DAMAGES,
    ];

    if (!deletableStates.includes(order.state as OrderState)) {
      throw new AppError(
        "Cannot delete an order that is in progress or awaiting deposit. Please finish or cancel the order first.",
        400,
      );
    }

    await this.orderRepository.delete(id);

    return { success: true };
  }
}
