import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProviderType } from "@prisma/client";
import { buildPrompt } from "../prompt";
import type { AIProvider, GenerateMessageParams, GeneratedMessage } from "../types";

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderType = "gemini";
  constructor(private readonly apiKey: string) {}

  async generateMessage(params: GenerateMessageParams): Promise<GeneratedMessage> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(params));
    return {
      content: result.response.text(),
      provider: this.name,
    };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      await model.generateContent("ping");
      return true;
    } catch {
      return false;
    }
  }
}
