import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ContactButtons } from '@/components/ContactButtons';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ShareButton } from '@/components/ShareButton';
import { ReportDialog } from '@/components/ReportDialog';
import { PartCard } from '@/components/PartCard';
import { Badge, SectionHeader, SpecRow, VerifiedBadge } from '@/components/ui';
import { IconStore } from '@/components/icons';
import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';
import { getPartBySlug, getSimilarParts } from '@/features/parts/queries';
import { getFavoriteIds } from '@/features/favorites/queries';
import { registerView } from '@/features/trucks/views';
import { findCategoryBySlug } from '@/lib/reference';
import { formatMonthYear, formatPrice, localisedName } from '@/lib/format';
import { primaryImage } from '@/lib/images';
import { absoluteUrl, localeAlternates } from '@/lib/seo';
import { routes } from '@/lib/routes';
import CategoryLanding from './category-landing';

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = createTranslator(await getDictionary(locale));

  const category = await findCategoryBySlug(slug);
  if (category) {
    return {
      title: `${localisedName(category, locale)} — ${t('nav.parts')}`,
      alternates: localeAlternates(locale, `truck-parts/${slug}`),
    };
  }

  const part = await getPartBySlug(slug);
  if (!part || part.status !== 'published') return { title: t('errors.notFound') };

  const image = primaryImage(part.images);
  const description = part.description?.slice(0, 160) ?? t('home.heroSubtitle');

  return {
    title: part.title,
    description,
    alternates: localeAlternates(locale, `truck-parts/${slug}`),
    openGraph: {
      type: 'website',
      title: part.title,
      description,
      url: absoluteUrl(routes.part(locale, slug)),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PartDetailPage({ params, searchParams }: Props) {
  const [{ locale, slug }, rawParams] = await Promise.all([params, searchParams]);

  const category = await findCategoryBySlug(slug);
  if (category) {
    return <CategoryLanding locale={locale} category={category} searchParams={rawParams} />;
  }

  const t = createTranslator(await getDictionary(locale));
  const part = await getPartBySlug(slug);
  if (!part) notFound();
  if (part.status !== 'published' && part.status !== 'sold') notFound();

  const [similar, favorites] = await Promise.all([getSimilarParts(part), getFavoriteIds('part')]);
  await registerView('part', part.id);

  const specs = [
    { label: t('part.category'), value: localisedName(part.category, locale) },
    { label: t('part.partBrand'), value: part.brand },
    { label: t('part.partNumber'), value: part.part_number },
    { label: t('part.oemNumber'), value: part.oem_number },
    { label: t('part.condition'), value: t(`condition.${part.condition}`) },
    { label: t('filters.partType'), value: part.part_type ? t(`partType.${part.part_type}`) : null },
    {
      label: t('part.compatibility'),
      value: [part.compatible_brand?.name, part.compatible_models?.join(', ')]
        .filter(Boolean)
        .join(' · '),
    },
  ];

  return (
    <div className="container-page py-6">
      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href={routes.parts(locale)} className="hover:underline">
          {t('nav.parts')}
        </Link>
        {part.category && (
          <>
            {' · '}
            <Link
              href={routes.partCategory(locale, part.category.slug)}
              className="hover:underline"
            >
              {localisedName(part.category, locale)}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <PhotoGallery images={part.images ?? []} title={part.title} />

          <header>
            <div className="flex flex-wrap items-center gap-2">
              {part.featured && <Badge tone="accent">{t('listing.featured')}</Badge>}
              <Badge>{t(`condition.${part.condition}`)}</Badge>
              {part.status === 'sold' && <Badge tone="dark">{t('status.sold')}</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{part.title}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {localisedName(part.location, locale)} · {t('listing.postedOn')}{' '}
              {formatMonthYear(part.published_at, locale)}
            </p>
          </header>

          <section className="card p-4">
            <h2 className="mb-2 text-base font-bold text-[var(--color-text)]">
              {t('listing.specs')}
            </h2>
            <dl className="sm:grid sm:grid-cols-2 sm:gap-x-8">
              {specs.map((spec) => (
                <SpecRow key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </dl>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 text-base font-bold text-[var(--color-text)]">
              {t('listing.description')}
            </h2>
            <p className="text-sm whitespace-pre-line">
              {part.description?.trim() || t('listing.noDescription')}
            </p>
          </section>

          <ReportDialog kind="part" listingId={part.id} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <p className="text-2xl font-extrabold text-[var(--color-text)]">
              {formatPrice(part.price, part.currency, locale)}
            </p>
            {part.negotiable && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{t('listing.negotiable')}</p>
            )}

            <div className="mt-3 flex gap-2">
              <FavoriteButton
                kind="part"
                listingId={part.id}
                initial={favorites.has(part.id)}
                variant="inline"
              />
              <ShareButton title={part.title} />
            </div>

            <div className="mt-4 hidden lg:block">
              <ContactButtons
                kind="part"
                listingId={part.id}
                title={part.title}
                phone={part.phone}
                whatsapp={part.whatsapp}
              />
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-base font-bold text-[var(--color-text)]">
              {t('listing.seller')}
            </h2>
            {part.dealer ? (
              <Link
                href={routes.dealer(locale, part.dealer.slug)}
                className="flex items-center gap-3 hover:underline"
              >
                <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--color-surface)]">
                  <IconStore className="h-5 w-5 text-[var(--color-muted)]" />
                </span>
                <span>
                  <span className="block font-semibold text-[var(--color-text)]">
                    {part.dealer.business_name}
                  </span>
                  {part.dealer.verified && <VerifiedBadge label={t('dealer.verifiedDealer')} />}
                </span>
              </Link>
            ) : (
              <p className="font-semibold text-[var(--color-text)]">
                {part.seller?.full_name ?? t('listing.seller')}
              </p>
            )}
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t('listing.memberSince')} {formatMonthYear(part.seller?.created_at, locale)}
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <SectionHeader title={t('listing.similar')} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {similar.map((item) => (
              <PartCard
                key={item.id}
                part={item}
                locale={locale}
                favorited={favorites.has(item.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-20 border-t border-[var(--color-line)] bg-[var(--color-card)] p-2 lg:hidden">
        <ContactButtons
          kind="part"
          listingId={part.id}
          title={part.title}
          phone={part.phone}
          whatsapp={part.whatsapp}
          size="large"
        />
      </div>
    </div>
  );
}
