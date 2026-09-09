import { Customer } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { ICustomerRepository, UpdateCustomerDTO } from "../repositories/contracts/ICustomerRepository";

export class UpdateCustomerService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    return this.customerRepository.update(id, data);
  }
}
