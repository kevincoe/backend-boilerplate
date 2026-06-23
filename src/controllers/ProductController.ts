import { Request, Response } from 'express';
import { z } from 'zod';

export class ProductController {
  public async index(req: Request, res: Response): Promise<Response> {
    // 1. Validação dos Query Params
    const querySchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      category: z.string().optional(),
      search: z.string().optional(),
    });

    const { page, limit } = querySchema.parse(req.query);

    // 2. Mock de dados (Substituir pela chamada ao Service futuramente)
    const mockProducts = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Sony Alpha a7 III',
        description: 'Câmera Mirrorless Full-Frame de alto desempenho para vídeo e foto.',
        pricePerDay: 150,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
        isAvailable: true,
        category: 'camera',
      },
      {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        name: 'Lens 24-70mm f/2.8',
        description: 'Lente zoom versátil G Master, ideal para eventos e retratos.',
        pricePerDay: 100,
        imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4ea2e935',
        isAvailable: true,
        category: 'lens',
      },
    ];

    // 3. Resposta padronizada para paginação
    return res.json({
      data: mockProducts,
      total: mockProducts.length,
      page,
      limit,
    });
  }
}