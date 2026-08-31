'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { ChatProject } from './types';

/** Generative UI: a real project card, streamed into the conversation. */
export function ProjectChip({ project }: { project: ChatProject }) {
  return (
    <Link
      href={project.href}
      className="group border-rule hover:border-ink-3 my-2 flex items-center gap-3 border p-2 transition-colors"
    >
      <div className="bg-sunk relative size-12 shrink-0 overflow-hidden">
        <Image src={project.coverSquare} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className="label">
          {project.year} · {project.kicker}
        </p>
        <p className="text-ink group-hover:text-indigo truncate text-[0.9rem] font-medium transition-colors">
          {project.title}
        </p>
      </div>
    </Link>
  );
}
