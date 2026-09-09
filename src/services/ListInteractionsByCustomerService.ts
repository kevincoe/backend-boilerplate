import { Interaction } from "@prisma/client";
import {
  IInteractionRepository,
  PaginationParams,
  PaginatedResult,
} from "../repositories/contracts/IInteractionRepository";

export class ListInteractionsByCustomerService {
  constructor(private readonly interactionRepository: IInteractionRepository) {}

  public async execute(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Interaction> | Interaction[]> {
    return this.interactionRepository.findByCustomerId(customerId, params);
  }
}
