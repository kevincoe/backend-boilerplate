import { Order, OrderAsset, OrderState, AssetState } from "@prisma/client";

export type OrderWithAssets = Order & {
  assets: OrderAsset[];
};

export interface CreateOrderDTO {
  customerId: string;
  pickUpDate: Date | string;
  returnDate: Date | string;
  state: OrderState;
  assetIds: string[];
  totalAmount: number;
}

export interface FindAllOrdersParams {
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface IOrderRepository {
  create(data: CreateOrderDTO): Promise<OrderWithAssets>;
  findById(id: string): Promise<OrderWithAssets | null>;
  findAll(params?: FindAllOrdersParams): Promise<PaginatedOrdersResult | Order[]>;
  updateState(id: string, state: OrderState, amountPaid?: number): Promise<OrderWithAssets>;
  updateAssetStates(assetIds: string[], state: AssetState): Promise<void>;
  checkAssetsAvailability(
    assetIds: string[],
    startDate: Date,
    endDate: Date,
    excludeOrderId?: string,
  ): Promise<string[]>;
  update(
    id: string,
    data: { pickUpDate?: Date; returnDate?: Date; totalAmount?: number },
  ): Promise<Order>;
  delete(id: string): Promise<void>;
  confirmOrderTransaction?(
    orderId: string,
    amountPaid: number,
    assetIds: string[],
  ): Promise<Order>;
}
