import { SUPABASE_URL } from '@/lib/env';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 12;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const LISTINGS_BUCKET = 'listings';

/** Public URL for a stored listing image. Paths are `<userId>/<kind>/<uuid>.<ext>`. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${LISTINGS_BUCKET}/${path}`;
}

export function primaryImage(images: Array<{ path: string; is_primary: boolean }> | undefined) {
  if (!images?.length) return null;
  return imageUrl((images.find((i) => i.is_primary) ?? images[0]).path);
}

export function storagePath(userId: string, kind: 'truck' | 'part', fileName: string): string {
  const ext = (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${userId}/${kind}/${crypto.randomUUID()}.${ext || 'jpg'}`;
}

export function validateImageFile(file: File): 'fileTooLarge' | 'fileType' | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'fileType';
  if (file.size > MAX_IMAGE_BYTES) return 'fileTooLarge';
  return null;
}
