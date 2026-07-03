import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { FinishOrderService, IOrderRepository, OrderData } from "../../services/FinishOrderService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";
import { AssetState } from "../../domain/AssetState";

describe("FinishOrderService", () => {
  let orderRepositoryMock: ReturnType<typeof vi.fn>;
  let finishOrderService: FinishOrderService;

  beforeEach(() => {
    orderRepositoryMock = {
      findById: vi.fn(),
      updateState: vi.fn(),
      updateAssetStates: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    finishOrderService = new FinishOrderService(
      orderRepositoryMock as unknown as IOrderRepository
    );
  });

  const mockOrder: OrderData = {
    id: "order-123",
    state: OrderState.IN_PROGRESS,
    assets: [{ assetId: "asset-1" }, { assetId: "asset-2" }],
  };

  it("should throw an error if the order does not exist", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(finishOrderService.execute("invalid-id")).rejects.toThrow(
      new AppError("Order not found", 404)
    );
  });

  it("should throw an error if the order is DRAFT, COMPLETED or TOTAL_LOSS", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue({
      ...mockOrder,
      state: OrderState.COMPLETED,
    });

    await expect(finishOrderService.execute("order-123")).rejects.toThrow(
      new AppError("Order cannot be finished in its current state", 400)
    );
  });

  it("should finish the order and return assets to AVAILABLE status", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);
    
    const updatedOrderMock = { ...mockOrder, state: OrderState.COMPLETED };
    (orderRepositoryMock.updateState as Mock).mockResolvedValue(updatedOrderMock);

    const result = await finishOrderService.execute("order-123");

    expect(orderRepositoryMock.updateState).toHaveBeenCalledWith(
      "order-123",
      OrderState.COMPLETED
    );

    expect(orderRepositoryMock.updateAssetStates).toHaveBeenCalledWith(
      ["asset-1", "asset-2"],
      AssetState.AVAILABLE
    );

    expect(result).toEqual(updatedOrderMock);
  });

  it("should finish the order even if it has no assets", async () => {
    const noAssetsOrder = { ...mockOrder, assets: [] };
    (orderRepositoryMock.findById as Mock).mockResolvedValue(noAssetsOrder);
    
    const updatedOrderMock = { ...noAssetsOrder, state: OrderState.COMPLETED };
    (orderRepositoryMock.updateState as Mock).mockResolvedValue(updatedOrderMock);

    const result = await finishOrderService.execute("order-123");

    expect(orderRepositoryMock.updateState).toHaveBeenCalledWith(
      "order-123",
      OrderState.COMPLETED
    );

    // Should not call updateAssetStates if array is empty
    expect(orderRepositoryMock.updateAssetStates).not.toHaveBeenCalled();
    expect(result).toEqual(updatedOrderMock);
  });
});
