import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';

export default async function HelpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <LegalPage
      locale={locale}
      titleKey="pages.help"
      sections={[
        { headingKey: 'legal.help.sellTitle', bodyKey: 'legal.help.sellBody' },
        { headingKey: 'legal.help.buyTitle', bodyKey: 'legal.help.buyBody' },
        { headingKey: 'legal.help.safetyTitle', bodyKey: 'legal.help.safetyBody' },
      ]}
    />
  );
}
