import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientService } from "../service";
import { clientRepository } from "../repository";

vi.mock("../repository", () => ({
  clientRepository: {
    findById: vi.fn(),
    findByExternalCode: vi.fn(),
    findByEmailHash: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/audit/audit-log", () => ({
  logAuditEvent: vi.fn(),
}));

describe("ClientService", () => {
  const service = new ClientService();
  const orgId = "org-1";
  const userId = "user-1";

  const mockClient = {
    id: "client-1",
    organizationId: orgId,
    externalCode: "EXT001",
    identity: { name: "Acme Corp" },
    contact: { email: "test@acme.com" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns client by id", async () => {
    vi.mocked(clientRepository.findById).mockResolvedValue(mockClient);
    const result = await service.getById(orgId, "client-1");
    expect(result.id).toBe("client-1");
  });

  it("throws when client not found", async () => {
    vi.mocked(clientRepository.findById).mockResolvedValue(null);
    await expect(service.getById(orgId, "missing")).rejects.toThrow("Client not found");
  });

  it("creates client when no duplicate", async () => {
    vi.mocked(clientRepository.findByExternalCode).mockResolvedValue(null);
    vi.mocked(clientRepository.findByEmailHash).mockResolvedValue(null);
    vi.mocked(clientRepository.create).mockResolvedValue(mockClient);

    const result = await service.create(orgId, userId, {
      externalCode: "EXT001",
      identity: { name: "Acme Corp" },
      contact: { email: "test@acme.com" },
    });

    expect(result.id).toBe("client-1");
    expect(clientRepository.create).toHaveBeenCalled();
  });
});
