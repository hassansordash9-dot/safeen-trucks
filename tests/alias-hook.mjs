import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Resolves the "@/..." TypeScript path alias so tests can run on plain Node. */
export function resolve(specifier, context, next) {
  if (!specifier.startsWith('@/')) return next(specifier, context);

  const base = resolvePath(process.cwd(), 'src', specifier.slice(2));
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
  }
  return next(specifier, context);
}
