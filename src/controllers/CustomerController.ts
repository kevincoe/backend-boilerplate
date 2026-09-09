import { Request, Response, NextFunction } from "express";
import { CreateCustomerService } from "../services/CreateCustomerService";
import { GetCustomer360Service } from "../services/GetCustomer360Service";
import { ListCustomersService } from "../services/ListCustomersService";
import { UpdateCustomerService } from "../services/UpdateCustomerService";
import { DeleteCustomerService } from "../services/DeleteCustomerService";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer.schema";
import { idParamSchema } from "../schemas/params.schema";
import { paginationQuerySchema } from "../schemas/pagination.schema";

export class CustomerController {
  constructor(
    private readonly createCustomerService: CreateCustomerService,
    private readonly getCustomer360Service: GetCustomer360Service,
    private readonly listCustomersService: ListCustomersService,
    private readonly updateCustomerService: UpdateCustomerService,
    private readonly deleteCustomerService: DeleteCustomerService,
  ) {}

  public async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = createCustomerSchema.parse(req.body);
      const customer = await this.createCustomerService.execute(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }

  public async getCustomer360(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = idParamSchema.parse(req.params);
      const customer = await this.getCustomer360Service.execute(id);
      res.status(200).json(customer);
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
      const customers = await this.listCustomersService.execute(params);
      res.status(200).json(customers);
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
      const data = updateCustomerSchema.parse(req.body);
      const customer = await this.updateCustomerService.execute(id, data);
      res.status(200).json(customer);
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
      await this.deleteCustomerService.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
