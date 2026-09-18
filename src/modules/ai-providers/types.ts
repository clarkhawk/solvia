import type { AIProviderType, RelanceChannel, RelanceLevel } from "@prisma/client";

export interface GenerateMessageParams {
  channel: RelanceChannel;
  level: RelanceLevel;
  invoice: {
    reference: string;
    amount: number;
    dueAt: Date;
    daysOverdue: number;
  };
  client: {
    displayName: string;
  };
  tone?: string;
}

export interface GeneratedMessage {
  content: string;
  provider: AIProviderType;
}

export interface AIProvider {
  readonly name: AIProviderType;
  generateMessage(params: GenerateMessageParams): Promise<GeneratedMessage>;
  validateApiKey(apiKey: string): Promise<boolean>;
}

export interface AIProviderConfigDTO {
  id: string;
  organizationId: string;
  provider: AIProviderType;
  hasApiKey: boolean;
}
