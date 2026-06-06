import { AppError } from '../errors/AppError';
import { OrderState } from '../domain/OrderState';

export interface AssetData {
  id: string;
}

export interface OrderData {
  id: string;
}

// Interfaces to simulate the Repositories (DAOs) injected via Dependency Inversion
export interface IOrderRepository {
  create(data: unknown): Promise<OrderData>;
  checkAssetsAvailability(assetIds: string[], startDate: Date, endDate: Date): Promise<string[]>;
}

export interface IAssetRepository {
  findAssetsByIds(assetIds: string[]): Promise<AssetData[]>;
}

export class CreateQuoteService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly assetRepository: IAssetRepository
  ) {}

  public async execute(data: { customerId: string; assetIds: string[]; pickUpDate: string; returnDate: string }) {
    const requestedAssets = await this.assetRepository.findAssetsByIds(data.assetIds);
    
    if (requestedAssets.length !== data.assetIds.length) {
      throw new AppError('One or more assets do not exist.', 404);
    }

    // Rule: +1 day buffer for cleaning
    const pickUpDate = new Date(data.pickUpDate);
    const returnDateWithBuffer = new Date(data.returnDate);
    returnDateWithBuffer.setDate(returnDateWithBuffer.getDate() + 1);

    // Checks if any asset is booked in another order overlapping this period
    const unavailableAssetIds = await this.orderRepository.checkAssetsAvailability(
      data.assetIds,
      pickUpDate,
      returnDateWithBuffer
    );

    if (unavailableAssetIds.length > 0) {
      throw new AppError(`Assets ${unavailableAssetIds.join(', ')} are not available for the requested period.`, 409);
    }

    // Since it's a quote, it doesn't block the physical asset status yet, it just creates a Draft Order
    // We'd calculate prices here based on the assets requested.
    return this.orderRepository.create({ ...data, state: OrderState.DRAFT });
  }
}