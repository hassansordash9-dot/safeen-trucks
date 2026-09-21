import { Badge } from '@/components/ui';
import { VerificationControls } from '@/features/admin/AdminControls';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminVerifications } from '@/features/admin/queries';
import { formatDate } from '@/lib/format';

export default async function AdminVerificationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const verifications = await getAdminVerifications();

  return (
    <ul className="space-y-3">
      {verifications.map((verification) => (
        <li
          key={verification.id}
          className="card flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {verification.dealer?.business_name ?? verification.profile_id.slice(0, 8)}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {verification.level} · {formatDate(verification.requested_at, locale)}
            </p>
            <Badge
              tone={
                verification.status === 'approved'
                  ? 'ok'
                  : verification.status === 'rejected'
                    ? 'bad'
                    : 'warn'
              }
            >
              {verification.status}
            </Badge>
          </div>

          {verification.status === 'pending' && <VerificationControls id={verification.id} />}
        </li>
      ))}
      {verifications.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">{t('admin.pendingVerifications')}: 0</p>
      )}
    </ul>
  );
}
