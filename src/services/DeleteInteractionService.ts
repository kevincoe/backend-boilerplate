import { AppError } from "../errors/AppError";
import { IInteractionRepository } from "../repositories/contracts/IInteractionRepository";

export class DeleteInteractionService {
  constructor(private readonly interactionRepository: IInteractionRepository) {}

  public async execute(id: string): Promise<void> {
    const interaction = await this.interactionRepository.findById(id);

    if (!interaction) {
      throw new AppError("Interaction not found.", 404);
    }

    await this.interactionRepository.delete(id);
  }
}
