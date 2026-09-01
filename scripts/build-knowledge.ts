/**
 * Builds the agent's knowledge index from the same content the site renders,
 * so the agent can never cite something a visitor cannot go and read.
 *
 * Runs in `prebuild`. Without OPENAI_API_KEY it still produces a usable
 * lexical-only index rather than failing the build — a fresh clone and CI must
 * both be able to build the site.
 *
 * The corpus is a few hundred chunks, so the vectors ship as a JSON file and
 * similarity is computed in memory. A vector database here would be infra cost
 * with no retrieval benefit at this scale.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { embedMany } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { tokenize } from '../lib/ai/tokenize';
import type { Chunk, KnowledgeIndex } from '../lib/ai/types';
import {
  profile,
  education,
  experience,
  leadership,
  skills,
  socials,
  type Locale,
} from '../content/cv';
import { achievementsByDate } from '../content/achievements';
import projectsJson from '../.velite/projects.json' with { type: 'json' };
import writingJson from '../.velite/writing.json' with { type: 'json' };

const EMBEDDING_MODEL = 'text-embedding-3-small';
const OUT = 'lib/ai/knowledge.json';
const LOCALES: Locale[] = ['en', 'vi'];

/**
 * Declared structurally rather than inferred from the JSON: velite's output is
 * empty until content exists, and inferring from an empty array types every
 * field as `never`.
 */
interface RawProject {
  locale: string;
  slug: string;
  title: string;
  summary: string;
  year: number;
  role: string;
  stack: string[];
  raw: string;
  repo?: string;
  demo?: string;
  paper?: string;
  metrics: { label: string; value: string; note?: string }[];
}

interface RawPost {
  locale: string;
  slug: string;
  title: string;
  raw: string;
}

const id = (parts: string[]) =>
  createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);

function chunk(partial: Omit<Chunk, 'id' | 'tokens'> & { id?: string }): Chunk {
  return {
    ...partial,
    id: partial.id ?? id([partial.locale, partial.url, partial.section]),
    tokens: tokenize(`${partial.title} ${partial.section} ${partial.text}`),
  };
}

/**
 * Splits a case study on its `## ` headings. Heading-level chunks keep a
 * complete argument together, which matters more than uniform chunk size when
 * the corpus is prose written to be read.
 */
