import { MaintenanceLog } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";
import { AssetState } from "../domain/AssetState";
import { IOrderRepository } from "../repositories/contracts/IOrderRepository";
import {
  IMaintenanceLogRepository,
  CreateMaintenanceLogDTO,
} from "../repositories/contracts/IMaintenanceLogRepository";

export { IOrderRepository, IMaintenanceLogRepository };

export interface ReportDamageInput {
  orderId: string;
  assetId: string;
  description: string;
  estimatedCost?: number;
}

export class ReportDamageService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly maintenanceLogRepository: IMaintenanceLogRepository,
  ) {}

  public async execute(input: ReportDamageInput): Promise<MaintenanceLog> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const assetInOrder = order.assets.some(
      (orderAsset) => orderAsset.assetId === input.assetId,
    );

    if (!assetInOrder) {
      throw new AppError("Asset is not associated with this order", 400);
    }

    const maintenanceLogData: CreateMaintenanceLogDTO = {
      assetId: input.assetId,
      description: input.description,
      cost: input.estimatedCost,
    };

    const maintenanceLog =
      await this.maintenanceLogRepository.create(maintenanceLogData);

    await this.orderRepository.updateAssetStates(
      [input.assetId],
      AssetState.IN_MAINTENANCE,
    );

    if (order.state === OrderState.PENDING_INSPECTION) {
      await this.orderRepository.updateState(
        input.orderId,
        OrderState.COMPLETED_WITH_DAMAGES,
      );
    }

    return maintenanceLog;
  }
}
