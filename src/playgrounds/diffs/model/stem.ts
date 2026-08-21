import porter2 from 'wink-porter2-stemmer';

const stemCache = new Map<string, string>();

export function stem(word: string): string {
  const lower = word.toLowerCase();
  const cached = stemCache.get(lower);
  if (cached !== undefined) {
    return cached;
  }
  const result = porter2(lower);
  stemCache.set(lower, result);
  return result;
}

export function clearStemCache(): void {
  stemCache.clear();
}
