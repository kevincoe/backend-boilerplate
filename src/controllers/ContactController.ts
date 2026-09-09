import { Request, Response, NextFunction } from "express";
import { CreateContactService } from "../services/CreateContactService";
import { ListContactsByCustomerService } from "../services/ListContactsByCustomerService";
import { UpdateContactService } from "../services/UpdateContactService";
import { DeleteContactService } from "../services/DeleteContactService";
import { createContactSchema, updateContactSchema } from "../schemas/contact.schema";
import { idParamSchema } from "../schemas/params.schema";
import { z } from "zod";

const customerIdParamSchema = z.object({
  customerId: z.string().uuid("Parameter :customerId must be a valid UUID"),
});

export class ContactController {
  constructor(
    private readonly createContactService: CreateContactService,
    private readonly listContactsByCustomerService: ListContactsByCustomerService,
    private readonly updateContactService: UpdateContactService,
    private readonly deleteContactService: DeleteContactService,
  ) {}

  public async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedData = createContactSchema.parse(req.body);
      const contact = await this.createContactService.execute(validatedData);
      res.status(201).json(contact);
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
      const contacts = await this.listContactsByCustomerService.execute(customerId);
      res.status(200).json(contacts);
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
      const data = updateContactSchema.parse(req.body);
      const contact = await this.updateContactService.execute(id, data);
      res.status(200).json(contact);
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
      await this.deleteContactService.execute(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
