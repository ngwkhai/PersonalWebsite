'use client';

import { useEffect, useRef, useState } from 'react';

export interface SectionPosition {
  id: string;
  /** Where the section starts, as a fraction of total scrollable distance. */
  at: number;
}

/**
 * Which section the reader is in, plus where every section sits in the
 * document and how far through it they are.
 *
 * Returns all three from one measurement on purpose. An earlier version had the
 * colorbar's marker driven by scroll fraction while its label came from a
 * separate IntersectionObserver, and the two disagreed: the marker sat near the
 * top of the bar while the label still read the previous section.
 *
 * "Active" is the last section whose heading has passed under the header —
 * which is what a reader means by being in a section. An observer band instead
 * kept a tall section active while the next one's heading was already on
 * screen, because the tall section's tail was still inside the band.
 */
export function useScrollSpy(ids: readonly string[], offset = 120) {
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [positions, setPositions] = useState<SectionPosition[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    if (ids.length === 0) {
      frame.current = requestAnimationFrame(() => {
        setActive(null);
        setPositions([]);
      });
      return () => cancelAnimationFrame(frame.current);
    }

    const measure = () => {
      const doc = document.documentElement;
      const span = doc.scrollHeight - doc.clientHeight;
      const y = doc.scrollTop;

      setProgress(span > 0 ? Math.min(1, Math.max(0, y / span)) : 0);

      const tops: SectionPosition[] = [];
      let current: string | null = null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top + y;
        tops.push({ id, at: span > 0 ? Math.min(1, Math.max(0, top / span)) : 0 });
        if (top - offset <= y) current = id;
      }

      setPositions(tops);
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

  return { active, progress, positions };
}
