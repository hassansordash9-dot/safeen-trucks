'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Desktop nav with a gold underline on the section you are in. */
export function HeaderNav({
  links,
  label,
}: {
  links: Array<{ href: string; label: string }>;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="ms-6 hidden items-center gap-1 md:flex" aria-label={label}>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-white/5 text-[var(--color-gold)]'
                : 'text-white/80 hover:bg-white/5 hover:text-white',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
