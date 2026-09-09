import { Request, Response, NextFunction } from "express";
import { CreateQuoteService } from "../services/CreateQuoteService";
import { ConfirmOrderService } from "../services/ConfirmOrderService";
import { FinishOrderService } from "../services/FinishOrderService";
import { ListOrdersService } from "../services/ListOrdersService";
import { UpdateOrderService } from "../services/UpdateOrderService";
import { DeleteOrderService } from "../services/DeleteOrderService";
import {
  createQuoteSchema,
  confirmOrderSchema,
  updateOrderSchema,
} from "../schemas/order.schema";
import { idParamSchema, orderIdParamSchema } from "../schemas/params.schema";
import { paginationQuerySchema } from "../schemas/pagination.schema";

export class OrderController {
  constructor(
    private readonly createQuoteService: CreateQuoteService,
    private readonly confirmOrderService: ConfirmOrderService,
    private readonly finishOrderService: FinishOrderService,
    private readonly listOrdersService: ListOrdersService,
    private readonly updateOrderService: UpdateOrderService,
    private readonly deleteOrderService: DeleteOrderService,
  ) {}

  public async createQuote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = createQuoteSchema.parse(req.body);
      const quote = await this.createQuoteService.execute(validatedData);
      res.status(201).json(quote);
    } catch (error) {
      next(error);
    }
  }

  public async confirmOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { orderId } = orderIdParamSchema.parse(req.params);
      const validatedData = confirmOrderSchema.parse(req.body);

      const order = await this.confirmOrderService.execute(
        orderId,
        validatedData.paymentAmount,
      );
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  public async finishOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const order = await this.finishOrderService.execute(id);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  public async listOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = paginationQuerySchema.safeParse(req.query);
      const params = query.success ? query.data : undefined;
      const orders = await this.listOrdersService.execute(params);
      res.status(200).json(orders);
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
      const data = updateOrderSchema.parse(req.body);
      const order = await this.updateOrderService.execute({ id, ...data });
      res.status(200).json(order);
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
      await this.deleteOrderService.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
