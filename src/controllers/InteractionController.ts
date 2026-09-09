import { Request, Response, NextFunction } from "express";
import { CreateInteractionService } from "../services/CreateInteractionService";
import { ListInteractionsByCustomerService } from "../services/ListInteractionsByCustomerService";
import { DeleteInteractionService } from "../services/DeleteInteractionService";
import { createInteractionSchema } from "../schemas/interaction.schema";
import { idParamSchema } from "../schemas/params.schema";
import { paginationQuerySchema } from "../schemas/pagination.schema";
import { z } from "zod";

const customerIdParamSchema = z.object({
  customerId: z.string().uuid("Parameter :customerId must be a valid UUID"),
});

export class InteractionController {
  constructor(
    private readonly createInteractionService: CreateInteractionService,
    private readonly listInteractionsByCustomerService: ListInteractionsByCustomerService,
    private readonly deleteInteractionService: DeleteInteractionService,
  ) {}

  public async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = createInteractionSchema.parse(req.body);
      const interaction = await this.createInteractionService.execute(validatedData);
      res.status(201).json(interaction);
    } catch (error) {
      next(error);
    }
  }

  public async listByCustomer(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { customerId } = customerIdParamSchema.parse(req.params);
      const query = paginationQuerySchema.safeParse(req.query);
      const params = query.success ? query.data : undefined;
      const interactions = await this.listInteractionsByCustomerService.execute(
        customerId,
        params,
      );
      res.status(200).json(interactions);
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
      await this.deleteInteractionService.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
