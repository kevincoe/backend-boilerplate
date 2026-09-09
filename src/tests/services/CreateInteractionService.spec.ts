import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateInteractionService } from "../../services/CreateInteractionService";
import { AppError } from "../../errors/AppError";
import { IInteractionRepository } from "../../repositories/contracts/IInteractionRepository";
import { ICustomerRepository } from "../../repositories/contracts/ICustomerRepository";
import { InteractionType } from "@prisma/client";

describe("CreateInteractionService", () => {
  let interactionRepositoryMock: Record<string, Mock>;
  let customerRepositoryMock: Record<string, Mock>;
  let createInteractionService: CreateInteractionService;

  beforeEach(() => {
    interactionRepositoryMock = {
      create: vi.fn(),
    };

    customerRepositoryMock = {
      findById: vi.fn(),
    };

    createInteractionService = new CreateInteractionService(
      interactionRepositoryMock as unknown as IInteractionRepository,
      customerRepositoryMock as unknown as ICustomerRepository,
    );
  });

  it("should create an interaction successfully", async () => {
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

    const interactionInput = {
      customerId: "customer-1",
      type: "NOTE" as InteractionType,
      subject: "Follow-up call",
      description: "Discussed project requirements",
    };

    const mockInteraction = {
      id: "interaction-1",
      ...interactionInput,
      metadata: null,
      performedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (customerRepositoryMock.findById as Mock).mockResolvedValue(customerData);
    (interactionRepositoryMock.create as Mock).mockResolvedValue(mockInteraction);

    const result = await createInteractionService.execute(interactionInput);

    expect(customerRepositoryMock.findById).toHaveBeenCalledWith("customer-1");
    expect(interactionRepositoryMock.create).toHaveBeenCalledWith(interactionInput);
    expect(result.id).toEqual("interaction-1");
  });

  it("should throw an error if customer is not found", async () => {
    (customerRepositoryMock.findById as Mock).mockResolvedValue(null);

    const interactionInput = {
      customerId: "invalid-id",
      type: "CALL" as InteractionType,
      subject: "Sales call",
    };

    await expect(createInteractionService.execute(interactionInput)).rejects.toThrow(
      new AppError("Customer not found.", 404),
    );
  });
});
