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
import { classifyChatError } from '@/lib/ai/errors';
import { ToolActivity } from './tool-activity';
import { ProjectChip } from './project-chip';
import type { ChatProject } from './types';

/** Targets that are anchors on the homepage rather than routes of their own. */
const SECTION_TARGETS = new Set([
  'education',
  'skills',
  'projects',
  'achievements',
  'experience',
  'about',
  'contact',
]);

/**
 * Below this the dock is a bottom sheet rather than a column, and the phone
 * rules in `globals.css` take over. Kept in sync with the `md` breakpoint the
 * CSS uses — the two describe the same layout switch.
 */
const SHEET_QUERY = '(max-width: 767px)';

/** How much of the viewport the sheet claims. `peek` leaves the page readable. */
const SNAPS = ['peek', 'half', 'full'] as const;
type Snap = (typeof SNAPS)[number];

/** Past this a drag is a snap change rather than a nudge. */
const DRAG_THRESHOLD = 56;

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

/** The field grows with what is typed instead of scrolling a 40px slot. */
function fit(field: HTMLTextAreaElement | null) {
  if (!field) return;
  field.style.height = 'auto';
  field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
}

/** Read directly rather than from state: callers include stale-safe closures. */
function onPhone() {
  return typeof window !== 'undefined' && window.matchMedia(SHEET_QUERY).matches;
}

