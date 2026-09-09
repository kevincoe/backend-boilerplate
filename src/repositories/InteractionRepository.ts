import { PrismaClient, Interaction } from "@prisma/client";
import {
  IInteractionRepository,
  CreateInteractionDTO,
  PaginationParams,
  PaginatedResult,
} from "./contracts/IInteractionRepository";

export class InteractionRepository implements IInteractionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async create(data: CreateInteractionDTO): Promise<Interaction> {
    return this.prisma.interaction.create({ data });
  }

  public async findById(id: string): Promise<Interaction | null> {
    return this.prisma.interaction.findUnique({ where: { id } });
  }

  public async findByCustomerId(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Interaction> | Interaction[]> {
    const where = { customerId };

    if (!params || (params.page === undefined && params.limit === undefined)) {
      return this.prisma.interaction.findMany({
        where,
        orderBy: { performedAt: "desc" },
      });
    }

    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.interaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { performedAt: "desc" },
      }),
      this.prisma.interaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.interaction.delete({ where: { id } });
  }
}
