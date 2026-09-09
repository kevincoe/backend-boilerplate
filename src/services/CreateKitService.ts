import {
  IKitRepository,
  CreateKitDTO,
  KitWithItems,
} from "../repositories/contracts/IKitRepository";
import { AppError } from "../errors/AppError";

export class CreateKitService {
  constructor(private readonly kitRepository: IKitRepository) {}

  public async execute(data: CreateKitDTO): Promise<KitWithItems> {
    if (!data.name) {
      throw new AppError("Kit name is required", 400);
    }
    
    if (!data.items || data.items.length === 0) {
      throw new AppError("A Kit must contain at least one item", 400);
    }

    // You could also validate if the productBaseIds exist here.
    
    return this.kitRepository.create(data);
  }
}
