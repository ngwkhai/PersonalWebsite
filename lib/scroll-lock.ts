'use client';

import { useEffect } from 'react';

/**
 * Pauses the page's smooth scrolling while a modal owns the wheel.
 *
 * Lenis runs on the window and knows nothing about the palette, so a wheel
 * gesture inside the ⌘K dialog scrolled the page behind it instead of the
 * list — the dialog's own `overflow-y-auto` never saw the event, because
 * Lenis had already swallowed it. `data-lenis-prevent` fixes the list itself;
 * this covers everything else in the overlay, where there is nothing to
 * scroll and the page should simply stay put.
 *
 * A counter rather than a boolean: two overlays can be open at once, and the
 * first one to close must not hand scrolling back to the page.
 */
let depth = 0;
const listeners = new Set<(locked: boolean) => void>();

function broadcast() {
  for (const listener of listeners) listener(depth > 0);
}

/** Subscribes to the lock; called immediately with the current state. */
export function onScrollLock(listener: (locked: boolean) => void) {
  listeners.add(listener);
  listener(depth > 0);
  return () => {
    listeners.delete(listener);
  };
}

/** Holds the lock for as long as `active` stays true. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    depth += 1;
    broadcast();
    return () => {
      depth -= 1;
      broadcast();
    };
  }, [active]);
}
