import { AppError } from "../errors/AppError";
import { ICustomerRepository, CustomerWith360 } from "../repositories/contracts/ICustomerRepository";

export class GetCustomer360Service {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(id: string): Promise<CustomerWith360> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    return customer;
  }
}
