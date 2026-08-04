import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateKitService } from "../services/CreateKitService";
import { ListKitsService } from "../services/ListKitsService";
import { ToggleFavoriteKitService } from "../services/ToggleFavoriteKitService";

export class KitController {
  constructor(
    private readonly createKitService: CreateKitService,
    private readonly listKitsService: ListKitsService,
    private readonly toggleFavoriteKitService: ToggleFavoriteKitService
  ) {}

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createKitSchema = z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        price: z.number().min(0, "Price must be positive"),
        isFavorited: z.boolean().optional(),
        items: z.array(
          z.object({
            productBaseId: z.string().uuid("Invalid product base ID"),
            quantity: z.number().int().positive("Quantity must be positive"),
          })
        ).min(1, "At least one item is required"),
      });

      const data = createKitSchema.parse(req.body);
      const kit = await this.createKitService.execute(data);

      res.status(201).json(kit);
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kits = await this.listKitsService.execute();
      res.json(kits);
    } catch (error) {
      next(error);
    }
  }

  public async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const toggleSchema = z.object({
        isFavorited: z.boolean(),
      });

      const { id } = req.params;
      const { isFavorited } = toggleSchema.parse(req.body);

      const kit = await this.toggleFavoriteKitService.execute(id, isFavorited);

      res.json(kit);
    } catch (error) {
      next(error);
    }
  }
}
