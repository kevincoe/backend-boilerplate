import { Request, Response } from "express";
import { z } from "zod";
import { ProductCategory } from "@prisma/client";
import { SearchProductsService } from "../services/SearchProductsService";
import { CreateProductService } from "../services/CreateProductService";
import { UpdateProductService } from "../services/UpdateProductService";
import { UpdateProductStockService } from "../services/UpdateProductStockService";
import { DeleteProductService } from "../services/DeleteProductService";

export class ProductController {
  constructor(
    private readonly searchService: SearchProductsService,
    private readonly createService: CreateProductService,
    private readonly updateService: UpdateProductService,
    private readonly updateStockService: UpdateProductStockService,
    private readonly deleteService: DeleteProductService,
  ) {}

  public async index(req: Request, res: Response): Promise<Response> {
    const querySchema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      category: z.string().optional(),
      search: z.string().optional(),
    });

    try {
      const query = querySchema.parse(req.query);
      const result = await this.searchService.execute(query);
      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ error: "Erro interno ao buscar produtos" });
    }
  }

  public async create(req: Request, res: Response): Promise<Response> {
    const bodySchema = z.object({
      name: z.string().min(3),
      description: z.string().optional(),
      category: z.nativeEnum(ProductCategory),
      pricePerDay: z.number().positive(),
      stock: z.number().int().min(0),
      imageUrl: z.string().optional(),
    });

    try {
      const data = bodySchema.parse(req.body);
      const product = await this.createService.execute(data);
      return res.status(201).json(product);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: err.message || "Erro interno ao criar produto" });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const bodySchema = z.object({
      name: z.string().min(3).optional(),
      description: z.string().optional(),
      category: z.nativeEnum(ProductCategory).optional(),
      pricePerDay: z.number().positive().optional(),
      imageUrl: z.string().optional(),
    });

    try {
      const data = bodySchema.parse(req.body);
      const product = await this.updateService.execute({ id, ...data });
      return res.json(product);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        message: err.message || "Erro interno ao atualizar produto",
      });
    }
  }

  public async updateStock(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const bodySchema = z.object({
      newStockQuantity: z.number().int().min(0),
    });

    try {
      const { newStockQuantity } = bodySchema.parse(req.body);
      const product = await this.updateStockService.execute({
        id,
        newStockQuantity,
      });
      return res.json(product);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        message: err.message || "Erro interno ao atualizar estoque",
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      await this.deleteService.execute(id);
      return res.status(204).send();
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        message: err.message || "Erro interno ao deletar produto",
      });
    }
  }
}
