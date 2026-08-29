'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { sendMessage, type ContactState } from '@/app/actions/contact';
import { socials } from '@/content/cv';

const initial: ContactState = { status: 'idle' };

/**
 * Replaces the legacy EmailJS integration, which shipped its service id,
 * template id and public key in client JavaScript. This posts to a server
 * action instead, so nothing sensitive reaches the browser.
 */
export function ContactForm() {
  const t = useTranslations('contact');
  const ts = useTranslations('sections');
  const [state, action, pending] = useActionState(sendMessage, initial);

  const field =
    'w-full border-b border-rule bg-transparent py-2.5 text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink';

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="mx-auto max-w-[88rem] scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20"
    >
      <div className="grid gap-10 sm:grid-cols-[var(--rail)_1fr]">
        <h2 id="contact-heading" className="label !text-ink">
          {ts('contact')}
        </h2>

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20">
          {state.status === 'sent' ? (
            <p className="font-display text-h2 text-ink" role="status">
              {t('sent')}
            </p>
          ) : (
            <form action={action} className="max-w-xl space-y-7">
              {/* Honeypot: invisible to people, irresistible to bots. */}
              <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" tabIndex={-1} autoComplete="off" />
              </div>

              <div>
                <label htmlFor="name" className="label">
                  {t('name')}
                </label>
                <input id="name" name="name" required maxLength={120} className={field} />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  {t('email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor="message" className="label">
                  {t('message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  maxLength={4000}
                  className={`${field} resize-y`}
                />
              </div>

              {state.status === 'error' && (
                <p role="alert" className="text-ink text-[0.9rem]">
                  {state.field === 'email'
                    ? t('invalidEmail')
                    : state.field === 'message'
                      ? t('tooShort')
                      : t('error')}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="label bg-ink !text-paper px-5 py-2.5 transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {pending ? t('sending') : t('send')}
              </button>
            </form>
          )}

          <ul className="space-y-2 lg:pt-1">
            {socials
              .filter((s) => s.primary)
              .map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="me noreferrer"
                    className="group border-rule flex items-baseline justify-between gap-4 border-b py-2"
                  >
                    <span className="label group-hover:text-ink transition-colors">
                      {social.label}
                    </span>
                    <span className="text-ink-3 font-mono text-[0.78rem]">{social.handle}</span>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
