import { Contact } from "@prisma/client";
import { IContactRepository } from "../repositories/contracts/IContactRepository";

export class ListContactsByCustomerService {
  constructor(private readonly contactRepository: IContactRepository) {}

  public async execute(customerId: string): Promise<Contact[]> {
    return this.contactRepository.findByCustomerId(customerId);
  }
}
