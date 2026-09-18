import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";
import { hashEmail } from "@/shared/crypto/encryption";
import { clientRepository } from "./repository";
import type { ClientDTO, CreateClientInput, UpdateClientInput } from "./types";

export class ClientService {
  async getById(organizationId: string, id: string): Promise<ClientDTO> {
    const client = await clientRepository.findById(organizationId, id);
    if (!client) {
      throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");
    }
    return client;
  }

  async list(organizationId: string, page: number, limit: number) {
    return clientRepository.list(organizationId, page, limit);
  }

  async create(organizationId: string, userId: string, input: CreateClientInput): Promise<ClientDTO> {
    await this.ensureNoDuplicate(organizationId, input.externalCode, input.contact.email);

    const client = await clientRepository.create(organizationId, input);

    await logAuditEvent({
      organizationId,
      userId,
      action: "client_create",
      entityType: "Client",
      entityId: client.id,
    });

    return client;
  }

  async update(organizationId: string, userId: string, id: string, input: UpdateClientInput): Promise<ClientDTO> {
    const existing = await this.getById(organizationId, id);

    if (input.externalCode && input.externalCode !== existing.externalCode) {
      const dup = await clientRepository.findByExternalCode(organizationId, input.externalCode);
      if (dup && dup.id !== id) {
        throw new AppError("Client with this external code already exists", 409, "DUPLICATE_CLIENT");
      }
    }

    if (input.contact?.email) {
      const emailHash = hashEmail(input.contact.email);
      const dup = await clientRepository.findByEmailHash(organizationId, emailHash);
      if (dup && dup.id !== id) {
        throw new AppError("Client with this email already exists", 409, "DUPLICATE_CLIENT");
      }
    }

    const client = await clientRepository.update(organizationId, id, input);

    await logAuditEvent({
      organizationId,
      userId,
      action: "client_update",
      entityType: "Client",
      entityId: client.id,
    });

    return client;
  }

  async delete(organizationId: string, userId: string, id: string): Promise<void> {
    await this.getById(organizationId, id);
    await clientRepository.delete(organizationId, id);

    await logAuditEvent({
      organizationId,
      userId,
      action: "client_update",
      entityType: "Client",
      entityId: id,
      metadata: { deleted: true },
    });
  }

  async findOrCreateByImport(
    organizationId: string,
    input: CreateClientInput,
  ): Promise<{ client: ClientDTO; created: boolean }> {
    if (input.externalCode) {
      const existing = await clientRepository.findByExternalCode(organizationId, input.externalCode);
      if (existing) {
        return { client: existing, created: false };
      }
    }

    if (input.contact.email) {
      const existing = await clientRepository.findByEmailHash(organizationId, hashEmail(input.contact.email));
      if (existing) {
        return { client: existing, created: false };
      }
    }

    const client = await clientRepository.create(organizationId, input);
    return { client, created: true };
  }

  private async ensureNoDuplicate(organizationId: string, externalCode?: string, email?: string): Promise<void> {
    if (externalCode) {
      const existing = await clientRepository.findByExternalCode(organizationId, externalCode);
      if (existing) {
        throw new AppError("Client with this external code already exists", 409, "DUPLICATE_CLIENT");
      }
    }
    if (email) {
      const existing = await clientRepository.findByEmailHash(organizationId, hashEmail(email));
      if (existing) {
        throw new AppError("Client with this email already exists", 409, "DUPLICATE_CLIENT");
      }
    }
  }
}

export const clientService = new ClientService();
