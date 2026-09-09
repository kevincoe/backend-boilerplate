import { Kit, KitItem, ProductBase } from "@prisma/client";

export type KitWithItems = Kit & {
  items: (KitItem & {
    productBase: ProductBase;
  })[];
};

export interface CreateKitDTO {
  name: string;
  description?: string;
  price: number;
  isFavorited?: boolean;
  items: {
    productBaseId: string;
    quantity: number;
  }[];
}

export interface FindAllKitsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedKitsResult {
  kits: KitWithItems[];
  total: number;
  page: number;
  limit: number;
}

export interface IKitRepository {
  create(data: CreateKitDTO): Promise<KitWithItems>;
  findAll(params?: FindAllKitsParams): Promise<PaginatedKitsResult | KitWithItems[]>;
  findById(id: string): Promise<KitWithItems | null>;
  toggleFavorite(id: string, isFavorited: boolean): Promise<Kit>;
}
