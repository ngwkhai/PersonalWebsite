'use client';

import { useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';

/**
 * The agent's tool calls, shown as a running log rather than hidden.
 *
 * This is the notebook rail applied to the conversation: the visitor sees what
 * the agent looked up and can judge the answer against it. An agent that shows
 * its retrieval is one you can catch being wrong.
 */
export function ToolActivity({
  name,
  running,
  detail,
}: {
  name: string;
  running: boolean;
  detail?: string;
}) {
  const t = useTranslations('chat');

  const label =
    name === 'searchKnowledge'
      ? t('searching')
      : name === 'navigateTo'
        ? t('navigating')
        : name === 'githubActivity'
          ? 'GitHub'
          : t('thinking');

  return (
    <p className="label flex items-center gap-2 py-0.5">
      {running ? (
        <Loader2 size={11} strokeWidth={2.5} aria-hidden className="text-flare animate-spin" />
      ) : (
        <Check size={11} strokeWidth={2.5} aria-hidden className="text-teal" />
      )}
      <span>{label}</span>
      {detail && <span className="text-ink-3 truncate normal-case">{detail}</span>}
    </p>
  );
}
