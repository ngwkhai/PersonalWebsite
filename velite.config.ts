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
      paper: s.string().url().optional(),
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
      const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
      const locale = localeFromPath(path);
      return { ...data, slug, locale, permalink: `/${locale}/work/${slug}` };
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
      const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
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
