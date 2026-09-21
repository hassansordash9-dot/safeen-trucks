'use client';

import { useI18n } from '@/i18n/I18nProvider';

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();

  return (
    <div className="container-page max-w-lg py-20 text-center">
      <h1 className="text-xl font-bold text-[var(--color-text)]">{t('errors.generic')}</h1>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        {t('common.retry')}
      </button>
    </div>
  );
}
