'use client';

import { useState } from 'react';
import { IconClose, IconFilter } from './icons';
import { useI18n } from '@/i18n/I18nProvider';

/** One filter form: inline sidebar on desktop, full-screen sheet on mobile. */
export function FilterShell({
  children,
  activeCount,
}: {
  children: React.ReactNode;
  activeCount: number;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-outline w-full lg:hidden"
        aria-expanded={open}
      >
        <IconFilter className="h-4 w-4" />
        {t('filters.title')}
        {activeCount > 0 && (
          <span className="rounded-full bg-[var(--color-black)] px-2 text-xs text-white">
            {activeCount}
          </span>
        )}
      </button>

      {!open && <div className="hidden lg:block">{children}</div>}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-card)] lg:hidden">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-line)] px-4">
            <h2 className="font-semibold">{t('filters.title')}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost px-2"
              aria-label={t('common.close')}
            >
              <IconClose />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4" onSubmitCapture={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
