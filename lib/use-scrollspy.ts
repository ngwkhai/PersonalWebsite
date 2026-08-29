'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which section is in view, for the pinned nav.
 *
 * Uses IntersectionObserver rather than a scroll handler: a scroll listener
 * recomputes on every frame and fights Lenis for the main thread, and this
 * needs to be free.
 *
 * `rootMargin` pulls the detection band up under the fixed header and keeps it
 * shallow, so the active item changes when a section's heading reaches the top
 * — which is what a reader perceives as "being in" that section — rather than
 * when its midpoint crosses the middle of the viewport.
 */
export function useScrollSpy(ids: readonly string[], offset = 96): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }

        // Document order wins ties, so scrolling never jumps backwards through
        // the nav while two sections are both in the band.
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      {
        rootMargin: `-${offset}px 0px -70% 0px`,
        threshold: [0, 0.01],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids, offset]);

  return active;
}
