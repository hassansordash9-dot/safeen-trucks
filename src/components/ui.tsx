import Link from 'next/link';
import { IconCheck, IconChevron, IconShield } from './icons';
import { cn } from '@/lib/utils';
import type { ListingStatus } from '@/types';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' | 'dark';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-[var(--color-surface)] text-[var(--color-muted)]',
    ok: 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]',
    warn: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
    bad: 'bg-[var(--color-bad-soft)] text-[var(--color-bad)]',
    accent: 'bg-[var(--color-gold)] text-[var(--color-fixed-dark)]',
    dark: 'bg-[var(--color-invert-bg)] text-[var(--color-invert-fg)]',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ label }: { label: string }) {
  return (
    <Badge tone="ok">
      <IconShield className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'dark';
const statusTone: Record<ListingStatus, Tone> = {
  draft: 'neutral',
  pending: 'warn',
  published: 'ok',
  rejected: 'bad',
  paused: 'neutral',
  sold: 'dark',
  expired: 'neutral',
};

export function ListingStatusBadge({ status, label }: { status: ListingStatus; label: string }) {
  return <Badge tone={statusTone[status]}>{label}</Badge>;
}

export function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-lg font-bold text-[var(--color-text)] sm:text-xl">{title}</h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-text)] hover:underline"
        >
          {linkLabel}
          <IconChevron className="h-4 w-4 rtl:rotate-180" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  actions,
}: {
  title: string;
  body?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
      {body && <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">{body}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
  labels,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string>;
  labels: { previous: string; next: string; page: string; of: string };
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams(params);
    if (target <= 1) search.delete('page');
    else search.set('page', String(target));
    const query = search.toString();
    return `${basePath}${query ? `?${query}` : ''}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label={labels.page}>
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-outline" rel="prev">
          {labels.previous}
        </Link>
      ) : (
        <span className="btn btn-outline opacity-40">{labels.previous}</span>
      )}
      <span className="text-sm text-[var(--color-muted)]">
        {labels.page} {page} {labels.of} {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn btn-outline" rel="next">
          {labels.next}
        </Link>
      ) : (
        <span className="btn btn-outline opacity-40">{labels.next}</span>
      )}
    </nav>
  );
}

export function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--color-line)] py-2.5 last:border-0">
      <dt className="text-sm text-[var(--color-muted)]">{label}</dt>
      <dd className="text-end text-sm font-medium text-[var(--color-text)]">{value}</dd>
    </div>
  );
}

export function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export function Checkline({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ok)]" />
      <span>{children}</span>
    </li>
  );
}
