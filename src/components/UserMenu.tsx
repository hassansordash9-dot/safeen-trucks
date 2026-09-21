'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconUser } from './icons';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { UserRole } from '@/types';

type Labels = {
  account: string;
  login: string;
  logout: string;
  register: string;
  dashboard: string;
  saved: string;
  admin: string;
};

export function UserMenu({
  locale,
  name,
  role,
  labels,
  onDark = false,
}: {
  locale: Locale;
  name: string | null;
  role: UserRole | null;
  labels: Labels;
  onDark?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!name) {
    return (
      <Link href={routes.login(locale)} className={cn('btn px-2.5', onDark ? 'btn-ghost-dark' : 'btn-ghost')}>
        <IconUser />
        <span className="hidden text-sm sm:inline">{labels.login}</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('btn px-2.5', onDark ? 'btn-ghost-dark' : 'btn-ghost')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconUser />
        <span className="hidden max-w-28 truncate text-sm sm:inline">{name}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="card absolute end-0 z-40 mt-1 w-52 overflow-hidden py-1 shadow-lg" role="menu">
            <MenuLink href={routes.account(locale)} onClick={() => setOpen(false)}>
              {labels.account}
            </MenuLink>
            <MenuLink href={routes.accountListings(locale)} onClick={() => setOpen(false)}>
              {labels.dashboard}
            </MenuLink>
            <MenuLink href={routes.saved(locale)} onClick={() => setOpen(false)}>
              {labels.saved}
            </MenuLink>
            {role === 'admin' && (
              <MenuLink href={routes.admin(locale)} onClick={() => setOpen(false)}>
                {labels.admin}
              </MenuLink>
            )}
            <form action="/auth/signout" method="post" className="border-t border-[var(--color-line)]">
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="w-full px-3 py-2.5 text-start text-sm text-[var(--color-bad)] hover:bg-[var(--color-surface)]"
              >
                {labels.logout}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-3 py-2.5 text-sm hover:bg-[var(--color-surface)]"
    >
      {children}
    </Link>
  );
}
