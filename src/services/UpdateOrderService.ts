import { OrderRepository } from '../repositories/OrderRepository';
import { AppError } from '../errors/AppError';
import { OrderState } from '../domain/OrderState';

interface UpdateOrderRequest {
  id: string;
  pickUpDate?: string;
  returnDate?: string;
  totalAmount?: number;
}

export class UpdateOrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  public async execute({ id, pickUpDate, returnDate, totalAmount }: UpdateOrderRequest) {
    const order = await this.orderRepository.findById(id);
    
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404);
    }

    if (order.state === OrderState.COMPLETED || order.state === OrderState.COMPLETED_WITH_DAMAGES || order.state === OrderState.TOTAL_LOSS) {
      throw new AppError('Não é possível editar um pedido já finalizado.', 400);
    }

    let newPickUpDate = order.pickUpDate;
    let newReturnDate = order.returnDate;

    if (pickUpDate) newPickUpDate = new Date(pickUpDate);
    if (returnDate) newReturnDate = new Date(returnDate);

    if (newPickUpDate >= newReturnDate) {
      throw new AppError('A data de devolução deve ser posterior à data de retirada.', 400);
    }

    // Se as datas mudaram e o pedido não é DRAFT, precisamos checar a disponibilidade dos ativos
    if (order.state !== OrderState.DRAFT && (pickUpDate || returnDate)) {
      const assetIds = order.assets.map(oa => oa.assetId);
      const unavailableAssets = await this.orderRepository.checkAssetsAvailability(
        assetIds,
        newPickUpDate,
        newReturnDate,
        id
      );

      if (unavailableAssets.length > 0) {
        throw new AppError('Conflito de reserva detectado: As novas datas colidem com locações existentes para os equipamentos deste pedido.', 409);
      }
    }

    const updatedOrder = await this.orderRepository.update(id, {
      pickUpDate: newPickUpDate,
      returnDate: newReturnDate,
      totalAmount: totalAmount !== undefined ? totalAmount : undefined,
    });

    return updatedOrder;
  }
}
