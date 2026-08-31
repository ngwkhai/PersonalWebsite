'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { openChat } from '@/lib/ui-events';

/**
 * The floating way in to the agent.
 *
 * The header already has an "Ask" button, but it sits in a row of eight nav
 * items and reads as one more link — a first-time visitor does not know the
 * site answers questions. This is the same action given the shape people
 * already recognise: a chat bubble, bottom right, that breathes.
 *
 * It hides itself while the dock is open (CSS, on the `data-chat` attribute
 * the dock already sets) so it never sits on top of the panel it opened.
 */
export function ChatFab() {
  const t = useTranslations('chat');
  const [ready, setReady] = useState(false);

  // It arrives a beat after the page rather than racing the hero for
  // attention — motion that starts after everything else has settled is what
  // makes it read as an invitation instead of an ad.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="chat-fab" data-ready={ready ? 'true' : undefined}>
      <span aria-hidden className="chat-fab-label">
        {t('title')}
      </span>

      <button
        type="button"
        onClick={() => openChat()}
        aria-label={t('title')}
        className="chat-fab-button"
      >
        <span aria-hidden className="chat-fab-ring" />
        <span aria-hidden className="chat-fab-ring chat-fab-ring-late" />
        <MessageCircle size={22} strokeWidth={1.75} aria-hidden className="relative" />
        <span aria-hidden className="chat-fab-dot" />
      </button>
    </div>
  );
}
