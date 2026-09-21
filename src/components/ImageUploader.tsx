'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { IconClose, IconPlus } from './icons';
import { useI18n } from '@/i18n/I18nProvider';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/compress';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES,
  imageUrl,
  storagePath,
  validateImageFile,
} from '@/lib/images';
import { cn } from '@/lib/utils';

export type UploadedImage = { path: string; isPrimary: boolean };

export function ImageUploader({
  userId,
  kind,
  images,
  onChange,
}: {
  userId: string;
  kind: 'truck' | 'part';
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(t('sell.maxPhotos'));
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const added: UploadedImage[] = [];

    for (const original of Array.from(fileList).slice(0, room)) {
      const file = await compressImage(original);
      const problem = validateImageFile(file);
      if (problem) {
        setError(t(`errors.${problem}`));
        continue;
      }

      const path = storagePath(userId, kind, file.name);
      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(t('errors.uploadFailed'));
        continue;
      }
      added.push({ path, isPrimary: false });
    }

    setBusy(false);
    if (!added.length) return;

    const next = [...images, ...added];
    if (!next.some((image) => image.isPrimary)) next[0].isPrimary = true;
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(path: string) {
    const next = images.filter((image) => image.path !== path);
    if (next.length && !next.some((image) => image.isPrimary)) next[0].isPrimary = true;
    onChange(next);
  }

  function setPrimary(path: string) {
    onChange(images.map((image) => ({ ...image, isPrimary: image.path === path })));
  }

  return (
    <div>
      <p className="mb-3 text-sm text-[var(--color-muted)]">{t('sell.photosHint')}</p>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((image) => (
          <li
            key={image.path}
            className={cn(
              'relative aspect-square overflow-hidden rounded-md border-2',
              image.isPrimary ? 'border-[var(--color-gold)]' : 'border-[var(--color-line)]',
            )}
          >
            <Image
              src={imageUrl(image.path) ?? ''}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => remove(image.path)}
              aria-label={t('common.remove')}
              className="absolute end-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-[var(--color-card)]/90 text-[var(--color-bad)]"
            >
              <IconClose className="h-4 w-4" />
            </button>
            {image.isPrimary ? (
              <span className="absolute inset-x-0 bottom-0 bg-[var(--color-gold)] py-0.5 text-center text-[11px] font-semibold text-[var(--color-fixed-dark)]">
                {t('sell.mainPhoto')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPrimary(image.path)}
                className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-[11px] text-white"
              >
                {t('sell.setMain')}
              </button>
            )}
          </li>
        ))}

        {images.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[var(--color-line)] text-sm text-[var(--color-muted)] hover:border-[var(--color-charcoal-3)]"
            >
              <IconPlus />
              {busy ? t('sell.uploading') : t('sell.addPhotos')}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--color-bad)]">
          {error}
        </p>
      )}
    </div>
  );
}
