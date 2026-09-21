'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  deleteListingAsAdmin,
  moderateListing,
  resolveReport,
  reviewVerification,
  setDealerVerified,
  setListingFeatured,
  setUserStatus,
} from './actions';
import type { ListingKind, ListingStatus, UserStatus } from '@/types';

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<unknown>) =>
    startTransition(async () => {
      await action();
      router.refresh();
    });
  return { pending, run };
}

const smallButton = 'btn h-9 min-h-9 px-3 text-xs';

export function ListingModeration({
  kind,
  id,
  status,
  featured,
}: {
  kind: ListingKind;
  id: string;
  status: ListingStatus;
  featured: boolean;
}) {
  const { t } = useI18n();
  const { pending, run } = useAction();
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {status !== 'published' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => moderateListing({ kind, id, status: 'published' }))}
          className={`${smallButton} btn-primary`}
        >
          {t('admin.approve')}
        </button>
      )}

      {status !== 'rejected' && !rejecting && (
        <button
          type="button"
          disabled={pending}
          onClick={() => setRejecting(true)}
          className={`${smallButton} btn-outline`}
        >
          {t('admin.reject')}
        </button>
      )}

      {rejecting && (
        <span className="flex w-full items-center gap-2">
          <input
            className="field h-9 py-1 text-sm"
            placeholder={t('admin.reasonPlaceholder')}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await moderateListing({ kind, id, status: 'rejected', reason });
                setRejecting(false);
              })
            }
            className={`${smallButton} btn-primary`}
          >
            {t('common.submit')}
          </button>
        </span>
      )}

      {status === 'published' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => moderateListing({ kind, id, status: 'paused' }))}
          className={`${smallButton} btn-outline`}
        >
          {t('admin.pause')}
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setListingFeatured(kind, id, !featured))}
        className={`${smallButton} ${featured ? 'btn-accent' : 'btn-outline'}`}
      >
        {featured ? t('admin.unfeature') : t('admin.feature')}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t('account.confirmDelete'))) run(() => deleteListingAsAdmin(kind, id));
        }}
        className={`${smallButton} text-[var(--color-bad)] hover:bg-[var(--color-bad-soft)]`}
      >
        {t('common.delete')}
      </button>
    </div>
  );
}

export function UserControls({ userId, status }: { userId: string; status: UserStatus }) {
  const { t } = useI18n();
  const { pending, run } = useAction();

  const options: Array<{ value: UserStatus; label: string }> = [
    { value: 'active', label: t('admin.activate') },
    { value: 'warned', label: t('admin.warn') },
    { value: 'suspended', label: t('admin.suspend') },
    { value: 'banned', label: t('admin.ban') },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options
        .filter((option) => option.value !== status)
        .map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending}
            onClick={() => run(() => setUserStatus(userId, option.value))}
            className={`${smallButton} btn-outline`}
          >
            {option.label}
          </button>
        ))}
    </div>
  );
}

export function DealerControls({ dealerId, verified }: { dealerId: string; verified: boolean }) {
  const { t } = useI18n();
  const { pending, run } = useAction();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(() => setDealerVerified(dealerId, !verified))}
      className={`${smallButton} ${verified ? 'btn-outline' : 'btn-primary'}`}
    >
      {verified ? t('admin.removeVerification') : t('admin.verify')}
    </button>
  );
}

export function VerificationControls({ id }: { id: string }) {
  const { t } = useI18n();
  const { pending, run } = useAction();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => reviewVerification(id, 'approved'))}
        className={`${smallButton} btn-primary`}
      >
        {t('admin.approve')}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => reviewVerification(id, 'rejected'))}
        className={`${smallButton} btn-outline`}
      >
        {t('admin.reject')}
      </button>
    </div>
  );
}

export function ReportControls({ id }: { id: string }) {
  const { t } = useI18n();
  const { pending, run } = useAction();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveReport(id, 'resolved'))}
        className={`${smallButton} btn-primary`}
      >
        {t('admin.resolve')}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resolveReport(id, 'dismissed'))}
        className={`${smallButton} btn-outline`}
      >
        {t('admin.dismiss')}
      </button>
    </div>
  );
}
