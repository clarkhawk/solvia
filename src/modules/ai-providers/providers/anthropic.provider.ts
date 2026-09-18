import Anthropic from "@anthropic-ai/sdk";
import type { AIProviderType } from "@prisma/client";
import { buildPrompt } from "../prompt";
import type { AIProvider, GenerateMessageParams, GeneratedMessage } from "../types";

export class AnthropicProvider implements AIProvider {
  readonly name: AIProviderType = "anthropic";
  constructor(private readonly apiKey: string) {}

  async generateMessage(params: GenerateMessageParams): Promise<GeneratedMessage> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: buildPrompt(params) }],
    });
    const content = response.content[0];
    return {
      content: content.type === "text" ? content.text : "",
      provider: this.name,
    };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
