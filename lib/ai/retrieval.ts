import { embedMany, cosineSimilarity } from 'ai';
import { openai } from './models';
import { tokenize } from './tokenize';
import index from './knowledge.json';
import type { Chunk, KnowledgeIndex, Retrieved } from './types';

const knowledge = index as unknown as KnowledgeIndex;

const BM25_K1 = 1.5;
const BM25_B = 0.75;
/** Reciprocal-rank-fusion damping. 60 is the value from the original paper. */
const RRF_K = 60;

/**
 * Minimum cosine similarity for a vector hit to count.
 *
 * This exists because embeddings always return something: without a floor,
 * "what is the best recipe for sourdough bread" retrieves the six nearest case
 * study passages and hands the agent irrelevant evidence to reason over, which
 * is exactly how a grounded agent starts confabulating. BM25 has no such
 * problem — an unmatched term simply scores zero.
 *
 * Measured against this corpus with text-embedding-3-small:
 *
 *   off-topic and nonsense queries  top similarity 0.149 - 0.151
 *   on-topic queries                top similarity 0.233 - 0.430
 *
 * 0.20 sits in that gap. Re-measure if the embedding model changes; the
 * absolute scale is model-specific and this number does not transfer.
 *
 * A pasted document needs its own floor, and a higher one. A long text has far
 * more surface to match on, so everything scores higher and 0.20 stops
 * separating anything — at that floor a pastry-chef posting still retrieved
 * five machine-learning passages. Measured on this corpus, top similarity per
 * document:
 *
 *   off-topic postings   pastry chef 0.245, ICU nurse 0.231
 *   on-topic postings    data analyst 0.347, ML platform 0.493
 *
 * 0.28 sits in that gap.
 */
const MIN_SIMILARITY: Record<RetrievalMode, number> = { query: 0.2, document: 0.28 };

/**
 * What a query is: a question someone typed, or a document someone pasted.
 * The two need different floors on both halves, and the difference is not
 * something to infer from length — a caller always knows which it has.
 */
export type RetrievalMode = 'query' | 'document';

/**
 * Minimum share of a query's content terms that must appear anywhere in the
 * corpus for the lexical half to return anything.
 *
 * Stopword removal alone is not enough: "what is the best recipe for sourdough
 * bread" still matches on "best", and one accidental match against a technical
 * corpus is not evidence of anything. Requiring coverage asks a different and
 * better question — is this query even about the material?
 *
 *   off-topic   1 of 4 content terms known  (0.25)
 *   on-topic    2 of 2, 1 of 1              (1.00)
 *
 * A pasted job description needs a lower floor than a typed question. A real
 * posting dilutes its technical terms with company boilerplate — "equal
 * opportunity employer", "competitive salary", "fast-growing" — so the ratio
 * falls without the posting becoming any less about the material. At 0.4 the
 * lexical half switched itself off depending on how much PR prose a recruiter
 * had written, which is not a signal about anything. Measured on this corpus:
 *
 *   off-topic postings   pastry chef 0.167, ICU nurse 0.200, paralegal 0.214
 *   on-topic postings    data analyst 0.301, fintech ML 0.400, terse ML 0.769
 *
 * 0.25 sits in that gap. Re-measure when the corpus grows; both numbers move
 * with the size of the df map.
 */
const MIN_COVERAGE: Record<RetrievalMode, number> = { query: 0.4, document: 0.25 };

/**
 * How deep into any one ranking the round-robin reaches before moving on.
 * Small on purpose: the point is that every query is represented at all.
 */
const PER_QUERY = 3;

export interface RetrieveOptions {
  locale: 'en' | 'vi';
  limit?: number;
  /** Defaults to 'query', which is the stricter of the two. */
  mode?: RetrievalMode;
}

function coverageOf(query: string, mode: RetrievalMode) {
  const terms = [...new Set(tokenize(query))];
  const known = terms.filter((term) => knowledge.df[term]);
  const floor = MIN_COVERAGE[mode];
  const coverage = terms.length === 0 ? 0 : known.length / terms.length;
  return { terms, known, floor, coverage, passes: terms.length > 0 && coverage >= floor };
}

/**
 * The coverage guard, exposed for tests. Asserting on this pins the mechanism
 * that decides whether the lexical half runs, rather than inferring it from a
 * hit count that the vector half could also explain.
 */
export function lexicalCoverage(query: string, mode: RetrievalMode = 'query') {
  const { terms, known, floor, coverage, passes } = coverageOf(query, mode);
  return { terms: terms.length, known: known.length, coverage, floor, passes };
}

