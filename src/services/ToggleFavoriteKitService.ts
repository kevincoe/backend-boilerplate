import { IKitRepository } from "../repositories/contracts/IKitRepository";
import { AppError } from "../errors/AppError";
import { Kit } from "@prisma/client";

export class ToggleFavoriteKitService {
  constructor(private readonly kitRepository: IKitRepository) {}

  public async execute(id: string, isFavorited: boolean): Promise<Kit> {
    const kit = await this.kitRepository.findById(id);
    
    if (!kit) {
      throw new AppError("Kit not found", 404);
    }

    return this.kitRepository.toggleFavorite(id, isFavorited);
  }
}
