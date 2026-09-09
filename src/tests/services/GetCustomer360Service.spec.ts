import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { GetCustomer360Service } from "../../services/GetCustomer360Service";
import { AppError } from "../../errors/AppError";
import { ICustomerRepository } from "../../repositories/contracts/ICustomerRepository";

describe("GetCustomer360Service", () => {
  let customerRepositoryMock: Record<string, Mock>;
  let getCustomer360Service: GetCustomer360Service;

  beforeEach(() => {
    customerRepositoryMock = {
      findById: vi.fn(),
    };

    getCustomer360Service = new GetCustomer360Service(
      customerRepositoryMock as unknown as ICustomerRepository,
    );
  });

  it("should return full customer 360 data", async () => {
    const mockCustomer360 = {
      id: "customer-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      document: "12345678901",
      score: 10,
      contacts: [
        {
          id: "contact-1",
          customerId: "customer-1",
          type: "EMAIL",
          value: "john@example.com",
          label: "Work",
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      interactions: [
        {
          id: "interaction-1",
          customerId: "customer-1",
          type: "NOTE",
          subject: "Initial contact",
          description: null,
          metadata: null,
          performedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      orders: [
        {
          id: "order-1",
          customerId: "customer-1",
          state: "DRAFT",
          totalAmount: 500,
          amountPaid: 0,
          pickUpDate: new Date(),
          returnDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (customerRepositoryMock.findById as Mock).mockResolvedValue(mockCustomer360);

    const result = await getCustomer360Service.execute("customer-1");

    expect(customerRepositoryMock.findById).toHaveBeenCalledWith("customer-1");
    expect(result.id).toEqual("customer-1");
    expect(result.contacts).toHaveLength(1);
    expect(result.interactions).toHaveLength(1);
    expect(result.orders).toHaveLength(1);
  });

  it("should throw an error if customer is not found", async () => {
    (customerRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(getCustomer360Service.execute("invalid-id")).rejects.toThrow(
      new AppError("Customer not found.", 404),
    );
  });
});
