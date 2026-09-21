import { getDictionary } from '@/i18n/dictionary';
import { createTranslator } from '@/i18n/translate';
import type { Locale } from '@/i18n/config';

/** Shared shell for the static about/help/privacy/terms/contact pages. */
export async function LegalPage({
  locale,
  titleKey,
  sections,
}: {
  locale: Locale;
  titleKey: string;
  sections: Array<{ headingKey?: string; bodyKey: string }>;
}) {
  const t = createTranslator(await getDictionary(locale));

  return (
    <article className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t(titleKey)}</h1>
      <div className="mt-5 space-y-5">
        {sections.map((section) => (
          <section key={section.bodyKey}>
            {section.headingKey && (
              <h2 className="mb-1 font-bold text-[var(--color-text)]">{t(section.headingKey)}</h2>
            )}
            <p className="text-[var(--color-text)]">{t(section.bodyKey)}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
