'use client';

import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function WizardShell({
  step,
  steps,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  children,
  error,
}: {
  step: number;
  steps: string[];
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: React.ReactNode;
  error?: string | null;
}) {
  const { t } = useI18n();

  return (
    <div>
      <ol className="hide-scrollbar mb-5 flex gap-1 overflow-x-auto" aria-label={t('sell.title')}>
        {steps.map((label, index) => (
          <li key={label} className="min-w-0 flex-1">
            <div
              aria-current={index === step ? 'step' : undefined}
              className={cn(
                'border-t-4 pt-2 text-xs font-medium whitespace-nowrap',
                index <= step
                  ? 'border-[var(--color-gold)] text-[var(--color-text)]'
                  : 'border-[var(--color-line)] text-[var(--color-muted)]',
              )}
            >
              {label}
            </div>
          </li>
        ))}
      </ol>

      <div className="card p-4 sm:p-5">{children}</div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--color-bad)]">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={onBack} className="btn btn-outline">
            {t('common.back')}
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn btn-primary flex-1"
        >
          {nextLabel ?? t('common.next')}
        </button>
      </div>
    </div>
  );
}

export function QualityMeter({ score, suggestions }: { score: number; suggestions: string[] }) {
  const { t } = useI18n();
  const tone = score >= 80 ? 'var(--color-ok)' : score >= 55 ? 'var(--color-warn)' : 'var(--color-bad)';

  return (
    <section className="card p-4">
      <p className="font-semibold text-[var(--color-text)]">
        {t('sell.qualityScore', { score })}
      </p>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface)]"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: tone }} />
      </div>

      {suggestions.length > 0 && (
        <>
          <p className="mt-3 text-sm font-medium">{t('sell.improve')}</p>
          <ul className="mt-1 list-disc space-y-1 ps-5 text-sm text-[var(--color-muted)]">
            {suggestions.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
