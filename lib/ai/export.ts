import { splitRequirements, type Kind, type Level } from './score';

interface ExportRequirement {
  requirement?: string;
  kind?: Kind;
  level?: Level;
  note?: string;
  url?: string | null;
}

interface ExportLabels {
  title: string;
  score: string;
  matched: string;
  gaps: string;
  talkingPoints: string;
  must: string;
  nice: string;
}

/**
 * The assessment as Markdown, for pasting into wherever a recruiter keeps their
 * notes.
 *
 * URLs are written site-relative and prefixed with the origin, because a link
 * that only works inside this page is not much use in an email. Written in the
 * reader's own language, using the labels the page is already showing them.
 */
export function toMarkdown(
  result: {
    verdict?: string;
    requirements?: (ExportRequirement | undefined)[];
    talkingPoints?: (string | undefined)[];
  },
  score: number,
  labels: ExportLabels,
  origin = '',
): string {
  const { matched, gaps } = splitRequirements(result.requirements);

  const line = (item: ExportRequirement & { kind: Kind }) => {
    const link = item.url ? ` — ${origin}${item.url}` : '';
    return `- **${item.requirement}** (${labels[item.kind]})\n  ${item.note ?? ''}${link}`;
  };

  const sections = [
    `# ${labels.title}`,
    `**${labels.score}: ${score}/100**`,
    result.verdict,
    matched.length > 0 && `## ${labels.matched}\n\n${matched.map(line).join('\n')}`,
    gaps.length > 0 && `## ${labels.gaps}\n\n${gaps.map(line).join('\n')}`,
    result.talkingPoints &&
      result.talkingPoints.length > 0 &&
      `## ${labels.talkingPoints}\n\n${result.talkingPoints
        .filter(Boolean)
        .map((point) => `- ${point}`)
        .join('\n')}`,
  ];

  return sections.filter(Boolean).join('\n\n') + '\n';
}
