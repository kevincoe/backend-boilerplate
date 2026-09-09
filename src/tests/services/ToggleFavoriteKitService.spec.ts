import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { ToggleFavoriteKitService } from "../../services/ToggleFavoriteKitService";
import { IKitRepository } from "../../repositories/contracts/IKitRepository";
import { AppError } from "../../errors/AppError";

describe("ToggleFavoriteKitService", () => {
  let kitRepositoryMock: Record<string, Mock>;
  let toggleFavoriteKitService: ToggleFavoriteKitService;

  beforeEach(() => {
    kitRepositoryMock = {
      findById: vi.fn(),
      toggleFavorite: vi.fn(),
    };

    toggleFavoriteKitService = new ToggleFavoriteKitService(
      kitRepositoryMock as unknown as IKitRepository,
    );
  });

  it("should throw an error if kit is not found", async () => {
    (kitRepositoryMock.findById as Mock).mockResolvedValue(null);

    await expect(
      toggleFavoriteKitService.execute("invalid-kit-id", true),
    ).rejects.toThrow(new AppError("Kit not found", 404));
  });

  it("should successfully toggle favorite state of a kit", async () => {
    const existingKit = {
      id: "kit-1",
      name: "Podcast Kit",
      isFavorited: false,
    };

    (kitRepositoryMock.findById as Mock).mockResolvedValue(existingKit);
    (kitRepositoryMock.toggleFavorite as Mock).mockResolvedValue({
      ...existingKit,
      isFavorited: true,
    });

    const result = await toggleFavoriteKitService.execute("kit-1", true);

    expect(kitRepositoryMock.findById).toHaveBeenCalledWith("kit-1");
    expect(kitRepositoryMock.toggleFavorite).toHaveBeenCalledWith("kit-1", true);
    expect(result.isFavorited).toBe(true);
  });
});
