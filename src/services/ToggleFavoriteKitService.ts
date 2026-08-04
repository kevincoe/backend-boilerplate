import { KitRepository } from "../repositories/KitRepository";
import { AppError } from "../errors/AppError";
import { Kit } from "@prisma/client";

export class ToggleFavoriteKitService {
  constructor(private readonly kitRepository: KitRepository) {}

  public async execute(id: string, isFavorited: boolean): Promise<Kit> {
    const kit = await this.kitRepository.findById(id);
    
    if (!kit) {
      throw new AppError("Kit not found", 404);
    }

    return this.kitRepository.toggleFavorite(id, isFavorited);
  }
}
