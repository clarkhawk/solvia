import type { RelanceChannel, RelanceLevel, RelanceResult } from "@prisma/client";

export interface RelanceDTO {
  id: string;
  organizationId: string;
  invoiceId: string;
  createdById: string;
  channel: RelanceChannel;
  level: RelanceLevel;
  result: RelanceResult;
  messageDraft: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRelanceInput {
  invoiceId: string;
  channel: RelanceChannel;
  level: RelanceLevel;
  result?: RelanceResult;
}

export interface UpdateRelanceInput {
  channel?: RelanceChannel;
  level?: RelanceLevel;
  result?: RelanceResult;
  messageDraft?: string;
  sentAt?: Date | null;
}
