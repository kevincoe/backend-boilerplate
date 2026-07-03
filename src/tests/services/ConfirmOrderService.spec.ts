import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ConfirmOrderService, IOrderRepository, OrderData } from "../../services/ConfirmOrderService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";
import { AssetState } from "../../domain/AssetState";

describe("ConfirmOrderService", () => {
  let orderRepositoryMock: ReturnType<typeof vi.fn>;
  let confirmOrderService: ConfirmOrderService;

  beforeEach(() => {
    orderRepositoryMock = {
      findById: vi.fn(),
      updateState: vi.fn(),
      updateAssetStates: vi.fn(),
      checkAssetsAvailability: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    confirmOrderService = new ConfirmOrderService(
      orderRepositoryMock as unknown as IOrderRepository
    );
  });

  const mockOrder: OrderData = {
    id: "order-123",
    state: OrderState.DRAFT,
    totalAmount: 1000,
    pickUpDate: new Date("2026-08-01"),
    returnDate: new Date("2026-08-05"),
    assets: [{ assetId: "asset-1" }, { assetId: "asset-2" }],
  };

  it("should throw an error if the order does not exist", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(confirmOrderService.execute("invalid-id", 300)).rejects.toThrow(
      new AppError("Order not found", 404)
    );
  });

  it("should throw an error if the order is not in DRAFT or AWAITING_DEPOSIT state", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue({
      ...mockOrder,
      state: OrderState.RESERVED,
    });

    await expect(confirmOrderService.execute("order-123", 300)).rejects.toThrow(
      new AppError("Order cannot be confirmed in its current state", 400)
    );
  });

  it("should throw an error if payment amount is less than 30%", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);

    // 30% de 1000 = 300. Mandando 299 deve falhar
    await expect(confirmOrderService.execute("order-123", 299)).rejects.toThrow(
      new AppError("Deposit amount must be at least 30% (300)", 400)
    );
  });

  it("should throw a 409 error if assets are no longer available (race condition)", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);
    (orderRepositoryMock.checkAssetsAvailability as Mock).mockResolvedValue([
      "asset-2",
    ]);

    await expect(confirmOrderService.execute("order-123", 300)).rejects.toThrow(
      new AppError(
        "Conflito de reserva detectado: Alguns equipamentos não estão mais disponíveis para as datas selecionadas.",
        409
      )
    );
  });

  it("should confirm order and update asset states when everything is valid", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);
    (orderRepositoryMock.checkAssetsAvailability as Mock).mockResolvedValue([]);
    const updatedOrderMock = { ...mockOrder, state: OrderState.RESERVED };
    (orderRepositoryMock.updateState as Mock).mockResolvedValue(updatedOrderMock);

    const result = await confirmOrderService.execute("order-123", 500);

    expect(orderRepositoryMock.checkAssetsAvailability).toHaveBeenCalledWith(
      ["asset-1", "asset-2"],
      new Date("2026-08-01"),
      expect.any(Date), // +1 buffer applied inside service
      "order-123"
    );

    expect(orderRepositoryMock.updateState).toHaveBeenCalledWith(
      "order-123",
      OrderState.RESERVED
    );

    expect(orderRepositoryMock.updateAssetStates).toHaveBeenCalledWith(
      ["asset-1", "asset-2"],
      AssetState.RENTED
    );

    expect(result).toEqual(updatedOrderMock);
  });
});
