import OpenAI from "openai";
import type { AIProviderType } from "@prisma/client";
import { buildPrompt } from "../prompt";
import type { AIProvider, GenerateMessageParams, GeneratedMessage } from "../types";

export class GrokProvider implements AIProvider {
  readonly name: AIProviderType = "grok";
  constructor(private readonly apiKey: string) {}

  async generateMessage(params: GenerateMessageParams): Promise<GeneratedMessage> {
    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://api.x.ai/v1",
    });
    const response = await client.chat.completions.create({
      // Grok 4.3 is a current, stable xAI model suited to short
      // transactional messages while keeping generation costs controlled.
      model: "grok-4.3",
      messages: [{ role: "user", content: buildPrompt(params) }],
      max_tokens: 500,
    });
    return {
      content: response.choices[0]?.message?.content ?? "",
      provider: this.name,
    };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
