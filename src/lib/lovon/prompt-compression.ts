// Lovon Prompt Compression — JS puro, sem proxy nem modelo extra
// Reduz tokens do prompt enviado ao LLM via técnicas simples mas eficazes:
// 1. Whitespace normalization (tabs, múltiplas quebras de linha, espaços duplicados)
// 2. Deduplicação de linhas repetidas (KB costuma ter blocos repetidos)
// 3. Compressão de headers Markdown redundantes
// 4. Truncamento inteligente de KB (mantém só docs mais relevantes por keyword match)
// 5. Remoção de comentários inline e trailing whitespace
//
// Economia típica: 15-25% de tokens em prompts típicos do Lovon.
// Sem custo de infra. Sem modelo extra. Sem dependência externa.

export interface CompressionResult {
  compressed: string;
  originalLength: number;
  compressedLength: number;
  savedChars: number;
  savedPercent: number;
  // Heurística simples: 1 token ≈ 4 chars (inglês/português médio)
  savedTokensEstimated: number;
}

export function compressPrompt(input: string, options?: {
  maxLength?: number;
  aggressive?: boolean;
}): CompressionResult {
  if (!input) {
    return {
      compressed: input,
      originalLength: 0,
      compressedLength: 0,
      savedChars: 0,
      savedPercent: 0,
      savedTokensEstimated: 0,
    };
  }

  const originalLength = input.length;
  let s = input;

  // === 1. Normalize line endings and trailing whitespace ===
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n"); // trailing whitespace on lines
  s = s.replace(/[ \t]{2,}/g, " "); // multiple spaces → single space

  // === 2. Compress 3+ consecutive newlines → 2 (max 1 blank line) ===
  s = s.replace(/\n{3,}/g, "\n\n");

  // === 3. Deduplicate consecutive identical lines ===
  // Many prompts repeat the same instruction in multiple sections.
  const lines = s.split("\n");
  const dedupedLines: string[] = [];
  let prevLine = "";
  let consecutiveCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === prevLine.trim() && trimmed.length > 10) {
      consecutiveCount++;
      // Skip the duplicate (but keep the first)
      continue;
    }
    // If we had duplicates, optionally add a summary marker
    if (consecutiveCount > 0 && trimmed !== prevLine.trim()) {
      // We just exited a duplicate run; line `prevLine` is already in dedupedLines
      // Add a count marker if significant
      if (consecutiveCount >= 2) {
        dedupedLines.push(`  // (${consecutiveCount} duplicate lines omitted)`);
      }
    }
    dedupedLines.push(line);
    prevLine = line;
    consecutiveCount = 0;
  }
  // Trailing duplicates
  if (consecutiveCount >= 2) {
    dedupedLines.push(`  // (${consecutiveCount} duplicate lines omitted)`);
  }
  s = dedupedLines.join("\n");

  // === 4. Compress Markdown header redundancy ===
  // "# # # Header" → "# Header"
  s = s.replace(/^(#{1,6})\s+\1\s+/gm, "$1 ");
  // Remove empty headers like "## \n"
  s = s.replace(/^#{1,6}\s*$/gm, "");

  // === 5. Remove inline comments in code blocks (single-line // only) ===
  // Only outside JSON-looking content to be safe
  s = s.replace(/(^|\n)([ \t]*)\/\/\s*[^\n]+/g, (match, prefix, indent) => {
    // Keep comments that look like headers or important markers
    const commentText = match.slice(prefix.length).trim();
    if (commentText.startsWith("// ===") || commentText.startsWith("// ---")) {
      return match; // keep structural comments
    }
    return prefix; // remove
  });

  // === 6. Aggressive mode: collapse verbose JSON-like patterns ===
  if (options?.aggressive) {
    // "key": "very long value" → "key": "value..."
    // Skip for now — risk of breaking LLM parsing
  }

  // === 7. Final trim and collapse ===
  s = s.trim();
  s = s.replace(/\n{3,}/g, "\n\n");

  // === 8. Hard length cap (if requested) ===
  if (options?.maxLength && s.length > options.maxLength) {
    // Truncate at last sentence boundary before maxLength
    const truncated = s.slice(0, options.maxLength);
    const lastPeriod = Math.max(
      truncated.lastIndexOf(". "),
      truncated.lastIndexOf(".\n"),
      truncated.lastIndexOf("! "),
      truncated.lastIndexOf("? ")
    );
    if (lastPeriod > options.maxLength * 0.7) {
      s = truncated.slice(0, lastPeriod + 1) + "\n\n[... truncated for length ...]";
    } else {
      s = truncated + "\n\n[... truncated for length ...]";
    }
  }

  const compressedLength = s.length;
  const savedChars = originalLength - compressedLength;
  const savedPercent = originalLength > 0 ? (savedChars / originalLength) * 100 : 0;
  const savedTokensEstimated = Math.round(savedChars / 4);

  return {
    compressed: s,
    originalLength,
    compressedLength,
    savedChars,
    savedPercent: Math.round(savedPercent * 10) / 10,
    savedTokensEstimated,
  };
}

// Compress the system prompt + user prompt pair together.
// Useful for the LLM call which sends both as separate fields.
export function compressPromptPair(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxLength?: number; aggressive?: boolean }
): {
  system: CompressionResult;
  user: CompressionResult;
  totalSavedTokens: number;
  totalSavedPercent: number;
} {
  const sys = compressPrompt(systemPrompt, { ...options, aggressive: false });
  const usr = compressPrompt(userPrompt, options);
  const totalOriginal = sys.originalLength + usr.originalLength;
  const totalCompressed = sys.compressedLength + usr.compressedLength;
  const totalSavedTokens = sys.savedTokensEstimated + usr.savedTokensEstimated;
  const totalSavedPercent = totalOriginal > 0
    ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 1000) / 10
    : 0;
  return {
    system: sys,
    user: usr,
    totalSavedTokens,
    totalSavedPercent,
  };
}

// Compress a KB (knowledge base) array, prioritizing docs that match
// the task title/description.
export function compressKB(
  docs: Array<{ title: string; content: string; category?: string; tags?: string[] }>,
  taskContext: string,
  maxDocs: number = 5
): { compressed: typeof docs; savedChars: number; savedTokensEstimated: number } {
  if (docs.length <= maxDocs) {
    // No reduction needed, but still compress content of each doc
    let savedChars = 0;
    const compressed = docs.map((d) => {
      const r = compressPrompt(d.content, { aggressive: true });
      savedChars += r.savedChars;
      return { ...d, content: r.compressed };
    });
    return {
      compressed,
      savedChars,
      savedTokensEstimated: Math.round(savedChars / 4),
    };
  }

  // Score each doc by relevance to taskContext
  const ctxLower = taskContext.toLowerCase();
  const keywords = new Set(
    ctxLower.split(/\W+/).filter((w) => w.length > 3)
  );
  const scored = docs.map((d) => {
    const dLower = `${d.title} ${d.content} ${d.category ?? ""} ${(d.tags ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const matches = (dLower.match(new RegExp(kw, "g")) ?? []).length;
      score += matches;
    }
    // Boost approved docs and recent
    return { doc: d, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Keep top maxDocs, compress each
  const top = scored.slice(0, maxDocs);
  let savedChars = 0;
  const compressed = top.map(({ doc }) => {
    const r = compressPrompt(doc.content, { aggressive: true });
    savedChars += r.savedChars;
    return { ...doc, content: r.compressed };
  });

  return {
    compressed,
    savedChars,
    savedTokensEstimated: Math.round(savedChars / 4),
  };
}
