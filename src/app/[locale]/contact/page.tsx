import { LegalPage } from '@/components/LegalPage';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = createTranslator(await getDictionary(locale));
  return (
    <>
    <LegalPage
      locale={locale}
      titleKey="pages.contact"
      sections={[{ bodyKey: 'legal.contact.p1' }, { bodyKey: 'legal.contact.hours' }]}
    />
    <div className="container-page max-w-2xl pb-10">
      <div className="card flex flex-wrap gap-3 p-5">
        <a href="https://wa.me/9647504182011" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          {t('listing.whatsapp')} <span dir="ltr">+9647504182011</span>
        </a>
        <a href="tel:+9647504182011" className="btn btn-outline">{t('listing.call')}</a>
      </div>
    </div>
    </>
  );
}
