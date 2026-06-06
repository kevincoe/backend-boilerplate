import { PrismaClient, Asset } from '@prisma/client';

export class AssetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findAssetsByIds(assetIds: string[]): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: {
        id: { in: assetIds }
      }
    });
  }
}