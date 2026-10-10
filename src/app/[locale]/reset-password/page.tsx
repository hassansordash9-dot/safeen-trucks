import { PasswordRecoveryForm } from '@/components/PasswordRecoveryForm';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';

export const metadata = { robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return <div className="container-page max-w-md py-10"><h1 className="mb-5 text-2xl font-bold">{t('auth.newPassword')}</h1><PasswordRecoveryForm reset /></div>;
}
