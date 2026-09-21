import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import { isLocale } from '@/i18n/config';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale);
  const t = createTranslator(await getDictionary(locale));

  const links = [
    { href: `/${locale}/admin`, label: t('admin.overview') },
    { href: `/${locale}/admin/listings`, label: t('admin.listings') },
    { href: `/${locale}/admin/reports`, label: t('admin.reports') },
    { href: `/${locale}/admin/verifications`, label: t('admin.verifications') },
    { href: `/${locale}/admin/dealers`, label: t('admin.dealers') },
    { href: `/${locale}/admin/users`, label: t('admin.users') },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('admin.title')}</h1>

      <nav className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="btn btn-outline whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
