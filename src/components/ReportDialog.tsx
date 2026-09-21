'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { IconFlag } from './icons';
import { useI18n } from '@/i18n/I18nProvider';
import { submitReport } from '@/features/reports/actions';
import { routes } from '@/lib/routes';
import type { ListingKind, ReportReason } from '@/types';

const REASONS: ReportReason[] = [
  'fake',
  'scam',
  'wrong_price',
  'wrong_info',
  'sold',
  'duplicate',
  'other',
];

export function ReportDialog({ kind, listingId }: { kind: ListingKind; listingId: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await submitReport({
        kind,
        listingId,
        reason: data.get('reason'),
        details: String(data.get('details') ?? ''),
      });
      if (result.ok) {
        setSent(true);
        setOpen(false);
        return;
      }
      if (result.reason === 'auth') router.push(routes.login(locale, window.location.pathname));
      else setError(t('errors.generic'));
    });
  }

  if (sent) {
    return <p className="text-sm text-[var(--color-ok)]">{t('report.sent')}</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-bad)]"
      >
        <IconFlag className="h-4 w-4" />
        {t('listing.report')}
      </button>

      {open && (
        <form onSubmit={onSubmit} className="card mt-3 space-y-3 p-4">
          <div>
            <label className="label" htmlFor="report-reason">
              {t('report.reason')}
            </label>
            <select id="report-reason" name="reason" className="field" required>
              {REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {t(`report.${reason}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="report-details">
              {t('report.details')}
            </label>
            <textarea id="report-details" name="details" rows={3} className="field" maxLength={1000} />
          </div>
          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn btn-primary">
              {t('common.submit')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
