import Link from 'next/link';
import { CATEGORY_BACKDROP, CategoryIcon, TRUCK_BACKDROP } from './CategoryIcon';

/** Icon-led category tile, so the category is recognisable without reading. */
export function CategoryCard({
  href,
  label,
  slug,
  kind,
}: {
  href: string;
  label: string;
  slug: string;
  kind: 'truck' | 'part';
}) {
  return (
    <Link
      href={href}
      className="card flex h-full flex-col items-center gap-2 p-2 text-center transition-shadow hover:border-[var(--color-gold)] hover:shadow-md"
    >
      <span
        className={`grid aspect-square w-full place-items-center overflow-hidden rounded-md ${kind === 'truck' ? TRUCK_BACKDROP : CATEGORY_BACKDROP}`}
      >
        <CategoryIcon slug={slug} kind={kind} className="h-4/5 w-4/5" />
      </span>
      <span className="pb-1 text-sm leading-tight font-medium text-[var(--color-text)]">
        {label}
      </span>
    </Link>
  );
}
