import { PrismaClient, MaintenanceLog } from "@prisma/client";
import {
  IMaintenanceLogRepository,
  CreateMaintenanceLogDTO,
} from "./contracts/IMaintenanceLogRepository";

export class MaintenanceLogRepository implements IMaintenanceLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateMaintenanceLogDTO): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.create({
      data: {
        assetId: data.assetId,
        description: data.description,
        cost: data.cost,
      },
    });
  }

  public async findByAssetId(assetId: string): Promise<MaintenanceLog[]> {
    return this.prisma.maintenanceLog.findMany({
      where: { assetId },
      orderBy: { createdAt: "desc" },
    });
  }

  public async findByOrderAssets(assetIds: string[]): Promise<MaintenanceLog[]> {
    return this.prisma.maintenanceLog.findMany({
      where: {
        assetId: { in: assetIds },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  public async markResolved(id: string): Promise<MaintenanceLog> {
    return this.prisma.maintenanceLog.update({
      where: { id },
      data: { resolved: true },
    });
  }
}
