'use client';

import { useId, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { whatsappUrl } from '@/lib/utils';
import { IconWhatsapp } from './icons';

export function BuyButton({ title }: { title: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const number = '+9647504182011';
  const href = whatsappUrl(number, t('whatsapp.message', { title }))!;

  return (
    <div className="relative z-10 mt-3">
      <button type="button" className="btn btn-primary w-full" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {t('listing.buy')}
      </button>
      {open && (
        <div id={id} className="mt-2 rounded-xl border border-[var(--color-line)] p-3 text-center">
          <p className="mb-2 text-sm">{t('listing.buyContact')}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white hover:bg-[#1ebe5a]">
            <IconWhatsapp className="h-5 w-5" />
            <span dir="ltr">{number}</span>
          </a>
        </div>
      )}
    </div>
  );
}
