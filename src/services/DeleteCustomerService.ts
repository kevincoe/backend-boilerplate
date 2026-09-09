import { AppError } from "../errors/AppError";
import { ICustomerRepository } from "../repositories/contracts/ICustomerRepository";

export class DeleteCustomerService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    await this.customerRepository.delete(id);
  }
}
