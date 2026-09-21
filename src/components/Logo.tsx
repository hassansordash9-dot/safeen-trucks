import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/**
 * Brand lockup: the Safeen emblem plus a legible wordmark. The emblem artwork
 * lives at /public/safeen-logo.jpg — replace that file to change the logo.
 * Its background is black, so it sits flush on the dark header and footer.
 */
export function Logo({
  locale,
  compact = false,
  tone = 'dark',
}: {
  locale: Locale;
  compact?: boolean;
  tone?: 'dark' | 'light';
}) {
  const onDark = tone === 'light';

  return (
    <Link
      href={`/${locale}`}
      className="flex shrink-0 items-center gap-2.5"
      aria-label="Safeen Trucks"
    >
      <span
        className={cn(
          'relative block h-10 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--color-black)] sm:h-12 sm:w-[4.8rem]',
          !onDark && 'ring-1 ring-black/10',
        )}
      >
        {/* The source art is the full lockup. This window frames just the ST emblem —
            the wordmark below it in the artwork is set in type beside the badge instead.
            The box is 1.6:1 so the emblem fits without clipping. */}
        <span className="absolute -top-[19%] -left-[22%] h-[230%] w-[144%]">
          <Image
            src="/safeen-logo.jpg"
            alt=""
            fill
            priority
            sizes="128px"
            className="object-cover"
          />
        </span>
      </span>

      {!compact && (
        <span
          className={cn(
            'text-base leading-none font-extrabold tracking-tight sm:text-lg',
            onDark ? 'text-white' : 'text-[var(--color-text)]',
          )}
        >
          SAFEEN
          <span className={onDark ? 'text-[var(--color-gold)]' : 'text-[var(--color-gold-dark)]'}>
            {' '}
            TRUCKS
          </span>
        </span>
      )}
    </Link>
  );
}
