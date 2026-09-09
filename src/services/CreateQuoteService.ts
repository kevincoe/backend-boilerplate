import { AppError } from "../errors/AppError";
import { OrderState } from "../domain/OrderState";
import { IOrderRepository } from "../repositories/contracts/IOrderRepository";
import { IAssetRepository } from "../repositories/contracts/IAssetRepository";
import { ICustomerRepository } from "../repositories/contracts/ICustomerRepository";
import { IProductRepository } from "../repositories/contracts/IProductRepository";

export interface AssetData {
  id: string;
}

export interface OrderData {
  id: string;
}

export { IOrderRepository, IAssetRepository, ICustomerRepository, IProductRepository };

export class CreateQuoteService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly assetRepository: IAssetRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(data: {
    customer: { name: string; email: string; phone: string; document: string };
    items: { productId: string; quantity: number }[];
    pickUpDate: string;
    returnDate: string;
  }) {
    // Rule: +1 day buffer for cleaning
    const pickUpDate = new Date(data.pickUpDate);
    const returnDateWithBuffer = new Date(data.returnDate);
    returnDateWithBuffer.setDate(returnDateWithBuffer.getDate() + 1);

    const assetIdsToRent: string[] = [];
    let totalAmount = 0;

    // Calculate total days (minimum 1)
    const timeDiff = Math.max(
      returnDateWithBuffer.getTime() - pickUpDate.getTime(),
      0,
    );
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;

    for (const item of data.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found.`, 404);
      }

      const availableCount =
        await this.assetRepository.countAvailableAssetsForProduct(
          item.productId,
          pickUpDate,
          returnDateWithBuffer,
        );

      if (availableCount < item.quantity) {
        throw new AppError(
          `Insufficient stock for product "${product.name}". Requested: ${item.quantity}, Available: ${availableCount}.`,
          409,
        );
      }

      const availableAssets =
        await this.assetRepository.findAvailableAssetsForProduct(
          item.productId,
          item.quantity,
          pickUpDate,
          returnDateWithBuffer,
        );

      for (const asset of availableAssets) {
        assetIdsToRent.push(asset.id);
        totalAmount += Number(asset.product.dailyPrice) * days;
      }
    }

    const customer = await this.customerRepository.upsertCustomer(
      data.customer,
    );

    return this.orderRepository.create({
      customerId: customer.id,
      pickUpDate: data.pickUpDate,
      returnDate: data.returnDate,
      assetIds: assetIdsToRent,
      totalAmount,
      state: OrderState.DRAFT,
    });
  }
}
