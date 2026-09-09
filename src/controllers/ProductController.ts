import { Request, Response, NextFunction } from "express";
import { SearchProductsService } from "../services/SearchProductsService";
import { CreateProductService } from "../services/CreateProductService";
import { UpdateProductService } from "../services/UpdateProductService";
import { UpdateProductStockService } from "../services/UpdateProductStockService";
import { DeleteProductService } from "../services/DeleteProductService";
import {
  searchProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../schemas/product.schema";
import { idParamSchema } from "../schemas/params.schema";

export class ProductController {
  constructor(
    private readonly searchService: SearchProductsService,
    private readonly createService: CreateProductService,
    private readonly updateService: UpdateProductService,
    private readonly updateStockService: UpdateProductStockService,
    private readonly deleteService: DeleteProductService,
  ) {}

  public async index(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = searchProductsQuerySchema.parse(req.query);
      const result = await this.searchService.execute(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await this.createService.execute(data);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = updateProductSchema.parse(req.body);
      const product = await this.updateService.execute({ id, ...data });
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async updateStock(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { newStockQuantity } = updateStockSchema.parse(req.body);
      const product = await this.updateStockService.execute({
        id,
        newStockQuantity,
      });
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      await this.deleteService.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
