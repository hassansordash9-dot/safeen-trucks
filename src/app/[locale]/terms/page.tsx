import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="pages.terms"
      sections={[
        { bodyKey: 'legal.terms.p1' },
        { bodyKey: 'legal.terms.p2' },
        { bodyKey: 'legal.terms.p3' },
        { bodyKey: 'legal.terms.p4' },
      ]}
    />
  );
}