export function ChatDock({ projects }: { projects: readonly ChatProject[] }) {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [snap, setSnap] = useState<Snap>('half');
  const [isSheet, setIsSheet] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ id: number; from: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  /** Whether the transcript is parked at its newest line. */
  const pinned = useRef(true);
  const field = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop, error, setMessages, addToolOutput } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat', body: { locale } }),
    // navigateTo has no server-side execute — the router only exists here.
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName !== 'navigateTo') return;
      const { target, slug } = toolCall.input as { target: string; slug?: string };

      const path =
        target === 'project' && slug
          ? `/projects/${slug}`
          : target === 'home'
            ? '/'
            : SECTION_TARGETS.has(target)
              ? `/#${target}`
              : `/${target}`;

      router.push(path);

      // The whole point of the agent opening a page is that you then look at
      // it. On a phone the sheet covers what it just opened, so it gets out of
      // the way: down to a peek, keyboard dismissed, page in view — the thread
      // is still there, one drag up.
      if (onPhone()) {
        setSnap('peek');
        field.current?.blur();
      }

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
    const query = window.matchMedia(SHEET_QUERY);
    const sync = () => setIsSheet(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true);
      setSnap('half');
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) setInput(prompt);
      // On a phone, focusing throws up the keyboard and buries the page under
      // sheet plus keyboard before the reader has asked for either. It waits
      // for a tap on the field — unless a prompt was seeded, where the whole
      // gesture was "ask this".
      if (prompt || !onPhone())
        requestAnimationFrame(() => {
          field.current?.focus();
          fit(field.current);
        });
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

  // The page narrows to make room rather than being covered. Driven by
  // document attributes so the CSS can move the fixed header too, which a
  // margin on the flow cannot reach, and so the sheet's height — which the
  // page's own bottom padding has to match — is stated in one place.
  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      root.dataset.chat = 'open';
      root.dataset.chatSheet = snap;
    } else {
      delete root.dataset.chat;
      delete root.dataset.chatSheet;
    }
    return () => {
      delete root.dataset.chat;
      delete root.dataset.chatSheet;
    };
  }, [open, snap]);

  // The on-screen keyboard covers a `bottom: 0` element on iOS: the layout
  // viewport does not shrink, so the composer ends up underneath the keys.
  // The visual viewport does know, and publishes the gap as `--kb`, which the
  // sheet sits on top of. Android, which resizes the layout viewport instead,
  // reports ~0 here and is already correct.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !isSheet || !viewport) return;
    const root = document.documentElement;
    const sync = () => {
      const inset = window.innerHeight - viewport.height - viewport.offsetTop;
      // Rubber-banding and a retracting URL bar both report a small inset that
      // is not a keyboard; lifting the sheet for those would read as jitter.
      root.style.setProperty('--kb', inset > 60 ? `${Math.round(inset)}px` : '0px');
    };
    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
      root.style.removeProperty('--kb');
    };
  }, [open, isSheet]);

  /* Instant rather than smooth: a smooth scroll fires scroll events from every
     position on the way down, and the pin below reads those as the reader
     scrolling back through the thread. */
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  /* The transcript's floor moves under it constantly on a phone — the sheet
     snaps, the keyboard opens, the composer grows a line. Each of those is a
     resize, and after each one the last line has to still be the one you can
     see. Only while the reader is already at the bottom: someone who has
     scrolled back through the thread keeps their place. */
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (pinned.current) node.scrollTo({ top: node.scrollHeight });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Asking from a peeking sheet earns the room to read the answer — but only
     when the reader asked. The peek the agent itself drops to after opening a
     page has to survive the turn it is still in the middle of, so this lives
     on the send rather than on `busy`. */
  const ask = useCallback(
    (text: string) => {
      setSnap((current) => (current === 'peek' ? 'half' : current));
      void sendMessage({ text });
    },
    [sendMessage],
  );

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    if (field.current) field.current.style.height = '';
    ask(text);
  }, [input, busy, ask]);

  /* Drag the grip to resize the sheet; a tap on it toggles full height. Only
     downward drag translates — pulling up would lift the sheet off the bottom
     edge and open a gap under it, so upward gestures resolve on release. */
  const step = useCallback((delta: number) => {
    setSnap((current) => {
      const next = SNAPS.indexOf(current) + delta;
      if (next < 0) {
        setOpen(false);
        return current;
      }
      return SNAPS[Math.min(next, SNAPS.length - 1)]!;
    });
  }, []);

  const onGripDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isSheet) return;
    drag.current = { id: event.pointerId, from: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onGripMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    setDragY(Math.max(0, event.clientY - drag.current.from));
  };

  const onGripUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    const travelled = event.clientY - drag.current.from;
    drag.current = null;
    setDragY(0);
    if (travelled > DRAG_THRESHOLD) step(-1);
    else if (travelled < -DRAG_THRESHOLD) step(1);
    else setSnap((current) => (current === 'full' ? 'half' : 'full'));
  };

  const suggestions = (['one', 'two', 'three', 'four'] as const).map((key) =>
    t(`suggestions.${key}`),
  );

  return (
    <>
      {open && (
        // Below lg the dock covers the page, so a scrim says the page is not
        // the thing being used. The phone sheet is the exception: at peek and
        // half the page beside it is still readable and still scrollable, so
        // the CSS shows this only at full height, where tapping it drops the
        // sheet back to half rather than closing the thread outright.
        <button
          type="button"
          aria-label={isSheet ? t('collapse') : t('close')}
          onClick={() => (isSheet ? setSnap('half') : setOpen(false))}
          className="chat-scrim bg-ink/20 fixed inset-0 z-60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        aria-label={t('title')}
        aria-hidden={!open}
        inert={!open}
        data-dragging={dragY ? '' : undefined}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          'chat-dock border-rule bg-paper fixed inset-y-0 right-0 z-70 flex w-full flex-col border-l',
          'transition-transform duration-500 ease-[var(--ease-out-quint)] sm:w-[var(--dock)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Phone only: the sheet's handle. Everything above it stays visible,
            so this is how you trade page for transcript. */}
        <button
          type="button"
          aria-label={snap === 'full' ? t('collapse') : t('expand')}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
          className="chat-grip"
        >
          <span aria-hidden className="chat-grip-bar" />
        </button>

        <header className="border-rule flex items-start gap-4 border-b px-5 py-4 max-md:pt-1 max-md:pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="label !text-ink">{t('title')}</h2>
            <p className="text-ink-3 mt-1.5 text-[0.8rem] leading-relaxed max-md:hidden">
              {t('subtitle')}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label={t('clear')}
              title={t('clear')}
              className="text-ink-3 hover:text-ink -m-2 p-2 transition-colors"
            >
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('close')}
            className="text-ink-3 hover:text-ink -m-2 p-2 transition-colors"
          >
            <X size={17} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        {/* Same as the palette: Lenis runs on the window and would otherwise
            claim a wheel gesture aimed at the transcript. */}
        <div
          ref={scroller}
          data-lenis-prevent
          onScroll={(event) => {
            const node = event.currentTarget;
            pinned.current = node.scrollHeight - node.clientHeight - node.scrollTop < 24;
          }}
          className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-6 max-md:py-4"
        >
          {messages.length === 0 && (
            <ul className="space-y-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => ask(suggestion)}
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
                            {/* The profile chunks cite /en itself, which strips to an
                                empty string and rendered a blank pill. */}
                            {url.replace(/^\/(en|vi)/, '') || '/'}
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
              {t(classifyChatError(error))}
            </p>
          )}
        </div>

        <div className="chat-composer border-rule border-t px-5 py-4 max-md:py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={field}
              rows={1}
              value={input}
              maxLength={2000}
              onChange={(event) => {
                setInput(event.target.value);
                fit(event.target);
              }}
              onFocus={() => {
                // Typing in a peeking sheet means reading the answer through a
                // slot. It takes back half — never full: the page stays in view.
                if (isSheet) setSnap((current) => (current === 'peek' ? 'half' : current));
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              /* The full placeholder is a whole question, which wraps to two
                 clipped lines in a phone's composer. The short one is the
                 invitation; the long one stays as the label. */
              placeholder={isSheet ? t('placeholderShort') : t('placeholder')}
              aria-label={t('placeholder')}
              className="text-ink placeholder:text-ink-3 max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[0.92rem] outline-none"
            />
            <button
              type="button"
              onClick={busy ? () => void stop() : submit}
              disabled={!busy && input.trim().length === 0}
              aria-label={busy ? t('stop') : t('send')}
              className="bg-ink text-paper grid size-9 shrink-0 place-items-center transition-opacity hover:opacity-85 disabled:opacity-30 max-md:size-11"
            >
              {busy ? (
                <Square size={12} strokeWidth={2.5} fill="currentColor" aria-hidden />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} aria-hidden />
              )}
            </button>
          </div>
          <p className="chat-disclaimer label mt-2 !tracking-normal !normal-case">
            {t('disclaimer')}
          </p>
        </div>
      </aside>
    </>
  );
}
