import { OrderData } from './CreateQuoteService';

export interface IListOrdersRepository {
  findAll(): Promise<OrderData[]>;
}

export class ListOrdersService {
  constructor(private readonly orderRepository: IListOrdersRepository) {}

  public async execute() {
    return this.orderRepository.findAll();
  }
}
