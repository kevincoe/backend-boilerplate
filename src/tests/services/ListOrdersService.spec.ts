import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ListOrdersService } from "../../services/ListOrdersService";
import { IOrderRepository } from "../../repositories/contracts/IOrderRepository";

describe("ListOrdersService", () => {
  let orderRepositoryMock: Record<string, Mock>;
  let listOrdersService: ListOrdersService;

  beforeEach(() => {
    orderRepositoryMock = {
      findAll: vi.fn(),
    };

    listOrdersService = new ListOrdersService(
      orderRepositoryMock as unknown as IOrderRepository,
    );
  });

  it("should return orders when called without params", async () => {
    const mockOrders = [
      {
        id: "order-1",
        customerId: "cust-1",
        totalAmount: 500,
        state: "DRAFT",
      },
    ];

    (orderRepositoryMock.findAll as Mock).mockResolvedValue(mockOrders);

    const result = await listOrdersService.execute();

    expect(orderRepositoryMock.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockOrders);
  });

  it("should return paginated orders when called with pagination parameters", async () => {
    const mockPaginated = {
      orders: [
        {
          id: "order-1",
          customerId: "cust-1",
          totalAmount: 500,
          state: "RESERVED",
        },
      ],
      total: 1,
      page: 2,
      limit: 15,
    };

    (orderRepositoryMock.findAll as Mock).mockResolvedValue(mockPaginated);

    const result = await listOrdersService.execute({ page: 2, limit: 15 });

    expect(orderRepositoryMock.findAll).toHaveBeenCalledWith({ page: 2, limit: 15 });
    expect(result).toEqual(mockPaginated);
  });
});
