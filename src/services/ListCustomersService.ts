import { Customer } from "@prisma/client";
import {
  ICustomerRepository,
  PaginationParams,
  PaginatedResult,
} from "../repositories/contracts/ICustomerRepository";

export class ListCustomersService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  public async execute(
    params?: PaginationParams,
  ): Promise<PaginatedResult<Customer> | Customer[]> {
    return this.customerRepository.findAll(params);
  }
}
