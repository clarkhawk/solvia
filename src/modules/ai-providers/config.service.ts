import type { AIProviderType } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { encryptPii, decryptPii } from "@/shared/crypto/encryption";
import { logAuditEvent } from "@/shared/audit/audit-log";
import { AppError } from "@/shared/errors/app-error";
import { AIProviderFactory } from "./factory";
import type { AIProviderConfigDTO, GenerateMessageParams, GeneratedMessage } from "./types";

export class AIProviderConfigService {
  async getConfig(organizationId: string): Promise<AIProviderConfigDTO | null> {
    const config = await prisma.aIProviderConfig.findUnique({ where: { organizationId } });
    if (!config) return null;
    return {
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      hasApiKey: true,
    };
  }

  async upsertConfig(
    organizationId: string,
    userId: string,
    provider: AIProviderType,
    apiKey: string,
  ): Promise<AIProviderConfigDTO> {
    const aiProvider = AIProviderFactory.create(provider, apiKey);
    const valid = await aiProvider.validateApiKey(apiKey);
    if (!valid) {
      throw new AppError("Invalid API key for the selected provider", 400, "INVALID_API_KEY");
    }

    const config = await prisma.aIProviderConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        provider,
        apiKeyEncrypted: encryptPii(apiKey),
      },
      update: {
        provider,
        apiKeyEncrypted: encryptPii(apiKey),
      },
    });

    await logAuditEvent({
      organizationId,
      userId,
      action: "ai_config_update",
      entityType: "AIProviderConfig",
      entityId: config.id,
    });

    return {
      id: config.id,
      organizationId: config.organizationId,
      provider: config.provider,
      hasApiKey: true,
    };
  }

  async generateMessage(organizationId: string, params: GenerateMessageParams): Promise<GeneratedMessage> {
    const config = await prisma.aIProviderConfig.findUnique({ where: { organizationId } });
    if (!config) {
      throw new AppError("AI provider not configured", 400, "AI_NOT_CONFIGURED");
    }

    const apiKey = decryptPii(config.apiKeyEncrypted);
    const provider = AIProviderFactory.create(config.provider, apiKey);
    return provider.generateMessage(params);
  }
}

export const aiProviderConfigService = new AIProviderConfigService();
