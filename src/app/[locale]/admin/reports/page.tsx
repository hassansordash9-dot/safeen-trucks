import { Badge } from '@/components/ui';
import { ReportControls } from '@/features/admin/AdminControls';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminReports } from '@/features/admin/queries';
import { formatDate } from '@/lib/format';

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const reports = await getAdminReports();

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={report.status === 'open' ? 'warn' : 'neutral'}>{report.status}</Badge>
            <Badge>{t(`report.${report.reason}`)}</Badge>
            <span className="text-xs text-[var(--color-muted)]">
              {report.listing_kind} · {formatDate(report.created_at, locale)}
            </span>
          </div>

          {report.details && <p className="mt-2 text-sm">{report.details}</p>}
          <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">{report.listing_id}</p>

          {report.status === 'open' && (
            <div className="mt-3">
              <ReportControls id={report.id} />
            </div>
          )}
        </li>
      ))}
      {reports.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">{t('admin.openReports')}: 0</p>
      )}
    </ul>
  );
}
