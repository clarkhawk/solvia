import OpenAI from "openai";
import type { AIProviderType } from "@prisma/client";
import { buildPrompt } from "../prompt";
import type { AIProvider, GenerateMessageParams, GeneratedMessage } from "../types";

export class OpenAIProvider implements AIProvider {
  readonly name: AIProviderType = "openai";
  constructor(private readonly apiKey: string) {}

  async generateMessage(params: GenerateMessageParams): Promise<GeneratedMessage> {
    const client = new OpenAI({ apiKey: this.apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
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
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
