import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateCustomerService } from "../../services/CreateCustomerService";
import { AppError } from "../../errors/AppError";
import { ICustomerRepository } from "../../repositories/contracts/ICustomerRepository";

describe("CreateCustomerService", () => {
  let customerRepositoryMock: Record<string, Mock>;
  let createCustomerService: CreateCustomerService;

  beforeEach(() => {
    customerRepositoryMock = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    createCustomerService = new CreateCustomerService(
      customerRepositoryMock as unknown as ICustomerRepository,
    );
  });

  it("should create a customer successfully", async () => {
    const customerInput = {
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      document: "12345678901",
    };

    const mockCustomer = {
      id: "customer-1",
      ...customerInput,
      score: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (customerRepositoryMock.findByEmail as Mock).mockResolvedValue(null);
    (customerRepositoryMock.create as Mock).mockResolvedValue(mockCustomer);

    const result = await createCustomerService.execute(customerInput);

    expect(customerRepositoryMock.findByEmail).toHaveBeenCalledWith("john@example.com");
    expect(customerRepositoryMock.create).toHaveBeenCalledWith(customerInput);
    expect(result.id).toEqual("customer-1");
    expect(result.name).toEqual("John Doe");
  });

  it("should throw an error if email already exists", async () => {
    const existingCustomer = {
      id: "customer-1",
      name: "Existing User",
      email: "john@example.com",
      phone: "1234567890",
      document: "12345678901",
      score: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (customerRepositoryMock.findByEmail as Mock).mockResolvedValue(existingCustomer);

    const customerInput = {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      document: "98765432101",
    };

    await expect(createCustomerService.execute(customerInput)).rejects.toThrow(
      new AppError("A customer with this email already exists.", 409),
    );

    expect(customerRepositoryMock.create).not.toHaveBeenCalled();
  });
});
