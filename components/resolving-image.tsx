'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * An image that arrives degraded and resolves as it enters view.
 *
 * This is the site's thesis applied to its own pictures: every project here is
 * about recovering signal from degraded data, and the hero already performs it
 * on his name. Doing the same to the imagery makes the idea a property of the
 * page rather than a single trick.
 *
 * Driven by a data attribute rather than React state. The degraded state must
 * not be what the server renders — a crawler or a reader without JavaScript
 * should get the finished image — so it is applied on the client, and setting
 * state to do that would mean rendering twice on mount for a purely visual
 * effect. `prefers-reduced-motion` skips it entirely.
 */
export function ResolvingImage({
  alt,
  className,
  wrapperClassName,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    node.dataset.resolving = 'true';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          delete node.dataset.resolving;
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn('resolving bg-sunk relative overflow-hidden', wrapperClassName)}>
      <Image {...props} alt={alt} className={className} />
    </div>
  );
}
