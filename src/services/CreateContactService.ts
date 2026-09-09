import { Contact } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { IContactRepository, CreateContactDTO } from "../repositories/contracts/IContactRepository";
import { ICustomerRepository } from "../repositories/contracts/ICustomerRepository";

export class CreateContactService {
  constructor(
    private readonly contactRepository: IContactRepository,
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(data: CreateContactDTO): Promise<Contact> {
    const customer = await this.customerRepository.findById(data.customerId);

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    return this.contactRepository.create(data);
  }
}
