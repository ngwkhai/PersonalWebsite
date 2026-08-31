'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Command } from 'cmdk';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useTheme } from './theme-toggle';
import { PALETTE_OPEN, openChat } from '@/lib/ui-events';
import { stripDiacritics } from '@/lib/utils';
import { profile } from '@/content/cv';
import type { ChatProject } from './chat/types';

/**
 * ⌘K. Beyond navigation, it hands an unmatched query to the agent — a search
 * box that has an answer for a question no index could match is the point.
 */
export function CommandPalette({ projects }: { projects: readonly ChatProject[] }) {
  const t = useTranslations('palette');
  const tn = useTranslations('nav');
  const ts = useTranslations('theme');
  const router = useRouter();
  const locale = useLocale();
  const { setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_OPEN, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_OPEN, onOpen);
    };
  }, []);

  // cmdk keeps the dialog mounted across open/close, so its own autofocus only
  // fires once. Without this, opening from the header button leaves the caret
  // in the page rather than the palette.
  useEffect(() => {
    if (open) requestAnimationFrame(() => field.current?.focus());
  }, [open]);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    setQuery('');
    action();
  }, []);

  const pages = [
    { label: tn('skills'), href: '/#skills' },
    { label: tn('projects'), href: '/projects' },
    { label: tn('achievements'), href: '/#achievements' },
    { label: tn('experience'), href: '/#experience' },
    { label: tn('writing'), href: '/writing' },
    { label: tn('resume'), href: '/resume' },
    { label: tn('match'), href: '/match' },
    { label: tn('about'), href: '/#about' },
    { label: tn('contact'), href: '/#contact' },
  ];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label={t('open')}
      shouldFilter={false}
      // The backdrop and the panel must be styled through these two props, not
      // through className. className lands on the Command root, which Radix
      // renders *inside* its content element — so a full-screen backdrop built
      // there counted every click as inside the dialog, and clicking away
      // never closed it.
      overlayClassName="bg-ink/25 fixed inset-0 z-90 backdrop-blur-[2px]"
      contentClassName="border-rule bg-paper shadow-ink/10 fixed top-[12vh] left-1/2 z-90 w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2 border shadow-2xl"
    >
      <div>
        <Command.Input
          ref={field}
          value={query}
          onValueChange={setQuery}
          placeholder={t('placeholder')}
          className="border-rule text-ink placeholder:text-ink-3 w-full border-b bg-transparent px-5 py-4 text-[0.95rem] outline-none"
        />

        {/* overscroll-contain stops a wheel gesture that reaches the end of
            the list from scrolling the page behind the dialog. */}
        <Command.List className="max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain p-2">
          <Command.Empty className="text-ink-3 px-3 py-6 text-center text-[0.9rem]">
            {t('empty')}
          </Command.Empty>

          {(() => {
            // Diacritic-folded matching, so "du an" finds "Dự án".
            const needle = stripDiacritics(query).toLowerCase().trim();
            const hit = (text: string) =>
              needle.length === 0 || stripDiacritics(text).toLowerCase().includes(needle);

            const matchedPages = pages.filter((page) => hit(page.label));
            const matchedProjects = projects.filter(
              (project) => hit(project.title) || hit(project.kicker),
            );

            return (
              <>
                {matchedPages.length > 0 && (
                  <Command.Group heading={t('groupPages')} className="palette-group">
                    {matchedPages.map((page) => (
                      <Command.Item
                        key={page.href}
                        value={page.href}
                        onSelect={() => run(() => router.push(page.href))}
                        className="palette-item"
                      >
                        {page.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {matchedProjects.length > 0 && (
                  <Command.Group heading={t('groupProjects')} className="palette-group">
                    {matchedProjects.map((project) => (
                      <Command.Item
                        key={project.slug}
                        value={project.slug}
                        onSelect={() => run(() => router.push(`/projects/${project.slug}`))}
                        className="palette-item"
                      >
                        <span className="truncate">{project.title}</span>
                        <span className="label ml-auto shrink-0 tabular-nums">{project.year}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading={t('groupActions')} className="palette-group">
                  {/* Handing an unmatched query to the agent is the point of
                      the palette, so it leads the actions rather than sitting
                      in a second group with the same heading. */}
                  {query.trim().length > 1 && (
                    <Command.Item
                      value="ask"
                      onSelect={() => run(() => openChat(query.trim()))}
                      className="palette-item"
                    >
                      {t('askAbout', { query: query.trim() })}
                    </Command.Item>
                  )}
                  <Command.Item
                    value="cv"
                    onSelect={() =>
                      run(() => window.open(profile.cvPath, '_blank', 'noopener,noreferrer'))
                    }
                    className="palette-item"
                  >
                    {t('downloadCV')}
                  </Command.Item>
                  <Command.Item
                    value="theme-light"
                    onSelect={() => run(() => setTheme('light'))}
                    className="palette-item"
                  >
                    {ts('toggle')} — {ts('light')}
                  </Command.Item>
                  <Command.Item
                    value="theme-dark"
                    onSelect={() => run(() => setTheme('dark'))}
                    className="palette-item"
                  >
                    {ts('toggle')} — {ts('dark')}
                  </Command.Item>
                  <Command.Item
                    value="locale"
                    onSelect={() =>
                      run(() => router.replace('/', { locale: locale === 'en' ? 'vi' : 'en' }))
                    }
                    className="palette-item"
                  >
                    {locale === 'en' ? 'Tiếng Việt' : 'English'}
                  </Command.Item>
                </Command.Group>
              </>
            );
          })()}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
