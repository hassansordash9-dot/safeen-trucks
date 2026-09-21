'use client';

import { IconPhone, IconWhatsapp } from './icons';
import { useI18n } from '@/i18n/I18nProvider';
import { telUrl, whatsappUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ListingKind } from '@/types';

/** Fire-and-forget so a slow beacon never delays opening WhatsApp or the dialler. */
function track(kind: ListingKind, listingId: string, eventType: 'whatsapp' | 'call') {
  const payload = JSON.stringify({ kind, listingId, eventType });
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
    return;
  }
  void fetch('/api/events', { method: 'POST', body: payload, keepalive: true });
}

export function ContactButtons({
  kind,
  listingId,
  title,
  phone,
  whatsapp,
  className,
  size = 'default',
}: {
  kind: ListingKind;
  listingId: string;
  title: string;
  phone: string;
  whatsapp: string | null;
  className?: string;
  size?: 'default' | 'large';
}) {
  const { t } = useI18n();
  const wa = whatsappUrl(whatsapp ?? phone, t('whatsapp.message', { title }));
  const tel = telUrl(phone);

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(kind, listingId, 'whatsapp')}
          className={cn(
            'btn bg-[#25D366] text-white hover:bg-[#1ebe5a]',
            size === 'large' && 'min-h-13 text-base',
          )}
        >
          <IconWhatsapp className="h-5 w-5" />
          {t('listing.whatsapp')}
        </a>
      )}
      {tel && (
        <a
          href={tel}
          onClick={() => track(kind, listingId, 'call')}
          className={cn(
            'btn btn-primary',
            size === 'large' && 'min-h-13 text-base',
            !wa && 'col-span-2',
          )}
        >
          <IconPhone className="h-5 w-5" />
          {t('listing.call')}
        </a>
      )}
    </div>
  );
}
