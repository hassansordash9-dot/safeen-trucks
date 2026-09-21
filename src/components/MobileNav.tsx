'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHeart, IconHome, IconPlus, IconSearch, IconUser } from './icons';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

type Labels = { home: string; search: string; sell: string; saved: string; account: string };

export function MobileNav({ locale, labels }: { locale: Locale; labels: Labels }) {
  const pathname = usePathname();
  const items = [
    { href: routes.home(locale), label: labels.home, Icon: IconHome, exact: true },
    { href: routes.trucks(locale), label: labels.search, Icon: IconSearch },
    { href: routes.sell(locale), label: labels.sell, Icon: IconPlus, accent: true },
    { href: routes.saved(locale), label: labels.saved, Icon: IconHeart },
    { href: routes.account(locale), label: labels.account, Icon: IconUser },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-gold)]/25 bg-[var(--color-black)] md:hidden"
      aria-label={labels.home}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon, accent, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  active ? 'text-[var(--color-gold)]' : 'text-white/60',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-md',
                    accent && 'bg-[var(--color-gold)] text-[var(--color-fixed-dark)]',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
