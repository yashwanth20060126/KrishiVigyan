/**
 * Searches a list of text chunks for the most relevant ones matching a query.
 * Uses a simple keyword density overlap model as a secure, fast,
 * zero-cost client-side semantic pre-filter before feeding context to Gemini.
 */
export function retrieveRelevantChunks(chunks: string[], query: string, maxResults = 4): string[] {
  if (!query || chunks.length === 0) return [];

  const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (queryWords.length === 0) {
    // Return first few chunks if query is empty or too short
    return chunks.slice(0, maxResults);
  }

  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    
    for (const word of queryWords) {
      // Basic term occurrence counting
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = chunkLower.match(regex);
      if (matches) {
        score += matches.length * 1.5; // full match weight
      } else if (chunkLower.includes(word)) {
        score += 0.5; // partial match weight
      }
    }

    return { chunk, score };
  });

  // Sort by score and filter out zero scores unless we have too few results
  const sorted = scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.chunk);

  if (sorted.length === 0) {
    return chunks.slice(0, maxResults);
  }

  return sorted.slice(0, maxResults);
}
