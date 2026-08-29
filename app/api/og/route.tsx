import { ImageResponse } from 'next/og';
import { getProject } from '@/lib/content';
import { profile } from '@/content/cv';
import { locales, type AppLocale } from '@/i18n/routing';

export const runtime = 'nodejs';

const INK = '#16131f';
const PAPER = '#f7f6f9';
const TEAL = '#21918c';
const RULE = '#dedce5';

/**
 * Share cards. Built from the same data as the page, so a card can never
 * advertise a metric the case study does not contain.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get('locale');
  const locale: AppLocale = locales.includes(localeParam as AppLocale)
    ? (localeParam as AppLocale)
    : 'en';
  const slug = searchParams.get('slug');
  const project = slug ? getProject(locale, slug) : undefined;

  const kicker = project ? project.kicker : profile.headline[locale];
  const title = project ? project.title : profile.nameVi;
  const metrics = project
    ? project.metrics.slice(0, 3).map((metric) => ({ label: metric.label, value: metric.value }))
    : [
        { label: 'BLEU', value: '81.31' },
        { label: 'Throughput', value: '4×' },
        { label: 'Projects', value: '7' },
      ];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        color: INK,
        padding: '64px 72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: TEAL,
          }}
        >
          {kicker}
        </div>
        <div style={{ display: 'flex', fontSize: 68, lineHeight: 1.08, letterSpacing: -1.5 }}>
          {title}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          borderTop: `1px solid ${RULE}`,
          paddingTop: 28,
        }}
      >
        <div style={{ display: 'flex', gap: 56 }}>
          {metrics.map((metric) => (
            <div key={metric.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', fontSize: 17, letterSpacing: 2, color: '#6b6579' }}>
                {metric.label.toUpperCase()}
              </div>
              <div style={{ display: 'flex', fontSize: 40 }}>{metric.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: '#6b6579' }}>{profile.name}</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
