import { KitRepository, KitWithItems } from "../repositories/KitRepository";

export class ListKitsService {
  constructor(private readonly kitRepository: KitRepository) {}

  public async execute(): Promise<KitWithItems[]> {
    return this.kitRepository.findAll();
  }
}
