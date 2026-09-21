import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="pages.contact"
      sections={[{ bodyKey: 'legal.contact.p1' }, { bodyKey: 'legal.contact.hours' }]}
    />
  );
}
