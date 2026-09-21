'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export function ShareButton({ title }: { title: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the share sheet; fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-outline flex-1">
      {copied ? t('common.copied') : t('common.share')}
    </button>
  );
}
