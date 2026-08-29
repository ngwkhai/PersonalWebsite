# ngwkhai.dev

Portfolio and research folio for **Nguyễn Đình Khải** — AI researcher and engineer.

The site can be talked to. An agent grounded in these case studies answers
questions about the work, cites the page each claim came from, and says so when
it does not know. There is also a job-description matcher that reads a posting
and reports fit with the gaps named rather than hidden.

## Running it

```bash
pnpm install
cp .env.example .env.local     # fill in OPENAI_API_KEY to enable the agent
pnpm dev
```

Everything except the AI features works without any keys.

| Command          | What it does                                            |
| ---------------- | ------------------------------------------------------- |
| `pnpm dev`       | Velite in watch mode alongside the Next dev server      |
| `pnpm build`     | Rebuilds content, the knowledge index, then the site    |
| `pnpm verify`    | Types, lint, WCAG contrast, unit tests                  |
| `pnpm test`      | Vitest — retrieval, cost estimation, message catalogues |
| `pnpm test:e2e`  | Playwright on desktop Chromium and mobile WebKit        |
| `pnpm test:a11y` | axe against every page, WCAG 2.2 AA                     |
| `pnpm shots`     | Writes screenshots to `e2e/__screenshots__/`            |
| `pnpm knowledge` | Rebuilds `lib/ai/knowledge.json`                        |

## How it fits together

```
content/cv.ts            Single source of truth for facts about Khai
content/achievements.ts  Awards and credentials — add yours here
content/projects/        14 case studies, 7 projects × 2 locales
        ↓
lib/ai/knowledge.json    Built by scripts/build-knowledge.ts
        ↓
app/api/chat             The agent, with tools
```

`content/cv.ts` feeds the UI, the agent's knowledge index and the HTML résumé,
so a fact is edited in exactly one place. **If it is not in `content/`, the
agent will not claim it** — that is the point.

## The agent

Four tools. `searchKnowledge` runs hybrid retrieval (BM25 and embeddings, fused
with reciprocal rank fusion) over 90 passages. `navigateTo` executes in the
browser and really moves the page. `showProject` streams a project card into the
conversation. `githubActivity` reads live repository data.

**Retrieval refuses off-topic queries.** Embeddings always return a nearest
neighbour, so a cosine floor of 0.20 and a query-coverage floor on the lexical
half stop the agent from answering a cooking question out of ML passages. Both
thresholds were measured against this corpus, not guessed — see the comments in
`lib/ai/retrieval.ts`, and re-measure if the embedding model changes.

### Spend control

| Guard                                                 | Where                    |
| ----------------------------------------------------- | ------------------------ |
| Refuses to serve at all in production without Upstash | `app/api/*/route.ts`     |
| 10 messages / 10 min and 40 / day per IP              | `lib/rate-limit.ts`      |
| Hard daily USD ceiling, charged from real usage       | `lib/rate-limit.ts`      |
| `stopWhen: stepCountIs(6)` and `maxOutputTokens`      | `app/api/chat/route.ts`  |
| Pasted job descriptions wrapped as untrusted data     | `app/api/match/route.ts` |

Model routing keeps the bill small: `gpt-5.6-terra` for chat, `gpt-5.6-sol` only
for job-description analysis, `gpt-5.6-luna` for summary rewrites.

## Deploying

Set these in Vercel before the first deploy:

| Variable                                             | Required                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`                                     | For the agent                                                                          |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **Yes.** Without them the AI routes return 503 rather than run without a spend ceiling |
| `AI_DAILY_BUDGET_USD`                                | Defaults to 2                                                                          |
| `NEXT_PUBLIC_SITE_URL`                               | Canonical URLs, sitemap, OG images                                                     |
| `RESEND_API_KEY`, `CONTACT_EMAIL`                    | Contact form delivery                                                                  |
| `GITHUB_TOKEN`                                       | Optional; raises the GitHub API rate limit                                             |

Also set a hard spend limit in the OpenAI dashboard as a last line of defence.

## Design

The palette is **viridis** — the matplotlib default, and therefore the colormap
on every attention map and confusion matrix in this field. It is the brand and
the chart palette at once, and being perceptually uniform it holds contrast in
both themes. `pnpm check:contrast` asserts every token pair against WCAG 2.2 AA.

Type is Fraunces held at its most disciplined axis setting for display, Archivo
for body, IBM Plex Mono for the notebook rail that carries metadata beside the
prose.

The hero name arrives stripped of its diacritics and restores itself — the
diacritic-restoration project performed on its author's name. The server always
renders the correct spelling, so crawlers and screen readers never see the
degraded state, and `prefers-reduced-motion` skips it entirely.

`legacy/` holds the previous static site, untouched, for reference.
