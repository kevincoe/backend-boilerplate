import {
  IOrderRepository,
  FindAllOrdersParams,
  PaginatedOrdersResult,
} from "../repositories/contracts/IOrderRepository";
import { Order } from "@prisma/client";

export class ListOrdersService {
  constructor(private readonly orderRepository: IOrderRepository) {}

  public async execute(
    params?: FindAllOrdersParams,
  ): Promise<PaginatedOrdersResult | Order[]> {
    return this.orderRepository.findAll(params);
  }
}
