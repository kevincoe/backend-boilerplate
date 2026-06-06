import { Request, Response, NextFunction } from 'express';
import { CreateQuoteService } from '../services/CreateQuoteService';
import { ConfirmOrderService } from '../services/ConfirmOrderService';
import { createQuoteSchema, confirmOrderSchema } from '../schemas/order.schema';

export class OrderController {
  constructor(
    private readonly createQuoteService: CreateQuoteService,
    private readonly confirmOrderService: ConfirmOrderService
  ) {}

  public async createQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createQuoteSchema.parse(req.body);
      
      const quote = await this.createQuoteService.execute(validatedData);
      res.status(201).json(quote);
    } catch (error) {
      next(error);
    }
  }

  public async confirmOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const validatedData = confirmOrderSchema.parse(req.body);
      
      const order = await this.confirmOrderService.execute(orderId, validatedData.paymentAmount);
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}