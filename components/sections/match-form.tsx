'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Check, Minus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { matchSchema } from '@/lib/ai/schemas';

const MIN_JD = 120;

/**
 * Recruiter mode. Streams a structured verdict as it is generated, so the
 * score and the first matched requirements land while the rest is still being
 * written rather than after a long blank wait.
 */
export function MatchForm() {
  const t = useTranslations('match');
  const tc = useTranslations('chat');
  const locale = useLocale();
  const [jd, setJd] = useState('');

  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/match',
    schema: matchSchema,
  });

  const tooShort = jd.trim().length > 0 && jd.trim().length < MIN_JD;

  return (
    <div className="max-w-3xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (jd.trim().length < MIN_JD || isLoading) return;
          submit({ jd: jd.trim(), locale });
        }}
      >
        <label htmlFor="jd" className="label">
          {t('placeholder')}
        </label>
        <textarea
          id="jd"
          value={jd}
          onChange={(event) => setJd(event.target.value)}
          rows={10}
          maxLength={12000}
          placeholder={t('placeholder')}
          className="border-rule text-ink placeholder:text-ink-3 focus:border-ink-3 mt-2 w-full resize-y border bg-transparent p-4 font-mono text-[0.82rem] leading-relaxed transition-colors outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type={isLoading ? 'button' : 'submit'}
            onClick={isLoading ? () => stop() : undefined}
            disabled={!isLoading && jd.trim().length < MIN_JD}
            className="label bg-ink !text-paper px-5 py-2.5 transition-opacity hover:opacity-85 disabled:opacity-30"
          >
            {isLoading ? `${t('analysing')}…` : t('submit')}
          </button>
          {tooShort && <p className="label !normal-case">{t('tooShort')}</p>}
          <span className="label ml-auto tabular-nums">{jd.length} / 12000</span>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-ink-2 mt-8 text-[0.9rem]">
          {error.message.includes('429') ? tc('rateLimited') : tc('error')}
        </p>
      )}

      {object && (
        <div aria-live="polite" className="border-rule mt-14 space-y-12 border-t pt-10">
          <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="label">{t('score')}</p>
              <p className="text-ink font-mono text-5xl tabular-nums">
                {object.score ?? '—'}
                <span className="text-ink-3">/100</span>
              </p>
            </div>
            {object.verdict && (
              <p className="font-display text-h3 text-ink max-w-lg flex-1 leading-snug">
                {object.verdict}
              </p>
            )}
          </header>

          {object.matched && object.matched.length > 0 && (
            <section>
              <h2 className="label !text-teal">{t('matched')}</h2>
              <ul className="divide-rule border-rule mt-4 divide-y border-y">
                {object.matched.map((item, index) => (
                  <li key={index} className="flex gap-4 py-5">
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      aria-hidden
                      className="text-teal mt-1 shrink-0"
                    />
                    <div>
                      <p className="text-ink text-[0.95rem] font-medium">{item?.requirement}</p>
                      <p className="text-ink-2 mt-1.5 text-[0.92rem] leading-relaxed">
                        {item?.evidence}
                      </p>
                      {item?.url && (
                        <Link
                          href={item.url.replace(/^\/(en|vi)/, '')}
                          className="label hover:text-ink mt-2 inline-block"
                        >
                          {item.url.replace(/^\/(en|vi)/, '')} →
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {object.gaps && object.gaps.length > 0 && (
            <section>
              <h2 className="label">{t('gaps')}</h2>
              <ul className="divide-rule border-rule mt-4 divide-y border-y">
                {object.gaps.map((item, index) => (
                  <li key={index} className="flex gap-4 py-5">
                    <Minus
                      size={15}
                      strokeWidth={2.5}
                      aria-hidden
                      className="text-ink-3 mt-1 shrink-0"
                    />
                    <div>
                      <p className="text-ink text-[0.95rem] font-medium">{item?.requirement}</p>
                      <p className="text-ink-2 mt-1.5 text-[0.92rem] leading-relaxed">
                        {item?.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {object.talkingPoints && object.talkingPoints.length > 0 && (
            <section>
              <h2 className="label">{t('talkingPoints')}</h2>
              <ul className="mt-4 space-y-3">
                {object.talkingPoints.map((point, index) => (
                  <li
                    key={index}
                    className="border-indigo text-ink-2 border-l-2 pl-4 text-[0.95rem] leading-relaxed"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
