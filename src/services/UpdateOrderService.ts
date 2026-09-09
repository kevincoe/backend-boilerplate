import { IOrderRepository } from "../repositories/contracts/IOrderRepository";
import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";

export interface UpdateOrderRequest {
  id: string;
  pickUpDate?: string;
  returnDate?: string;
  totalAmount?: number;
}

export class UpdateOrderService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute({
    id,
    pickUpDate,
    returnDate,
    totalAmount,
  }: UpdateOrderRequest) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new AppError("Order not found.", 404);
    }

    if (
      order.state === OrderState.COMPLETED ||
      order.state === OrderState.COMPLETED_WITH_DAMAGES
    ) {
      throw new AppError("Cannot edit an order that has already been finished.", 400);
    }

    let newPickUpDate = order.pickUpDate;
    let newReturnDate = order.returnDate;

    if (pickUpDate) newPickUpDate = new Date(pickUpDate);
    if (returnDate) newReturnDate = new Date(returnDate);

    if (newPickUpDate >= newReturnDate) {
      throw new AppError(
        "Return date must be after pick-up date.",
        400,
      );
    }

    // If dates changed and order is not DRAFT, check asset availability
    if (order.state !== OrderState.DRAFT && (pickUpDate || returnDate)) {
      const assetIds = order.assets.map((oa) => oa.assetId);
      const unavailableAssets =
        await this.orderRepository.checkAssetsAvailability(
          assetIds,
          newPickUpDate,
          newReturnDate,
          id,
        );

      if (unavailableAssets.length > 0) {
        throw new AppError(
          "Reservation conflict detected: The new dates conflict with existing rentals for the equipment in this order.",
          409,
        );
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
