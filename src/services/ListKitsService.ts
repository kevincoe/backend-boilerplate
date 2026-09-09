import {
  IKitRepository,
  KitWithItems,
  PaginatedKitsResult,
  FindAllKitsParams,
} from "../repositories/contracts/IKitRepository";

export class ListKitsService {
  constructor(private readonly kitRepository: IKitRepository) {}

  public async execute(
    params?: FindAllKitsParams,
  ): Promise<PaginatedKitsResult | KitWithItems[]> {
    return this.kitRepository.findAll(params);
  }
}
