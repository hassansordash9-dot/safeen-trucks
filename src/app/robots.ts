import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { siteUrl } from '@/lib/seo';

// Resolved per request so the sitemap URL always matches the live domain.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api', '/auth', ...locales.flatMap(locale => ['account', 'admin', 'sell', 'login', 'register', 'saved', 'forgot-password', 'reset-password'].map(page => `/${locale}/${page}`))] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
