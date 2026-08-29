'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AUDIENCES, type Audience } from '@/lib/ai/schemas';

/**
 * One click re-pitches the summary at the reader's depth. The same case study
 * has to serve a recruiter skimming for keywords and a researcher checking
 * whether the evaluation is sound; this lets the page be both without
 * flattening into neither.
 */
export function ExplainAtDepth({ slug, original }: { slug: string; original: string }) {
  const t = useTranslations('project');
  const locale = useLocale();
  const [audience, setAudience] = useState<Audience | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const labels: Record<Audience, string> = {
    recruiter: t('audienceRecruiter'),
    engineer: t('audienceEngineer'),
    researcher: t('audienceResearcher'),
  };

  async function explain(next: Audience) {
    if (next === audience) {
      setAudience(null);
      setText('');
      return;
    }

    setAudience(next);
    setText('');
    setFailed(false);
    setPending(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, audience: next, locale }),
      });
      if (!response.ok || !response.body) throw new Error(String(response.status));

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((current) => current + value);
      }
    } catch {
      setFailed(true);
      setAudience(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label">{t('explainAs')}</span>
        {AUDIENCES.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending}
            aria-pressed={audience === option}
            onClick={() => void explain(option)}
            className={cn(
              'label border px-2.5 py-1 transition-colors disabled:opacity-50',
              audience === option
                ? 'border-ink !text-ink'
                : 'border-rule hover:border-ink-3 hover:text-ink',
            )}
          >
            {labels[option]}
          </button>
        ))}
      </div>

      {(text || pending || failed) && (
        <div aria-live="polite" className="border-teal mt-4 border-l-2 pl-4">
          <p className="text-ink-2 max-w-2xl text-[0.95rem] leading-relaxed">
            {text || (pending ? `${t('explainRunning')}…` : original)}
          </p>
          {text && !pending && (
            <button
              type="button"
              onClick={() => {
                setAudience(null);
                setText('');
              }}
              className="label hover:text-ink mt-3"
            >
              {t('explainReset')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