function splitByHeading(markdown: string): { heading: string; body: string }[] {
  const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  const parts = withoutFrontmatter.split(/^## +/m);
  const out: { heading: string; body: string }[] = [];

  const [preamble, ...sections] = parts;
  if (preamble?.trim()) out.push({ heading: 'Overview', body: preamble.trim() });

  for (const section of sections) {
    const newline = section.indexOf('\n');
    const heading = (newline === -1 ? section : section.slice(0, newline)).trim();
    const body = (newline === -1 ? '' : section.slice(newline + 1)).trim();
    if (body) out.push({ heading, body });
  }
  return out;
}

function projectChunks(project: RawProject): Chunk[] {
  const locale = project.locale as Locale;
  const url = `/${locale}/projects/${project.slug}`;
  const chunks: Chunk[] = [];

  // A dedicated summary chunk, so "what is project X about" retrieves the
  // abstract rather than whichever body section happens to score highest.
  const facts = [
    project.summary,
    `Role: ${project.role}.`,
    `Year: ${project.year}.`,
    `Stack: ${project.stack.join(', ')}.`,
    project.metrics.length
      ? `Results: ${project.metrics
          .map((m) => `${m.label} ${m.value}${m.note ? ` (${m.note})` : ''}`)
          .join('; ')}.`
      : '',
    project.repo ? `Source: ${project.repo}` : '',
    project.demo ? `Demo: ${project.demo}` : '',
    project.paper ? `Report: ${project.paper}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  chunks.push(
    chunk({ locale, kind: 'project', title: project.title, section: 'Summary', url, text: facts }),
  );

  for (const { heading, body } of splitByHeading(project.raw)) {
    chunks.push(
      chunk({ locale, kind: 'project', title: project.title, section: heading, url, text: body }),
    );
  }
  return chunks;
}

function postChunks(post: RawPost): Chunk[] {
  const locale = post.locale as Locale;
  const url = `/${locale}/writing/${post.slug}`;
  return splitByHeading(post.raw).map(({ heading, body }) =>
    chunk({ locale, kind: 'post', title: post.title, section: heading, url, text: body }),
  );
}

function profileChunks(locale: Locale): Chunk[] {
  const url = `/${locale}`;
  const make = (section: string, text: string) =>
    chunk({ locale, kind: 'profile', title: profile.name, section, url, text });

  const period = (start: string, end: string | null) =>
    `${start} — ${end ?? (locale === 'vi' ? 'nay' : 'present')}`;

  const list = (
    items: readonly {
      organisation: string;
      role: Record<Locale, string>;
      start: string;
      end: string | null;
      detail: readonly Record<Locale, string>[];
    }[],
  ) =>
    items
      .map(
        (item) =>
          `${item.organisation} — ${item.role[locale]} (${period(item.start, item.end)}). ${item.detail
            .map((d) => d[locale])
            .join(' ')}`,
      )
      .join('\n\n');

  return [
    make(
      'Identity',
      `${profile.name} (${profile.nameVi}). ${profile.headline[locale]}. ${profile.location[locale]}.\n` +
        socials.map((s) => `${s.label}: ${s.href}`).join('\n'),
    ),
    make('Biography', profile.bio[locale]),
    make('Education', list(education)),
    make('Experience', list(experience)),
    make('Leadership', list(leadership)),
    make('Skills', skills.map((g) => `${g.label[locale]}: ${g.items.join(', ')}`).join('\n')),
    make(
      'Achievements',
      achievementsByDate
        .map(
          (item) =>
            `${item.title[locale]} — ${item.issuer} (${item.date}).` +
            (item.detail ? ` ${item.detail[locale]}` : '') +
            (item.href ? ` ${item.href}` : ''),
        )
        .join('\n\n'),
    ),
  ];
}

async function main() {
  const chunks: Chunk[] = [
    ...LOCALES.flatMap(profileChunks),
    ...(projectsJson as RawProject[]).flatMap(projectChunks),
    ...(writingJson as RawPost[]).flatMap(postChunks),
  ];

  // BM25 statistics, computed once here so the request path does no counting.
  const df: Record<string, number> = {};
  for (const item of chunks) {
    for (const token of new Set(item.tokens)) df[token] = (df[token] ?? 0) + 1;
  }
  const avgLength = chunks.reduce((sum, c) => sum + c.tokens.length, 0) / chunks.length;

  let model: string | null = null;
  let embedded = chunks;

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { embeddings } = await embedMany({
      model: openai.textEmbeddingModel(EMBEDDING_MODEL),
      values: chunks.map((c) => `${c.title} — ${c.section}\n\n${c.text}`),
      maxParallelCalls: 4,
    });
    embedded = chunks.map((c, index) => ({ ...c, embedding: embeddings[index] }));
    model = EMBEDDING_MODEL;
  } else {
    console.warn(
      '[knowledge] OPENAI_API_KEY not set — building a lexical-only index. ' +
        'Retrieval will fall back to BM25 alone.',
    );
  }

  // Digest the corpus rather than the clock, so anything keyed on the index —
  // the job matcher's analysis cache — only invalidates when the content it was
  // derived from actually changed.
  const fingerprint = id(chunks.map((c) => `${c.id}:${c.text}`));

  const index: KnowledgeIndex = {
    builtAt: new Date().toISOString(),
    fingerprint,
    model,
    chunks: embedded,
    df,
    avgLength,
  };

  await mkdir('lib/ai', { recursive: true });
  await writeFile(OUT, JSON.stringify(index));

  const bytes = Buffer.byteLength(JSON.stringify(index));
  console.log(
    `[knowledge] ${embedded.length} chunks, ${(bytes / 1024).toFixed(0)} KB, ` +
      `embeddings: ${model ?? 'none'}`,
  );
}

main().catch((error) => {
  console.error('[knowledge] build failed', error);
  process.exit(1);
});
