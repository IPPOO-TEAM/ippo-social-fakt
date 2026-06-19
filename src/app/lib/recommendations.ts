// Simple "related items" picker — no ML, no server call. Works on a list
// already in memory (e.g. from useLiveContent). Ranks by shared category,
// shared rubric, and recency, then returns the top N excluding `currentId`.

interface RecBase {
  id: string | number;
  category?: string;
  rubric?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
}

export function pickRelated<T extends RecBase>(
  pool: T[],
  current: T | null | undefined,
  limit = 4,
): T[] {
  if (!current) return pool.slice(0, limit);
  const curTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()));
  const now = Date.now();
  const scored = pool
    .filter((x) => String(x.id) !== String(current.id))
    .map((x) => {
      let score = 0;
      if (x.category && current.category && x.category === current.category) score += 3;
      if (x.rubric && current.rubric && x.rubric === current.rubric) score += 2;
      if (x.tags) {
        for (const t of x.tags) if (curTags.has(t.toLowerCase())) score += 1;
      }
      const ts = Date.parse(x.publishedAt ?? x.updatedAt ?? '') || 0;
      const ageDays = ts ? Math.max(0, (now - ts) / 86400000) : 365;
      // Mild recency boost: -1 per ~30 days old, floor at -3.
      score += Math.max(-3, -ageDays / 30);
      return { x, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.x);
}
