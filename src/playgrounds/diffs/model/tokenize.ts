export interface Token {
  word: string;
  index: number;
}

export function tokenize(text: string): Token[] {
  if (!text) return [];

  const rawTokens = text.split(/\s+/i);
  const tokens: Token[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i];
    const cleaned = raw
      .replace(/['’]\w*$/i, '')
      .replace(/[^\w\-_]+/g, '')
      .trim();

    if (cleaned.length > 0 && /\w/.test(cleaned)) {
      tokens.push({
        word: cleaned,
        index: i,
      });
    }
  }

  return tokens;
}
