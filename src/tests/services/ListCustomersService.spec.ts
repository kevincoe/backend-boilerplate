import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ListCustomersService } from "../../services/ListCustomersService";
import { ICustomerRepository } from "../../repositories/contracts/ICustomerRepository";

describe("ListCustomersService", () => {
  let customerRepositoryMock: Record<string, Mock>;
  let listCustomersService: ListCustomersService;

  beforeEach(() => {
    customerRepositoryMock = {
      findAll: vi.fn(),
    };

    listCustomersService = new ListCustomersService(
      customerRepositoryMock as unknown as ICustomerRepository,
    );
  });

  it("should return customers when called without params", async () => {
    const mockCustomers = [
      {
        id: "customer-1",
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        document: "12345678901",
        score: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (customerRepositoryMock.findAll as Mock).mockResolvedValue(mockCustomers);

    const result = await listCustomersService.execute();

    expect(customerRepositoryMock.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockCustomers);
  });

  it("should return paginated customers when called with pagination params", async () => {
    const mockPaginated = {
      data: [
        {
          id: "customer-1",
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          document: "12345678901",
          score: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    };

    (customerRepositoryMock.findAll as Mock).mockResolvedValue(mockPaginated);

    const result = await listCustomersService.execute({ page: 1, limit: 20 });

    expect(customerRepositoryMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result).toEqual(mockPaginated);
  });
});
