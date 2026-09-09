import { MaintenanceLog } from "@prisma/client";

export interface CreateMaintenanceLogDTO {
  assetId: string;
  description: string;
  cost?: number;
}

export interface IMaintenanceLogRepository {
  create(data: CreateMaintenanceLogDTO): Promise<MaintenanceLog>;
  findByAssetId(assetId: string): Promise<MaintenanceLog[]>;
  findByOrderAssets(assetIds: string[]): Promise<MaintenanceLog[]>;
  markResolved(id: string): Promise<MaintenanceLog>;
}
