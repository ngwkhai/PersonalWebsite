import { embed, cosineSimilarity } from 'ai';
import { openai } from './models';
import { tokenize } from './tokenize';
import index from './knowledge.json';
import type { Chunk, KnowledgeIndex, Retrieved } from './types';

const knowledge = index as unknown as KnowledgeIndex;

const BM25_K1 = 1.5;
const BM25_B = 0.75;
/** Reciprocal-rank-fusion damping. 60 is the value from the original paper. */
const RRF_K = 60;

function bm25(query: string, candidates: readonly Chunk[]): Retrieved[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const total = knowledge.chunks.length;

  return candidates
    .map((chunk) => {
      let score = 0;
      for (const term of new Set(terms)) {
        const df = knowledge.df[term];
        if (!df) continue;

        let frequency = 0;
        for (const token of chunk.tokens) if (token === term) frequency++;
        if (frequency === 0) continue;

        const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
        const norm =
          frequency + BM25_K1 * (1 - BM25_B + (BM25_B * chunk.tokens.length) / knowledge.avgLength);
        score += idf * ((frequency * (BM25_K1 + 1)) / norm);
      }
      return { chunk, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
}

async function vector(query: string, candidates: readonly Chunk[]): Promise<Retrieved[]> {
  if (!knowledge.model) return [];
  const embeddable = candidates.filter((chunk) => chunk.embedding);
  if (embeddable.length === 0) return [];

  const { embedding } = await embed({
    model: openai.textEmbeddingModel(knowledge.model),
    value: query,
  });

  return embeddable
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(embedding, chunk.embedding as number[]),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Hybrid retrieval: BM25 and embeddings fused with reciprocal rank fusion.
 *
 * Both halves earn their place. Embeddings answer paraphrases ("how do you
 * deal with skewed classes" → the ADASYN section). BM25 answers the exact
 * tokens a technical reader actually types — "ChrF++", "λ_noobj", "ADASYN" —
 * which embeddings blur into their neighbourhood. RRF combines them on rank
 * rather than score, so the two incomparable scales never need calibrating.
 *
 * Falls back to BM25 alone when the index was built without an API key.
 */
export async function retrieve(
  query: string,
  { locale, limit = 6 }: { locale: 'en' | 'vi'; limit?: number },
): Promise<Retrieved[]> {
  const candidates = knowledge.chunks.filter((chunk) => chunk.locale === locale);

  const [lexical, semantic] = await Promise.all([
    Promise.resolve(bm25(query, candidates)),
    vector(query, candidates).catch(() => [] as Retrieved[]),
  ]);

  const fused = new Map<string, { chunk: Chunk; score: number }>();
  for (const ranking of [lexical, semantic]) {
    ranking.slice(0, 20).forEach((hit, rank) => {
      const existing = fused.get(hit.chunk.id);
      const contribution = 1 / (RRF_K + rank + 1);
      if (existing) existing.score += contribution;
      else fused.set(hit.chunk.id, { chunk: hit.chunk, score: contribution });
    });
  }

  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

export const knowledgeMeta = {
  chunks: knowledge.chunks.length,
  builtAt: knowledge.builtAt,
  embeddings: knowledge.model,
};
