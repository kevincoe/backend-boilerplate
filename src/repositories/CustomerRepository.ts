import { PrismaClient, Customer } from '@prisma/client';

export class CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async upsertCustomer(data: {
    name: string;
    email: string;
    phone: string;
    document: string;
  }): Promise<Customer> {
    // Busca pelo email ou documento
    let customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { email: data.email },
          { document: data.document }
        ]
      }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          document: data.document
        }
      });
    }

    return customer;
  }
}
