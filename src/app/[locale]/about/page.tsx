import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="pages.about"
      sections={[
        { bodyKey: 'legal.about.p1' },
        { bodyKey: 'legal.about.p2' },
        { bodyKey: 'legal.about.p3' },
      ]}
    />
  );
}
