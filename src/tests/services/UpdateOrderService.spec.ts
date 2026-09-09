import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { UpdateOrderService } from "../../services/UpdateOrderService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";

describe("UpdateOrderService", () => {
  let orderRepositoryMock: Record<string, Mock>;
  let updateOrderService: UpdateOrderService;

  beforeEach(() => {
    orderRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
      checkAssetsAvailability: vi.fn(),
    };

    updateOrderService = new UpdateOrderService(orderRepositoryMock as unknown as import("../../repositories/OrderRepository").OrderRepository);
  });

  const mockOrder = {
    id: "order-1",
    state: OrderState.DRAFT,
    pickUpDate: new Date("2026-08-01"),
    returnDate: new Date("2026-08-05"),
    assets: [{ assetId: "asset-1" }],
  };

  it("should throw an error if order is not found", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(updateOrderService.execute({ id: "invalid" })).rejects.toThrow(
      new AppError("Order not found.", 404)
    );
  });

  it("should throw an error if order is completed or canceled", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue({
      ...mockOrder,
      state: OrderState.COMPLETED,
    });

    await expect(updateOrderService.execute({ id: "order-1" })).rejects.toThrow(
      new AppError("Cannot edit an order that has already been finished.", 400)
    );
  });

  it("should throw an error if pickup date is after return date", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);

    await expect(
      updateOrderService.execute({
        id: "order-1",
        pickUpDate: "2026-08-10",
        returnDate: "2026-08-05", // pickup > return
      })
    ).rejects.toThrow(new AppError("Return date must be after pick-up date.", 400));
  });

  it("should check assets availability if order is NOT DRAFT and dates changed", async () => {
    const activeOrder = { ...mockOrder, state: OrderState.RESERVED };
    (orderRepositoryMock.findById as Mock).mockResolvedValue(activeOrder);
    (orderRepositoryMock.checkAssetsAvailability as Mock).mockResolvedValue(["asset-1"]); // Conflict!

    await expect(
      updateOrderService.execute({
        id: "order-1",
        returnDate: "2026-08-10", // extending the date
      })
    ).rejects.toThrow(
      new AppError(
        "Reservation conflict detected: The new dates conflict with existing rentals for the equipment in this order.",
        409
      )
    );
  });

  it("should update order successfully", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(mockOrder);
    const updatedOrder = { ...mockOrder, totalAmount: 500 };
    (orderRepositoryMock.update as Mock).mockResolvedValue(updatedOrder);

    const result = await updateOrderService.execute({
      id: "order-1",
      totalAmount: 500,
    });

    expect(orderRepositoryMock.update).toHaveBeenCalledWith("order-1", {
      pickUpDate: mockOrder.pickUpDate,
      returnDate: mockOrder.returnDate,
      totalAmount: 500,
    });

    expect(result).toEqual(updatedOrder);
  });
});
