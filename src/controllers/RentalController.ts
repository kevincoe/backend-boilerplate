import { Request, Response, NextFunction } from "express";
import { CalculatePricingService } from "../services/CalculatePricingService";
import { ReportDamageService } from "../services/ReportDamageService";
import { CheckInventoryService } from "../services/CheckInventoryService";
import { IMaintenanceLogRepository } from "../repositories/contracts/IMaintenanceLogRepository";
import { IOrderRepository } from "../repositories/contracts/IOrderRepository";
import { calculatePricingSchema } from "../schemas/pricing.schema";
import { reportDamageSchema } from "../schemas/damage.schema";
import { checkInventorySchema } from "../schemas/inventory.schema";
import { orderIdParamSchema } from "../schemas/params.schema";

export class RentalController {
  constructor(
    private readonly calculatePricingService: CalculatePricingService,
    private readonly reportDamageService: ReportDamageService,
    private readonly checkInventoryService: CheckInventoryService,
    private readonly maintenanceLogRepository: IMaintenanceLogRepository,
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async calculatePricing(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = calculatePricingSchema.parse(req.body);
      const breakdown = await this.calculatePricingService.execute(validatedData);
      res.status(200).json(breakdown);
    } catch (error) {
      next(error);
    }
  }

  public async reportDamage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = reportDamageSchema.parse(req.body);
      const maintenanceLog = await this.reportDamageService.execute(validatedData);
      res.status(201).json(maintenanceLog);
    } catch (error) {
      next(error);
    }
  }

  public async checkInventory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = checkInventorySchema.parse(req.body);
      const result = await this.checkInventoryService.execute(validatedData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getDamagesByOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orderId } = orderIdParamSchema.parse(req.params);

      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      const assetIds = order.assets.map((orderAsset) => orderAsset.assetId);

      if (assetIds.length === 0) {
        res.status(200).json([]);
        return;
      }

      const damages =
        await this.maintenanceLogRepository.findByOrderAssets(assetIds);
      res.status(200).json(damages);
    } catch (error) {
      next(error);
    }
  }
}
