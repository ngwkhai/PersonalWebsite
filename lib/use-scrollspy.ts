'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Which section the reader is in, for the pinned nav.
 *
 * "Active" is the last section whose heading has passed under the header, which
 * is what a reader means by being in a section. An IntersectionObserver band
 * instead kept a tall section active while the next one's heading was already
 * on screen, because the tall section's tail was still inside the band.
 */
export function useScrollSpy(ids: readonly string[], offset = 120) {
  const [active, setActive] = useState<string | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (ids.length === 0) {
      frame.current = requestAnimationFrame(() => setActive(null));
      return () => cancelAnimationFrame(frame.current);
    }

    const measure = () => {
      const y = document.documentElement.scrollTop;
      let current: string | null = null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top + y - offset <= y) current = id;
      }

      setActive(current);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };

    // Deferred a frame rather than called inline: reading layout is fine, but
    // setting state synchronously inside the effect body cascades a render.
    frame.current = requestAnimationFrame(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids, offset]);

  return { active };
}
