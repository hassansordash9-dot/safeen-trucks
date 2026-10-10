import { redirect } from 'next/navigation';
import { requireUser, canSell } from '@/lib/auth';
export const metadata = { robots: { index: false, follow: false } };
export default async function SellLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireUser(locale, '/' + locale + '/sell');
  if (!canSell(user.profile)) redirect('/' + locale + '/account');
  return children;
}
