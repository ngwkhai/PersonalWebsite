'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Square, X, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { CHAT_OPEN } from '@/lib/ui-events';
import { cn } from '@/lib/utils';
import { ToolActivity } from './tool-activity';
import { ProjectChip } from './project-chip';
import type { ChatProject } from './types';

/** Targets that are anchors on the homepage rather than routes of their own. */
const SECTION_TARGETS = new Set([
  'skills',
  'work',
  'achievements',
  'experience',
  'about',
  'contact',
]);

/** The agent strips its own citation line; pills render it instead. */
function splitSources(text: string): { body: string; urls: string[] } {
  const match = text.match(/\n*Sources?:\s*(.+)\s*$/i);
  if (!match) return { body: text, urls: [] };
  const urls = match[1]!
    .split(/[,\s]+/)
    .map((url) => url.trim().replace(/[.,)]$/, ''))
    .filter((url) => url.startsWith('/'));
  return { body: text.slice(0, match.index).trimEnd(), urls };
}

export function ChatDock({ projects }: { projects: readonly ChatProject[] }) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop, error, setMessages, addToolOutput } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat', body: { locale } }),
    // navigateTo has no server-side execute — the router only exists here.
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName !== 'navigateTo') return;
      const { target, slug } = toolCall.input as { target: string; slug?: string };

      const path =
        target === 'project' && slug
          ? `/work/${slug}`
          : target === 'home'
            ? '/'
            : SECTION_TARGETS.has(target)
              ? `/#${target}`
              : `/${target}`;

      router.push(path);
      addToolOutput({
        tool: 'navigateTo',
        toolCallId: toolCall.toolCallId,
        output: { navigated: true, path },
      });
    },
    // Client tool results must go back for the agent to continue its turn.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (cause) => console.error('[chat]', cause),
  });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true);
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) setInput(prompt);
      requestAnimationFrame(() => field.current?.focus());
    };
    window.addEventListener(CHAT_OPEN, onOpen);
    return () => window.removeEventListener(CHAT_OPEN, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    void sendMessage({ text });
  }, [input, busy, sendMessage]);

  const suggestions = (['one', 'two', 'three', 'four'] as const).map((key) =>
    t(`suggestions.${key}`),
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t('close')}
          onClick={() => setOpen(false)}
          className="bg-ink/20 fixed inset-0 z-60 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
        />
      )}

      <aside
        aria-label={t('title')}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'border-rule bg-paper fixed inset-y-0 right-0 z-70 flex w-full flex-col border-l',
          'transition-transform duration-500 ease-[var(--ease-out-quint)] sm:w-[30rem]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="border-rule flex items-start gap-4 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="label !text-ink">{t('title')}</h2>
            <p className="text-ink-3 mt-1.5 text-[0.8rem] leading-relaxed">{t('subtitle')}</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label={t('clear')}
              title={t('clear')}
              className="text-ink-3 hover:text-ink transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('close')}
            className="text-ink-3 hover:text-ink transition-colors"
          >
            <X size={17} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div ref={scroller} className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
          {messages.length === 0 && (
            <ul className="space-y-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void sendMessage({ text: suggestion })}
                    className="border-rule text-ink-2 hover:border-ink-3 hover:text-ink w-full border px-3 py-2.5 text-left text-[0.86rem] transition-colors"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {messages.map((message) => {
            const sources = new Set<string>();
            for (const part of message.parts) {
              if (part.type === 'tool-searchKnowledge' && part.state === 'output-available') {
                const output = part.output as { passages?: { url: string }[] } | undefined;
                output?.passages?.forEach((passage) => sources.add(passage.url));
              }
            }

            return (
              <div key={message.id} className={cn(message.role === 'user' && 'flex justify-end')}>
                {message.role === 'user' ? (
                  <p className="bg-sunk text-ink max-w-[85%] px-3.5 py-2.5 text-[0.92rem] leading-relaxed">
                    {message.parts
                      .filter((part) => part.type === 'text')
                      .map((part) => part.text)
                      .join('')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        const { body, urls } = splitSources(part.text);
                        urls.forEach((url) => sources.add(url));
                        return (
                          <div
                            key={index}
                            className="prose-notebook !text-ink !max-w-none !text-[0.92rem] !leading-[1.65]"
                          >
                            <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
                          </div>
                        );
                      }

                      if (part.type === 'tool-showProject' && part.state === 'output-available') {
                        const { slug } = part.input as { slug: string };
                        const project = projects.find((item) => item.slug === slug);
                        return project ? <ProjectChip key={index} project={project} /> : null;
                      }

                      if (part.type.startsWith('tool-')) {
                        const toolPart = part as { type: string; state: string; input?: unknown };
                        const name = toolPart.type.slice(5);
                        if (name === 'showProject') return null;
                        const query = (toolPart.input as { query?: string } | undefined)?.query;
                        return (
                          <ToolActivity
                            key={index}
                            name={name}
                            running={toolPart.state !== 'output-available'}
                            detail={query}
                          />
                        );
                      }

                      return null;
                    })}

                    {sources.size > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="label">{t('sources')}</span>
                        {[...sources].map((url) => (
                          <a
                            key={url}
                            href={url}
                            className="border-rule text-ink-2 hover:border-ink-3 hover:text-ink border px-1.5 py-0.5 font-mono text-[0.68rem] transition-colors"
                          >
                            {url.replace(/^\/(en|vi)/, '')}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <p role="alert" className="text-ink-2 text-[0.86rem]">
              {/* Rate limit and budget states come back as HTTP 429 with a reason. */}
              {error.message.includes('429')
                ? error.message.includes('budget')
                  ? t('budgetExhausted')
                  : t('rateLimited')
                : t('error')}
            </p>
          )}
        </div>

        <div className="border-rule border-t px-5 py-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={field}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              className="text-ink placeholder:text-ink-3 max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[0.92rem] outline-none"
            />
            <button
              type="button"
              onClick={busy ? () => void stop() : submit}
              disabled={!busy && input.trim().length === 0}
              aria-label={busy ? t('stop') : t('send')}
              className="bg-ink text-paper grid size-9 shrink-0 place-items-center transition-opacity hover:opacity-85 disabled:opacity-30"
            >
              {busy ? (
                <Square size={12} strokeWidth={2.5} fill="currentColor" aria-hidden />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} aria-hidden />
              )}
            </button>
          </div>
          <p className="label mt-2 !tracking-normal !normal-case">{t('disclaimer')}</p>
        </div>
      </aside>
    </>
  );
}
