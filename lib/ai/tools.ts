import { tool } from 'ai';
import { z } from 'zod';
import { retrieve } from './retrieval';
import { getProjects, getProject } from '@/lib/content';
import type { AppLocale } from '@/i18n/routing';

export function buildTools(locale: AppLocale) {
  const slugs = getProjects(locale).map((p) => p.slug);

  return {
    searchKnowledge: tool({
      description:
        'Search the case studies and profile for passages relevant to a question. Call this before stating any fact about Khai. Returns passages with the URL each one came from.',
      inputSchema: z.object({
        query: z
          .string()
          .min(2)
          .max(300)
          .describe(
            'What to look for, in the visitor’s own terms. Technical terms work well — the index matches exact tokens as well as meaning.',
          ),
      }),
      execute: async ({ query }) => {
        const hits = await retrieve(query, { locale });
        return {
          passages: hits.map(({ chunk }) => ({
            title: chunk.title,
            section: chunk.section,
            url: chunk.url,
            text: chunk.text,
          })),
        };
      },
    }),

    showProject: tool({
      description:
        'Render a project card inline in the conversation. Use when a specific project is the answer, instead of describing the card in prose.',
      inputSchema: z.object({
        slug: z.enum(slugs as [string, ...string[]]).describe('The project to show.'),
      }),
      // No execute: the card is rendered by the client from the tool input.
      // The model gets the call back as a result it can reason about.
      execute: async ({ slug }) => {
        const project = getProject(locale, slug);
        return project
          ? { shown: true, title: project.title, url: project.permalink }
          : { shown: false };
      },
    }),

    navigateTo: tool({
      description:
        'Move the visitor to a page or section of this site. Use when they ask to see, open, or go to something. The page really navigates, so do not call this speculatively.',
      inputSchema: z.object({
        target: z
          .enum(['home', 'work', 'writing', 'match', 'about', 'contact', 'project'])
          .describe('Where to go. Use "project" together with slug for a case study.'),
        slug: z.string().optional().describe('Required when target is "project".'),
      }),
      // Executed on the client — the server has no router. Declaring no execute
      // hands the call to the browser, which navigates and reports back.
    }),

    githubActivity: tool({
      description:
        'Recent public GitHub activity: repositories, languages and last push dates. Use for questions about what he is working on now.',
      inputSchema: z.object({}),
      execute: async () => {
        const headers: HeadersInit = {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ngwkhai-portfolio',
        };
        if (process.env.GITHUB_TOKEN) {
          headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }

        try {
          const response = await fetch(
            'https://api.github.com/users/ngwkhai/repos?sort=pushed&per_page=8',
            { headers, next: { revalidate: 3600 } },
          );
          if (!response.ok) return { available: false as const };

          const repos = (await response.json()) as {
            name: string;
            description: string | null;
            language: string | null;
            pushed_at: string;
            html_url: string;
            stargazers_count: number;
          }[];

          return {
            available: true as const,
            repositories: repos.map((repo) => ({
              name: repo.name,
              description: repo.description,
              language: repo.language,
              lastPush: repo.pushed_at.slice(0, 10),
              url: repo.html_url,
              stars: repo.stargazers_count,
            })),
          };
        } catch {
          return { available: false as const };
        }
      },
    }),
  };
}

export type PortfolioTools = ReturnType<typeof buildTools>;
