import { NextRequest, NextResponse } from "next/server";

// POST /api/lovon/test-provider
// Tests an AI provider by making a real HTTP call with the user's API key.
// Body: { baseUrl, apiKey, model?, provider?, real?: boolean }
//   real=true: uses a full system+user prompt (mimics production call) — slower but catches more issues
//   real=false (default): uses a tiny "ping" — fast, only catches auth/key issues
// Returns: { ok, message, latencyMs?, sampleResponse?, provider, model }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.baseUrl !== "string" || typeof body.apiKey !== "string") {
    return NextResponse.json(
      { ok: false, message: "Body inválido. Esperado: { baseUrl, apiKey, model?, provider?, real? }" },
      { status: 400 }
    );
  }

  const baseUrl = body.baseUrl.replace(/\/+$/, "");
  const apiKey = body.apiKey.trim();
  const model = (body.model ?? "gpt-4o-mini").trim();
  const provider = body.provider ?? "unknown";
  const useRealPrompt = body.real === true;

  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "API key vazia." }, { status: 400 });
  }

  const start = Date.now();
  try {
    const url = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (baseUrl.includes("openrouter")) {
      headers["HTTP-Referer"] = process.env.LOVON_APP_URL ?? "https://lovon-teams-v1.onrender.com";
      headers["X-Title"] = "Lovon Teams";
    }
    // Real prompt mimics a CEO mission call (system + user, longer, more tokens)
    const messages = useRealPrompt
      ? [
          { role: "system", content: "Você é um assistente útil. Responda de forma concisa em português brasileiro." },
          { role: "user", content: "Liste 3 departamentos de uma empresa de tecnologia em uma linha, separados por vírgula." },
        ]
      : [{ role: "user", content: "ping" }];

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: useRealPrompt ? 200 : 5,
        temperature: 0.4,
      }),
    });

    const latencyMs = Date.now() - start;

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const sample = data?.choices?.[0]?.message?.content?.toString().slice(0, 120) ?? "";
      return NextResponse.json({
        ok: true,
        message: useRealPrompt
          ? `✓ Prompt real OK · ${latencyMs}ms · ${sample.length} chars de resposta`
          : `Conexão OK · ${latencyMs}ms · provider respondeu`,
        latencyMs,
        sampleResponse: sample,
        provider,
        model,
      });
    }

    // Map status codes to human messages
    const errText = await res.text().catch(() => "");
    let message: string;
    let ok = false;
    if (res.status === 401) message = "API key inválida ou expirada (401).";
    else if (res.status === 403) message = "API key sem permissão para este modelo (403).";
    else if (res.status === 404) message = `Modelo "${model}" não encontrado (404). Troque o modelo no dropdown.`;
    else if (res.status === 429) {
      // 429 = key IS valid, just rate-limited. Mark as ok=true with warning so user proceeds.
      ok = true;
      message = `✓ Key válida · rate limit atingido (429). Aguarde ~1min antes de testar de novo.`;
    }
    else if (res.status >= 500) message = `Provider fora do ar (${res.status}). Tente outro provider.`;
    else message = `Erro ${res.status}: ${errText.slice(0, 200)}`;

    return NextResponse.json({ ok, message, latencyMs, provider, model }, { status: 200 });
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({
      ok: false,
      message: `Falha de conexão: ${errMsg}. Verifique a baseUrl.`,
      latencyMs,
      provider,
      model,
    });
  }
}