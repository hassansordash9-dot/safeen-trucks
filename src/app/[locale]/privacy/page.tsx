import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="pages.privacy"
      sections={[
        { bodyKey: 'legal.privacy.p1' },
        { bodyKey: 'legal.privacy.p2' },
        { bodyKey: 'legal.privacy.p3' },
        { bodyKey: 'legal.privacy.p4' },
      ]}
    />
  );
}
