"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIProviderSettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v1/ai/config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.provider) {
          setProvider(d.provider);
          setConfigured(d.hasApiKey);
        }
      })
      .catch(console.error);
  }, []);

  async function handleSave() {
    await fetch("/api/v1/ai/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    setSaved(true);
    setConfigured(true);
    setApiKey("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuration IA (BYOK)</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fournisseur LLM</CardTitle>
          <CardDescription>
            Clé API chiffrée au niveau organisation. {configured && "✓ Configuré"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <select
            className="w-full rounded border px-3 py-2"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="grok">Grok (xAI)</option>
          </select>
          <input
            type="password"
            placeholder="Clé API (jamais stockée en clair)"
            className="w-full rounded border px-3 py-2"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={handleSave} disabled={!apiKey}>
            {saved ? "Enregistré ✓" : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
