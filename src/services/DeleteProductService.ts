import { ProductRepository } from '../repositories/ProductRepository';
import { AppError } from '../errors/AppError';
import { Prisma } from '@prisma/client';

export class DeleteProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  public async execute(id: string) {
    const product = await this.productRepository.update(id, {}); // Returns with assets
    if (!product) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const hasRentedAssets = product.assets.some(a => a.state !== 'AVAILABLE');
    if (hasRentedAssets) {
      throw new AppError('Não é possível excluir este produto pois existem equipamentos alugados ou reservados associados a ele. Remova-os do estoque disponível primeiro.', 400);
    }

    try {
      await this.productRepository.delete(id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Não é possível excluir este produto pois ele possui histórico de locações em pedidos anteriores. Considere zerar o estoque dele em vez de excluí-lo.', 400);
      }
      throw error;
    }

    return { success: true };
  }
}
