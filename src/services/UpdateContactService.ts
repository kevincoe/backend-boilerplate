import { Contact } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { IContactRepository, UpdateContactDTO } from "../repositories/contracts/IContactRepository";

export class UpdateContactService {
  constructor(private readonly contactRepository: IContactRepository) {}

  public async execute(id: string, data: UpdateContactDTO): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);

    if (!contact) {
      throw new AppError("Contact not found.", 404);
    }

    return this.contactRepository.update(id, data);
  }
}
