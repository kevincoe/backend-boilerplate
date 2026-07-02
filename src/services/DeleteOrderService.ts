import { OrderRepository } from "../repositories/OrderRepository";
import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";

export class DeleteOrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(id: string) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new AppError("Pedido não encontrado.", 404);
    }

    const deletableStates = [
      OrderState.DRAFT,
      OrderState.COMPLETED,
      OrderState.COMPLETED_WITH_DAMAGES,
      OrderState.TOTAL_LOSS,
    ];

    if (!deletableStates.includes(order.state as OrderState)) {
      throw new AppError(
        "Não é possível excluir um pedido que está em andamento ou aguardando depósito. Finalize ou cancele o pedido primeiro.",
        400,
      );
    }

    await this.orderRepository.delete(id);

    return { success: true };
  }
}
