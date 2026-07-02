import { NextRequest, NextResponse } from "next/server";

// POST /api/lovon/debug-llm
// Diagnóstico completo: tenta o provider configurado via env vars OU client config
// Retorna: { envVarsConfigured, clientIntegrations, attempts: [...] }
//
// Use isso pra entender EXATAMENTE qual provider tá respondendo 403 e por quê.

interface AttemptResult {
  source: string;
  baseUrl?: string;
  model?: string;
  apiKeyPresent: boolean;
  ok: boolean;
  status?: number;
  errorBody?: string;
  responseTimeMs?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const modelOverride = body?.model as string | undefined;
  const attempts: AttemptResult[] = [];

  // 1) Server-side env vars
  const envBase = process.env.LOVON_LLM_BASE_URL;
  const envKey = process.env.LOVON_LLM_API_KEY;
  const envModel = modelOverride ?? process.env.LOVON_LLM_MODEL ?? "gpt-4o-mini";

  if (envBase && envKey) {
    attempts.push(await tryProvider(`env-var: ${envBase}`, envBase, envKey, envModel));
  } else {
    attempts.push({
      source: "env-var",
      apiKeyPresent: false,
      ok: false,
      errorBody: "LOVON_LLM_BASE_URL ou LOVON_LLM_API_KEY não configurados no Render env",
    });
  }

  return NextResponse.json({
    envVarsConfigured: !!(envBase && envKey),
    attempts,
    hint:
      attempts.every((a) => !a.ok)
        ? "Se todos retornam 401: API key inválida. Se 403: key válida mas provider bloqueia o request (modelo não disponível, sem créditos, ou restrição geográfica). Se 404: modelo não existe nesse provider."
        : "Algum provider respondeu OK. Use o `source` dele como `LOVON_LLM_BASE_URL` no Render env.",
  });
}

async function tryProvider(
  source: string,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<AttemptResult> {
  const start = Date.now();
  try {
    const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (baseUrl.includes("openrouter")) {
      headers["HTTP-Referer"] = process.env.LOVON_APP_URL ?? "https://lovon-teams-v1.onrender.com";
      headers["X-Title"] = "Lovon Teams";
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Você é um assistente útil." },
          { role: "user", content: "Responda apenas: OK" },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    const responseTimeMs = Date.now() - start;
    const responseText = await res.text().catch(() => "");
    let errorBody: string | undefined;
    try {
      const json = JSON.parse(responseText);
      errorBody = json?.error?.message ?? json?.message ?? responseText.slice(0, 300);
    } catch {
      errorBody = responseText.slice(0, 300);
    }
    return {
      source,
      baseUrl,
      model,
      apiKeyPresent: !!apiKey,
      ok: res.ok,
      status: res.status,
      errorBody,
      responseTimeMs,
    };
  } catch (err) {
    return {
      source,
      baseUrl,
      model,
      apiKeyPresent: !!apiKey,
      ok: false,
      errorBody: err instanceof Error ? err.message : "fetch failed",
      responseTimeMs: Date.now() - start,
    };
  }
}

export async function GET() {
  return NextResponse.json({
    description: "POST /api/lovon/debug-llm with optional { model: 'string' } to diagnose LLM providers",
    envVarsConfigured: !!(process.env.LOVON_LLM_BASE_URL && process.env.LOVON_LLM_API_KEY),
    envModel: process.env.LOVON_LLM_MODEL ?? null,
  });
}