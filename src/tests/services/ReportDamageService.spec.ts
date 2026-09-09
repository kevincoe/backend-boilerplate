import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  ReportDamageService,
  IOrderRepository,
  IMaintenanceLogRepository,
} from "../../services/ReportDamageService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";
import { AssetState } from "../../domain/AssetState";

describe("ReportDamageService", () => {
  let orderRepositoryMock: {
    findById: Mock;
    updateState: Mock;
    updateAssetStates: Mock;
  };
  let maintenanceLogRepositoryMock: {
    create: Mock;
  };
  let reportDamageService: ReportDamageService;

  beforeEach(() => {
    orderRepositoryMock = {
      findById: vi.fn(),
      updateState: vi.fn(),
      updateAssetStates: vi.fn(),
    };

    maintenanceLogRepositoryMock = {
      create: vi.fn(),
    };

    reportDamageService = new ReportDamageService(
      orderRepositoryMock as unknown as IOrderRepository,
      maintenanceLogRepositoryMock as unknown as IMaintenanceLogRepository,
    );
  });

  const validInput = {
    orderId: "order-123",
    assetId: "asset-1",
    description: "Scratched surface on the table",
    estimatedCost: 150,
  };

  const mockOrder = {
    id: "order-123",
    state: OrderState.PENDING_INSPECTION,
    assets: [
      { orderId: "order-123", assetId: "asset-1" },
      { orderId: "order-123", assetId: "asset-2" },
    ],
  };

  const mockMaintenanceLog = {
    id: "maint-1",
    assetId: "asset-1",
    description: "Scratched surface on the table",
    cost: 150,
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should create a maintenance log and update asset state", async () => {
    orderRepositoryMock.findById.mockResolvedValue(mockOrder);
    maintenanceLogRepositoryMock.create.mockResolvedValue(mockMaintenanceLog);

    const result = await reportDamageService.execute(validInput);

    expect(result).toEqual(mockMaintenanceLog);

    expect(maintenanceLogRepositoryMock.create).toHaveBeenCalledWith({
      assetId: "asset-1",
      description: "Scratched surface on the table",
      cost: 150,
    });

    expect(orderRepositoryMock.updateAssetStates).toHaveBeenCalledWith(
      ["asset-1"],
      AssetState.IN_MAINTENANCE,
    );
  });

  it("should update order state to COMPLETED_WITH_DAMAGES when order is PENDING_INSPECTION", async () => {
    orderRepositoryMock.findById.mockResolvedValue(mockOrder);
    maintenanceLogRepositoryMock.create.mockResolvedValue(mockMaintenanceLog);

    await reportDamageService.execute(validInput);

    expect(orderRepositoryMock.updateState).toHaveBeenCalledWith(
      "order-123",
      OrderState.COMPLETED_WITH_DAMAGES,
    );
  });

  it("should NOT update order state when order is not in PENDING_INSPECTION", async () => {
    const inProgressOrder = {
      ...mockOrder,
      state: OrderState.IN_PROGRESS,
    };
    orderRepositoryMock.findById.mockResolvedValue(inProgressOrder);
    maintenanceLogRepositoryMock.create.mockResolvedValue(mockMaintenanceLog);

    await reportDamageService.execute(validInput);

    expect(orderRepositoryMock.updateState).not.toHaveBeenCalled();
  });

  it("should throw an error if the order does not exist", async () => {
    orderRepositoryMock.findById.mockResolvedValue(null);

    await expect(reportDamageService.execute(validInput)).rejects.toThrow(
      new AppError("Order not found", 404),
    );

    expect(maintenanceLogRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should throw an error if the asset is not in the order", async () => {
    const orderWithoutAsset = {
      ...mockOrder,
      assets: [{ orderId: "order-123", assetId: "asset-99" }],
    };
    orderRepositoryMock.findById.mockResolvedValue(orderWithoutAsset);

    await expect(reportDamageService.execute(validInput)).rejects.toThrow(
      new AppError("Asset is not associated with this order", 400),
    );

    expect(maintenanceLogRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should handle damage report without estimated cost", async () => {
    const inputWithoutCost = {
      orderId: "order-123",
      assetId: "asset-1",
      description: "Minor scratch",
    };
    orderRepositoryMock.findById.mockResolvedValue(mockOrder);
    maintenanceLogRepositoryMock.create.mockResolvedValue({
      ...mockMaintenanceLog,
      cost: null,
    });

    const result = await reportDamageService.execute(inputWithoutCost);

    expect(maintenanceLogRepositoryMock.create).toHaveBeenCalledWith({
      assetId: "asset-1",
      description: "Minor scratch",
      cost: undefined,
    });
    expect(result.cost).toBeNull();
  });
});
