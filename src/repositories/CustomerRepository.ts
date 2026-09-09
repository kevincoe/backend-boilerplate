import { PrismaClient, Customer } from "@prisma/client";
import {
  ICustomerRepository,
  UpsertCustomerDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerWith360,
  PaginationParams,
  PaginatedResult,
} from "./contracts/ICustomerRepository";

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async upsertCustomer(data: UpsertCustomerDTO): Promise<Customer> {
    // Busca pelo email ou documento
    let customer = await this.prisma.customer.findFirst({
      where: {
        OR: [{ email: data.email }, { document: data.document }],
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          document: data.document,
        },
      });
    }

    return customer;
  }

  public async create(data: CreateCustomerDTO): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  public async findById(id: string): Promise<CustomerWith360 | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { createdAt: "desc" } },
        interactions: { orderBy: { performedAt: "desc" }, take: 20 },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  public async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  public async findAll(
    params?: PaginationParams,
  ): Promise<PaginatedResult<Customer> | Customer[]> {
    if (!params || (params.page === undefined && params.limit === undefined)) {
      return this.prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.customer.count(),
    ]);

    return { data, total, page, limit };
  }

  public async update(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
  }
}
