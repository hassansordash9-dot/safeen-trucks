export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** URL-safe slug that keeps Latin/digits only, so listing URLs stay readable and stable. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function shortId(length = 6): string {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function listingSlug(parts: Array<string | number | null | undefined>): string {
  const base = slugify(parts.filter(Boolean).join(' ')) || 'listing';
  return `${base}-${shortId()}`;
}

/** Iraqi numbers: 0750… -> 964750…; anything already international is kept. */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `964${digits.slice(1)}`;
  if (digits.startsWith('964')) return digits;
  return digits;
}

export function whatsappUrl(phone: string | null | undefined, message: string): string | null {
  const number = normalisePhone(phone);
  if (!number || number.length < 8) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function telUrl(phone: string | null | undefined): string | null {
  const number = normalisePhone(phone);
  return number ? `tel:+${number}` : null;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
