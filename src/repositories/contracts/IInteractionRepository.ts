import { Interaction, InteractionType, Prisma } from "@prisma/client";

export interface CreateInteractionDTO {
  customerId: string;
  type: InteractionType;
  subject: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface IInteractionRepository {
  create(data: CreateInteractionDTO): Promise<Interaction>;
  findById(id: string): Promise<Interaction | null>;
  findByCustomerId(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResult<Interaction> | Interaction[]>;
  delete(id: string): Promise<void>;
}
