import { Customer, Contact, Interaction, Order } from "@prisma/client";

export interface UpsertCustomerDTO {
  name: string;
  email: string;
  phone: string;
  document: string;
}

export interface CreateCustomerDTO {
  name: string;
  email: string;
  phone: string;
  document: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  score?: number;
}

export interface CustomerWith360 extends Customer {
  contacts: Contact[];
  interactions: Interaction[];
  orders: Order[];
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

export interface ICustomerRepository {
  upsertCustomer(data: UpsertCustomerDTO): Promise<Customer>;
  create(data: CreateCustomerDTO): Promise<Customer>;
  findById(id: string): Promise<CustomerWith360 | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<Customer> | Customer[]>;
  update(id: string, data: UpdateCustomerDTO): Promise<Customer>;
  delete(id: string): Promise<void>;
}
