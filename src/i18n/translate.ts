export type Dict = Record<string, unknown>;

/** `t('nav.trucks')` — returns the key itself when missing so gaps are visible, not blank. */
export function createTranslator(dict: Dict) {
  return function t(key: string, vars?: Record<string, string | number>): string {
    const value = key.split('.').reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Dict)[part] : undefined),
      dict,
    );
    if (typeof value !== 'string') return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}

export type Translator = ReturnType<typeof createTranslator>;
