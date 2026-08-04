import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";
import { AssetState } from "../domain/AssetState";

export interface OrderAssetData {
  assetId: string;
}

export interface OrderData {
  id: string;
  state: string;
  totalAmount: number | string;
  pickUpDate: Date | string;
  returnDate: Date | string;
  assets: OrderAssetData[];
}

// Atualizando a interface do Repository (seria o nosso port para o Prisma)
export interface IOrderRepository {
  findById(id: string): Promise<OrderData | null>;
  updateState(id: string, state: OrderState, amountPaid?: number): Promise<OrderData>;
  updateAssetStates(assetIds: string[], state: AssetState): Promise<void>;
  // Repare no excludeOrderId: ignoramos o próprio pedido para não dar falso positivo
  checkAssetsAvailability(
    assetIds: string[],
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ): Promise<string[]>;
}

export class ConfirmOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(
    orderId: string,
    paymentAmount: number,
  ): Promise<OrderData> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // Regra: Só pode confirmar pedidos que estejam em Rascunho ou Aguardando Sinal
    if (
      order.state !== OrderState.DRAFT &&
      order.state !== OrderState.AWAITING_DEPOSIT
    ) {
      throw new AppError("Order cannot be confirmed in its current state", 400);
    }

    // Regra: Exigir no mínimo 50% de sinal
    const minDeposit = Number(order.totalAmount) * 0.5;
    if (paymentAmount < minDeposit) {
      throw new AppError(
        `Deposit amount must be at least 50% (${minDeposit})`,
        400,
      );
    }

    // REGRA CRÍTICA: Prevenção de Race Condition
    // Como o cliente pode ter demorado a pagar, re-checamos se os ativos ainda estão livres
    // Precisamos aplicar novamente o "buffer" de higienização
    const returnDateWithBuffer = new Date(order.returnDate);
    returnDateWithBuffer.setDate(returnDateWithBuffer.getDate() + 1);

    const unavailableAssetIds =
      await this.orderRepository.checkAssetsAvailability(
        order.assets.map((a: OrderAssetData) => a.assetId),
        new Date(order.pickUpDate),
        returnDateWithBuffer,
        order.id, // Excluímos o próprio pedido da busca
      );

    if (unavailableAssetIds.length > 0) {
      throw new AppError(
        "Conflito de reserva detectado: Alguns equipamentos não estão mais disponíveis para as datas selecionadas.",
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
