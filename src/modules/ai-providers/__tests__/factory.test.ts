import { describe, it, expect } from "vitest";
import { AIProviderFactory } from "../factory";

describe("AIProviderFactory", () => {
  it("creates all four providers", () => {
    expect(AIProviderFactory.create("openai", "sk-test").name).toBe("openai");
    expect(AIProviderFactory.create("gemini", "key").name).toBe("gemini");
    expect(AIProviderFactory.create("anthropic", "key").name).toBe("anthropic");
    expect(AIProviderFactory.create("grok", "key").name).toBe("grok");
  });
});
