import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { CreateKitService } from "../../services/CreateKitService";
import { IKitRepository } from "../../repositories/contracts/IKitRepository";
import { AppError } from "../../errors/AppError";

describe("CreateKitService", () => {
  let kitRepositoryMock: Record<string, Mock>;
  let createKitService: CreateKitService;

  beforeEach(() => {
    kitRepositoryMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      toggleFavorite: vi.fn(),
    };

    createKitService = new CreateKitService(
      kitRepositoryMock as unknown as IKitRepository,
    );
  });

  it("should throw an error if kit name is missing", async () => {
    await expect(
      createKitService.execute({
        name: "",
        price: 100,
        items: [{ productBaseId: "prod-1", quantity: 1 }],
      }),
    ).rejects.toThrow(new AppError("Kit name is required", 400));
  });

  it("should throw an error if items array is empty", async () => {
    await expect(
      createKitService.execute({
        name: "Podcast Kit",
        price: 100,
        items: [],
      }),
    ).rejects.toThrow(new AppError("A Kit must contain at least one item", 400));
  });

  it("should create a kit successfully", async () => {
    const kitDTO = {
      name: "Podcast Kit",
      description: "Complete audio setup",
      price: 150,
      isFavorited: false,
      items: [{ productBaseId: "prod-1", quantity: 2 }],
    };

    const mockKitResponse = {
      id: "kit-1",
      ...kitDTO,
      items: [
        {
          id: "item-1",
          kitId: "kit-1",
          productBaseId: "prod-1",
          quantity: 2,
          productBase: { id: "prod-1", name: "Microphone" },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (kitRepositoryMock.create as Mock).mockResolvedValue(mockKitResponse);

    const result = await createKitService.execute(kitDTO);

    expect(kitRepositoryMock.create).toHaveBeenCalledWith(kitDTO);
    expect(result.id).toBe("kit-1");
    expect(result.name).toBe("Podcast Kit");
    expect(result.items).toHaveLength(1);
  });
});
