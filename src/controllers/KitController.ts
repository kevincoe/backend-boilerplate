import { Request, Response, NextFunction } from "express";
import { CreateKitService } from "../services/CreateKitService";
import { ListKitsService } from "../services/ListKitsService";
import { ToggleFavoriteKitService } from "../services/ToggleFavoriteKitService";
import { createKitSchema, toggleFavoriteKitSchema } from "../schemas/kit.schema";
import { idParamSchema } from "../schemas/params.schema";
import { paginationQuerySchema } from "../schemas/pagination.schema";

export class KitController {
  constructor(
    private readonly createKitService: CreateKitService,
    private readonly listKitsService: ListKitsService,
    private readonly toggleFavoriteKitService: ToggleFavoriteKitService,
  ) {}

  public async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = createKitSchema.parse(req.body);
      const kit = await this.createKitService.execute(data);
      res.status(201).json(kit);
    } catch (error) {
      next(error);
    }
  }

  public async list(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = paginationQuerySchema.safeParse(req.query);
      const params = query.success ? query.data : undefined;
      const kits = await this.listKitsService.execute(params);
      res.status(200).json(kits);
    } catch (error) {
      next(error);
    }
  }

  public async toggleFavorite(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { isFavorited } = toggleFavoriteKitSchema.parse(req.body);
      const kit = await this.toggleFavoriteKitService.execute(id, isFavorited);
      res.status(200).json(kit);
    } catch (error) {
      next(error);
    }
  }
}
