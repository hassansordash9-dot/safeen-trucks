import { ProfileForm } from '@/features/account/ProfileForm';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { requireUser } from '@/lib/auth';
import { getLocations } from '@/lib/reference';
import { routes } from '@/lib/routes';

export default async function ProfilePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireUser(locale, routes.accountProfile(locale));
  const t = createTranslator(await getDictionary(locale));
  const locations = await getLocations();

  return (
    <div className="container-page max-w-lg py-8">
      <h1 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
        {t('account.profile')}
      </h1>
      <ProfileForm profile={user.profile} locations={locations} />
    </div>
  );
}