function bm25(query: string, candidates: readonly Chunk[], mode: RetrievalMode): Retrieved[] {
  const { known, passes } = coverageOf(query, mode);
  if (!passes) return [];

  const total = knowledge.chunks.length;

  return candidates
    .map((chunk) => {
      let score = 0;
      for (const term of known) {
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

/** One ranking per query. A single embedMany call rather than N embed calls. */
async function vectors(
  queries: readonly string[],
  candidates: readonly Chunk[],
  mode: RetrievalMode,
): Promise<Retrieved[][]> {
  const empty = queries.map(() => [] as Retrieved[]);
  if (!knowledge.model) return empty;

  const embeddable = candidates.filter((chunk) => chunk.embedding);
  if (embeddable.length === 0) return empty;

  const { embeddings } = await embedMany({
    model: openai.textEmbeddingModel(knowledge.model),
    values: [...queries],
  });

  return embeddings.map((embedding) =>
    embeddable
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(embedding, chunk.embedding as number[]),
      }))
      .filter((hit) => hit.score >= MIN_SIMILARITY[mode])
      .sort((a, b) => b.score - a.score),
  );
}

const byScore = (a: Retrieved, b: Retrieved) => b.score - a.score;

/**
 * Hybrid retrieval over several queries at once, fused with reciprocal rank
 * fusion.
 *
 * Both halves earn their place. Embeddings answer paraphrases ("how do you
 * deal with skewed classes" → the ADASYN section). BM25 answers the exact
 * tokens a technical reader actually types — "ChrF++", "λ_noobj", "ADASYN" —
 * which embeddings blur into their neighbourhood. RRF combines them on rank
 * rather than score, so the two incomparable scales never need calibrating.
 *
 * With more than one query the fused score alone is the wrong selector: a
 * chunk ranked third for five queries out-scores a chunk ranked first for one,
 * so the one passage that answers a narrow requirement gets crowded out by
 * passages that are vaguely about everything. Round-robin takes each query's
 * best chunk first and only then fills by fused score, so every query is
 * represented before any one is explored in depth.
 *
 * Falls back to BM25 alone when the index was built without an API key.
 */
export async function retrieveMany(
  queries: readonly string[],
  { locale, limit = 6, mode = 'query' }: RetrieveOptions,
): Promise<Retrieved[]> {
  const unique = [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
  if (unique.length === 0) return [];

  const candidates = knowledge.chunks.filter((chunk) => chunk.locale === locale);

  const [lexical, semantic] = await Promise.all([
    Promise.resolve(unique.map((query) => bm25(query, candidates, mode))),
    vectors(unique, candidates, mode).catch(() => unique.map(() => [] as Retrieved[])),
  ]);

  const rankings = [...lexical, ...semantic];

  const fused = new Map<string, Retrieved>();
  for (const ranking of rankings) {
    ranking.slice(0, 20).forEach((hit, rank) => {
      const existing = fused.get(hit.chunk.id);
      const contribution = 1 / (RRF_K + rank + 1);
      if (existing) fused.set(hit.chunk.id, { chunk: hit.chunk, score: existing.score + contribution });
      else fused.set(hit.chunk.id, { chunk: hit.chunk, score: contribution });
    });
  }

  // One query has nothing to round-robin between, and taking the fused order
  // directly keeps this path identical to what the chat agent has always done.
  if (unique.length === 1) {
    return [...fused.values()].sort(byScore).slice(0, limit);
  }

  const picked = new Map<string, Retrieved>();
  for (let rank = 0; rank < PER_QUERY && picked.size < limit; rank++) {
    for (const ranking of rankings) {
      if (picked.size >= limit) break;
      const hit = ranking[rank];
      if (!hit || picked.has(hit.chunk.id)) continue;
      picked.set(hit.chunk.id, fused.get(hit.chunk.id)!);
    }
  }
  for (const entry of [...fused.values()].sort(byScore)) {
    if (picked.size >= limit) break;
    picked.set(entry.chunk.id, entry);
  }

  return [...picked.values()].sort(byScore);
}

/** The single-query case, which is what the chat agent's tool calls. */
export async function retrieve(query: string, options: RetrieveOptions): Promise<Retrieved[]> {
  return retrieveMany([query], options);
}

export const knowledgeMeta = {
  chunks: knowledge.chunks.length,
  builtAt: knowledge.builtAt,
  fingerprint: knowledge.fingerprint,
  embeddings: knowledge.model,
};
