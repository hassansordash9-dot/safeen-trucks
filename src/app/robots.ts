import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Resolved per request so the sitemap URL always matches the live domain.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/account', '/admin', '/api', '/auth'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
