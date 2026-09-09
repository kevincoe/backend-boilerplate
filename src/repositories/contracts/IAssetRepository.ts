import { Asset, Prisma } from "@prisma/client";

export type AssetWithProduct = Asset & {
  product: {
    dailyPrice: Prisma.Decimal;
  };
};

export interface IAssetRepository {
  findAssetsByIds(assetIds: string[]): Promise<Asset[]>;
  findAvailableAssetsForProduct(
    productId: string,
    quantity: number,
    startDate: Date,
    endDate: Date,
  ): Promise<AssetWithProduct[]>;
  countAvailableAssetsForProduct(
    productId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;
}
