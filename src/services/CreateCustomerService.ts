import { Customer } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { ICustomerRepository, CreateCustomerDTO } from "../repositories/contracts/ICustomerRepository";

export class CreateCustomerService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(data: CreateCustomerDTO): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findByEmail(data.email);

    if (existingCustomer) {
      throw new AppError("A customer with this email already exists.", 409);
    }

    return this.customerRepository.create(data);
  }
}
