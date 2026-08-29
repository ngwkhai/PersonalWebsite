import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { knowledgeMeta } from '@/lib/ai/retrieval';
import { MODELS } from '@/lib/ai/models';
import { allProjects } from '@/lib/content';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'footer' });
  return { title: t('colophon') };
}

/**
 * How the site works, stated plainly. An AI portfolio that will not say which
 * model it runs or what it does with your input is asking for trust it has not
 * earned.
 */
export default async function ColophonPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const vi = locale === 'vi';

  const rows: { label: string; value: string }[] = [
    { label: vi ? 'Nền tảng' : 'Framework', value: 'Next.js 16, App Router, React 19' },
    { label: vi ? 'Kiểu chữ' : 'Typefaces', value: 'Fraunces · Archivo · IBM Plex Mono' },
    {
      label: vi ? 'Bảng màu' : 'Palette',
      value: vi ? 'viridis (mặc định của matplotlib)' : 'viridis (the matplotlib default)',
    },
    {
      label: vi ? 'Nội dung' : 'Content',
      value: `MDX via Velite · ${allProjects.length} documents`,
    },
    { label: vi ? 'Mô hình hội thoại' : 'Chat model', value: MODELS.chat },
    { label: vi ? 'Mô hình phân tích' : 'Analysis model', value: MODELS.analysis },
    {
      label: vi ? 'Nhúng vector' : 'Embeddings',
      value: knowledgeMeta.embeddings ?? 'none (BM25 only)',
    },
    {
      label: vi ? 'Chỉ mục tri thức' : 'Knowledge index',
      value: `${knowledgeMeta.chunks} ${vi ? 'đoạn' : 'passages'}`,
    },
    {
      label: vi ? 'Truy hồi' : 'Retrieval',
      value: vi ? 'BM25 + embedding, hợp nhất bằng RRF' : 'BM25 + embeddings, fused with RRF',
    },
    { label: vi ? 'Ảnh' : 'Images', value: 'AVIF · 6.98 MB → 0.25 MB' },
  ];

  const notes = vi
    ? [
        'Agent chỉ trả lời từ nội dung của chính trang này. Nó trích dẫn nguồn đã dùng và nói thẳng khi không tìm thấy — nó không được phép suy đoán.',
        'Tin nhắn của bạn được gửi tới OpenAI để sinh câu trả lời. Hội thoại không được lưu trên máy chủ và không dùng để huấn luyện.',
        'Có giới hạn tần suất theo IP và một trần chi phí theo ngày. Khi chạm trần, agent trả lời sẵn thay vì gọi API.',
        'Mô tả công việc bạn dán vào được xử lý như dữ liệu, không phải chỉ thị.',
      ]
    : [
        'The agent answers only from this site’s own content. It cites what it used and says so when it finds nothing — it is not permitted to infer.',
        'Your messages are sent to OpenAI to generate a reply. Conversations are not stored on the server and are not used for training.',
        'There are per-IP rate limits and a hard daily spend ceiling. At the ceiling the agent serves a canned reply and makes no API call.',
        'A pasted job description is treated as data, never as instructions.',
      ];

  return (
    <section className="mx-auto max-w-[88rem] px-5 pt-32 pb-16 sm:px-8 sm:pt-40">
      <div className="grid gap-10 sm:grid-cols-[var(--rail)_1fr]">
        <h1 className="label !text-ink">{vi ? 'Ghi chú kỹ thuật' : 'Colophon'}</h1>

        <div className="max-w-3xl">
          <dl className="border-rule border-t">
            {rows.map((row) => (
              <div
                key={row.label}
                className="border-rule grid gap-1 border-b py-3.5 sm:grid-cols-[14rem_1fr]"
              >
                <dt className="label">{row.label}</dt>
                <dd className="text-ink-2 font-mono text-[0.84rem]">{row.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="label !text-teal mt-14">{vi ? 'Về trợ lý' : 'About the assistant'}</h2>
          <ul className="mt-4 space-y-3">
            {notes.map((note) => (
              <li
                key={note}
                className="border-rule text-ink-2 max-w-[68ch] border-l-2 pl-4 text-[0.95rem] leading-relaxed"
              >
                {note}
              </li>
            ))}
          </ul>

          <p className="label mt-12">
            {vi ? 'Chỉ mục dựng lúc' : 'Index built'} —{' '}
            <span className="tabular-nums">{knowledgeMeta.builtAt.slice(0, 10)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
