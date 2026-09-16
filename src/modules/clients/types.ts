export interface ClientIdentity {
  name: string;
  companyName?: string;
  siret?: string;
}

export interface ClientContact {
  email?: string;
  phone?: string;
  address?: string;
}

export interface ClientDTO {
  id: string;
  organizationId: string;
  externalCode: string | null;
  identity: ClientIdentity;
  contact: ClientContact;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientInput {
  externalCode?: string;
  identity: ClientIdentity;
  contact: ClientContact;
}

export interface UpdateClientInput {
  externalCode?: string | null;
  identity?: ClientIdentity;
  contact?: ClientContact;
}
