import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateContactService } from "../../services/CreateContactService";
import { AppError } from "../../errors/AppError";
import { IContactRepository } from "../../repositories/contracts/IContactRepository";
import { ICustomerRepository } from "../../repositories/contracts/ICustomerRepository";
import { ContactType } from "@prisma/client";

describe("CreateContactService", () => {
  let contactRepositoryMock: Record<string, Mock>;
  let customerRepositoryMock: Record<string, Mock>;
  let createContactService: CreateContactService;

  beforeEach(() => {
    contactRepositoryMock = {
      create: vi.fn(),
    };

    customerRepositoryMock = {
      findById: vi.fn(),
    };

    createContactService = new CreateContactService(
      contactRepositoryMock as unknown as IContactRepository,
      customerRepositoryMock as unknown as ICustomerRepository,
    );
  });

  it("should create a contact successfully", async () => {
    const customerData = {
      id: "customer-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      document: "12345678901",
      score: 10,
      contacts: [],
      interactions: [],
      orders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const contactInput = {
      customerId: "customer-1",
      type: "EMAIL" as ContactType,
      value: "john@example.com",
      label: "Work",
      isPrimary: true,
    };

    const mockContact = {
      id: "contact-1",
      ...contactInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (customerRepositoryMock.findById as Mock).mockResolvedValue(customerData);
    (contactRepositoryMock.create as Mock).mockResolvedValue(mockContact);

    const result = await createContactService.execute(contactInput);

    expect(customerRepositoryMock.findById).toHaveBeenCalledWith("customer-1");
    expect(contactRepositoryMock.create).toHaveBeenCalledWith(contactInput);
    expect(result.id).toEqual("contact-1");
  });

  it("should throw an error if customer is not found", async () => {
    (customerRepositoryMock.findById as Mock).mockResolvedValue(null);

    const contactInput = {
      customerId: "invalid-id",
      type: "EMAIL" as ContactType,
      value: "john@example.com",
    };

    await expect(createContactService.execute(contactInput)).rejects.toThrow(
      new AppError("Customer not found.", 404),
    );
  });
});
