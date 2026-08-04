import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CreateQuoteService } from "../services/CreateQuoteService";
import { ConfirmOrderService } from "../services/ConfirmOrderService";
import { FinishOrderService } from "../services/FinishOrderService";
import { ListOrdersService } from "../services/ListOrdersService";
import { UpdateOrderService } from "../services/UpdateOrderService";
import { DeleteOrderService } from "../services/DeleteOrderService";
import { createQuoteSchema, confirmOrderSchema } from "../schemas/order.schema";

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
      const { orderId } = req.params;
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
      const { id } = req.params;
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
      const orders = await this.listOrdersService.execute();
      res.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const bodySchema = z.object({
      pickUpDate: z.string().datetime().optional(),
      returnDate: z.string().datetime().optional(),
      totalAmount: z.number().positive().optional(),
    });

    try {
      const data = bodySchema.parse(req.body);
      const order = await this.updateOrderService.execute({ id, ...data });
      return res.json(order);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: err.message || "Erro interno ao atualizar pedido" });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      await this.deleteOrderService.execute(id);
      return res.status(204).send();
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      const statusCode = err.statusCode || 500;
      return res
        .status(statusCode)
        .json({ message: err.message || "Erro interno ao excluir pedido" });
    }
  }
}
