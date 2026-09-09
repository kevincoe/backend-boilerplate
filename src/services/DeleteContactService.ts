import { AppError } from "../errors/AppError";
import { IContactRepository } from "../repositories/contracts/IContactRepository";

export class DeleteContactService {
  constructor(private readonly contactRepository: IContactRepository) {}

  public async execute(id: string): Promise<void> {
    const contact = await this.contactRepository.findById(id);

    if (!contact) {
      throw new AppError("Contact not found.", 404);
    }

    await this.contactRepository.delete(id);
  }
}
