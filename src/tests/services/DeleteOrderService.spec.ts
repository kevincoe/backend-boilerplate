import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { DeleteOrderService } from "../../services/DeleteOrderService";
import { AppError } from "../../errors/AppError";
import { OrderState } from "../../domain/OrderState";

describe("DeleteOrderService", () => {
  let orderRepositoryMock: Record<string, Mock>;
  let deleteOrderService: DeleteOrderService;

  beforeEach(() => {
    orderRepositoryMock = {
      findById: vi.fn(),
      delete: vi.fn(),
    };

    deleteOrderService = new DeleteOrderService(orderRepositoryMock as unknown as import("../../repositories/OrderRepository").OrderRepository);
  });

  it("should throw an error if order is not found", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(deleteOrderService.execute("invalid-id")).rejects.toThrow(
      new AppError("Order not found.", 404)
    );
  });

  it("should throw an error if order is in progress", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue({
      id: "order-1",
      state: OrderState.IN_PROGRESS,
    });

    await expect(deleteOrderService.execute("order-1")).rejects.toThrow(
      new AppError(
        "Cannot delete an order that is in progress or awaiting deposit. Please finish or cancel the order first.",
        400
      )
    );
  });

  it("should successfully delete a DRAFT order", async () => {
    (orderRepositoryMock.findById as Mock).mockResolvedValue({
      id: "order-1",
      state: OrderState.DRAFT,
    });
    
    const result = await deleteOrderService.execute("order-1");

    expect(orderRepositoryMock.delete).toHaveBeenCalledWith("order-1");
    expect(result).toEqual({ success: true });
  });
});
