export type ChunkKind = 'project' | 'post' | 'profile';

export interface Chunk {
  readonly id: string;
  readonly locale: 'en' | 'vi';
  readonly kind: ChunkKind;
  /** Human title of the source document, e.g. the project title. */
  readonly title: string;
  /** Heading this chunk sits under, or a synthetic label for profile data. */
  readonly section: string;
  /** Site-relative URL the agent cites. */
  readonly url: string;
  readonly text: string;
  /** Lowercased, diacritic-folded tokens, precomputed for BM25. */
  readonly tokens: readonly string[];
  /** Absent when the index was built without an API key. */
  readonly embedding?: readonly number[];
}

export interface KnowledgeIndex {
  readonly builtAt: string;
  readonly model: string | null;
  readonly chunks: readonly Chunk[];
  /** Document frequency per token, for BM25 IDF. */
  readonly df: Readonly<Record<string, number>>;
  readonly avgLength: number;
}

export interface Retrieved {
  readonly chunk: Chunk;
  readonly score: number;
}
