import { Badge } from '@/components/ui';
import { UserControls } from '@/features/admin/AdminControls';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getAdminUsers } from '@/features/admin/queries';
import { formatDate } from '@/lib/format';

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  const users = await getAdminUsers();

  return (
    <ul className="space-y-3">
      {users.map((user) => (
        <li key={user.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold text-[var(--color-text)]">
              {user.full_name ?? user.id.slice(0, 8)}
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              {user.phone ?? '—'} · {formatDate(user.created_at, locale)}
            </p>
            <div className="mt-1 flex gap-2">
              <Badge>{user.role}</Badge>
              <Badge tone={user.status === 'active' ? 'ok' : 'bad'}>{user.status}</Badge>
            </div>
          </div>
          <UserControls userId={user.id} status={user.status} />
        </li>
      ))}
      {users.length === 0 && <p className="text-sm text-[var(--color-muted)]">{t('common.all')}</p>}
    </ul>
  );
}
