'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const order: readonly Theme[] = ['system', 'light', 'dark'];
const icons = { system: Monitor, light: Sun, dark: Moon } as const;
const THEME_CHANGE = 'khai:theme';

function subscribe(onChange: () => void) {
  // 'storage' covers the same site open in another tab; the custom event covers
  // this one, which never fires 'storage' for its own writes.
  window.addEventListener('storage', onChange);
  window.addEventListener(THEME_CHANGE, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(THEME_CHANGE, onChange);
  };
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem('theme');
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/**
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than an effect. That also gives a correct server
 * snapshot, which removes the usual mounted-flag flicker guard.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'system' as Theme);

  const setTheme = useCallback((next: Theme) => {
    if (next === 'system') {
      localStorage.removeItem('theme');
      document.documentElement.removeAttribute('data-theme');
    } else {
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
    window.dispatchEvent(new Event(THEME_CHANGE));
  }, []);

  return { theme, setTheme };
}

export function ThemeToggle() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();

  const Icon = icons[theme];
  const next = order[(order.indexOf(theme) + 1) % order.length]!;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t('toggle')} — ${t(theme)}`}
      title={t(theme)}
      className="grid size-8 place-items-center text-ink-3 transition-colors hover:text-ink"
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
