import { Contact, ContactType } from "@prisma/client";

export interface CreateContactDTO {
  customerId: string;
  type: ContactType;
  value: string;
  label?: string;
  isPrimary?: boolean;
}

export interface UpdateContactDTO {
  type?: ContactType;
  value?: string;
  label?: string;
  isPrimary?: boolean;
}

export interface IContactRepository {
  create(data: CreateContactDTO): Promise<Contact>;
  findById(id: string): Promise<Contact | null>;
  findByCustomerId(customerId: string): Promise<Contact[]>;
  update(id: string, data: UpdateContactDTO): Promise<Contact>;
  delete(id: string): Promise<void>;
}
