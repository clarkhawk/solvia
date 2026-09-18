import type { AIProviderType } from "@prisma/client";
import { AnthropicProvider } from "./providers/anthropic.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { GrokProvider } from "./providers/grok.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import type { AIProvider } from "./types";

export class AIProviderFactory {
  static create(type: AIProviderType, apiKey: string): AIProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(apiKey);
      case "gemini":
        return new GeminiProvider(apiKey);
      case "anthropic":
        return new AnthropicProvider(apiKey);
      case "grok":
        return new GrokProvider(apiKey);
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unknown AI provider: ${_exhaustive}`);
      }
    }
  }
}
