import { PrismaClient, Contact } from "@prisma/client";
import {
  IContactRepository,
  CreateContactDTO,
  UpdateContactDTO,
} from "./contracts/IContactRepository";

export class ContactRepository implements IContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateContactDTO): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  public async findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({ where: { id } });
  }

  public async findByCustomerId(customerId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
  }

  public async update(id: string, data: UpdateContactDTO): Promise<Contact> {
    return this.prisma.contact.update({ where: { id }, data });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id } });
  }
}
