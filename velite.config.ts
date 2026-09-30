import { defineConfig, defineCollection, s } from 'velite';

/**
 * Locale lives in the path (`content/projects/en/foo.mdx`) and the slug is the
 * basename, so a project is one `slug` with one entry per locale. Everything
 * that must not drift between translations — metrics, links, dates — is
 * duplicated in frontmatter and asserted equal by scripts/build-knowledge.ts.
 */
const localeFromPath = (path: string): 'en' | 'vi' => (path.includes('/vi/') ? 'vi' : 'en');

const metric = s.object({
  label: s.string(),
  value: s.string(),
  /** Optional context shown under the number, e.g. "vs. 74.02 GRU baseline". */
  note: s.string().optional(),
});

const projects = defineCollection({
  name: 'Project',
  pattern: 'projects/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(120),
      summary: s.string().max(400),
      /** Ordering + display year. */
      year: s.number().int(),
      order: s.number().int().default(50),
      featured: s.boolean().default(false),
      /** Short kicker above the title on the case study page. */
      kicker: s.string().max(60),
      tags: s.array(s.string()),
      cover: s.string(),
      repo: s.string().url().optional(),
      demo: s.string().url().optional(),
      /**
       * A deployed product a visitor can use, not a notebook or a recording.
       * These are listed apart from the research, because their evidence is
       * the running thing rather than a metric.
       */
      live: s.boolean().default(false),
      /** One line on how to try the demo — a guest account, what resets. */
      demoNote: s.string().max(200).optional(),
      paper: s.string().url().optional(),
      /**
       * The project's own description, verbatim from the previous site.
       *
       * Kept as discrete lines rather than folded into the prose: these are
       * his words about his own work, and the rewrite had compressed them into
       * a one-sentence summary, which read as the detail having disappeared.
       */
      points: s.array(s.string()).default([]),
      metrics: s.array(metric).default([]),
      /** Rendered as the "Role" line — what Khai personally did. */
      role: s.string(),
      stack: s.array(s.string()),
      body: s.mdx(),
      raw: s.raw(),
      metadata: s.metadata(),
    })
    .transform((data, { meta }) => {
      const path = meta.path.replaceAll('\\', '/');
      const slug = path
        .split('/')
        .pop()!
        .replace(/\.mdx$/, '');
      const locale = localeFromPath(path);
      if (data.live && !data.demo) {
        throw new Error(`${path}: a live project needs a demo URL`);
      }
      // The cover is built at two shapes: 3:2 for the card and the case study
      // head, 1:1 for the chip in the chat. Derived rather than a second
      // frontmatter field, so the two can never name different pictures.
      const coverSquare = data.cover.replace(/(\.\w+)$/, '-square$1');
      return { ...data, coverSquare, slug, locale, permalink: `/${locale}/projects/${slug}` };
    }),
});

const writing = defineCollection({
  name: 'Post',
  pattern: 'writing/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(140),
      summary: s.string().max(400),
      date: s.isodate(),
      draft: s.boolean().default(false),
      tags: s.array(s.string()).default([]),
      body: s.mdx(),
      raw: s.raw(),
      metadata: s.metadata(),
    })
    .transform((data, { meta }) => {
      const path = meta.path.replaceAll('\\', '/');
      const slug = path
        .split('/')
        .pop()!
        .replace(/\.mdx$/, '');
      const locale = localeFromPath(path);
      return { ...data, slug, locale, permalink: `/${locale}/writing/${slug}` };
    }),
});

export default defineConfig({
  root: 'content',
  output: { data: '.velite', assets: 'public/static', base: '/static/', clean: true },
  collections: { projects, writing },
  mdx: { remarkPlugins: [], rehypePlugins: [] },
});
