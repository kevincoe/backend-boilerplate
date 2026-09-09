import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ListKitsService } from "../../services/ListKitsService";
import { IKitRepository } from "../../repositories/contracts/IKitRepository";

describe("ListKitsService", () => {
  let kitRepositoryMock: Record<string, Mock>;
  let listKitsService: ListKitsService;

  beforeEach(() => {
    kitRepositoryMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      toggleFavorite: vi.fn(),
    };

    listKitsService = new ListKitsService(
      kitRepositoryMock as unknown as IKitRepository,
    );
  });

  it("should return all kits without params", async () => {
    const mockKits = [
      {
        id: "kit-1",
        name: "Lighting Kit",
        price: 200,
        items: [],
      },
    ];

    (kitRepositoryMock.findAll as Mock).mockResolvedValue(mockKits);

    const result = await listKitsService.execute();

    expect(kitRepositoryMock.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockKits);
  });

  it("should return paginated kits when pagination params are passed", async () => {
    const mockPaginated = {
      kits: [
        {
          id: "kit-1",
          name: "Lighting Kit",
          price: 200,
          items: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    (kitRepositoryMock.findAll as Mock).mockResolvedValue(mockPaginated);

    const result = await listKitsService.execute({ page: 1, limit: 10 });

    expect(kitRepositoryMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(result).toEqual(mockPaginated);
  });
});
