import { Interaction } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { IInteractionRepository, CreateInteractionDTO } from "../repositories/contracts/IInteractionRepository";
import { ICustomerRepository } from "../repositories/contracts/ICustomerRepository";

export class CreateInteractionService {
  constructor(
    private readonly interactionRepository: IInteractionRepository,
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(data: CreateInteractionDTO): Promise<Interaction> {
    const customer = await this.customerRepository.findById(data.customerId);

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    return this.interactionRepository.create(data);
  }
}
