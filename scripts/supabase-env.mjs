/**
 * Shared credential check for the CLI scripts.
 * Never prints a key — only whether it is present and plausibly shaped.
 */

export const EXIT_MISCONFIGURED = 78; // EX_CONFIG

const HINT = 'Fill in .env.local (copy .env.example) and run the command again.';

function problemsWith({ url, publishableKey, serviceKey, needsPublishable }) {
  const problems = [];

  if (!url) problems.push('NEXT_PUBLIC_SUPABASE_URL is missing.');
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url.trim())) {
    problems.push(
      `NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase project URL (expected https://<project-ref>.supabase.co, got "${url.slice(0, 40)}").`,
    );
  }

  if (needsPublishable) {
    if (!publishableKey) problems.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.');
    else if (publishableKey.length < 30) {
      problems.push(
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks truncated (${publishableKey.length} characters).`,
      );
    }
  }

  if (!serviceKey) problems.push('SUPABASE_SERVICE_ROLE_KEY is missing.');
  else if (serviceKey.length < 30) {
    problems.push(
      `SUPABASE_SERVICE_ROLE_KEY looks like a placeholder (${serviceKey.length} characters). Use the secret/service-role key from Supabase -> Project Settings -> API.`,
    );
  }

  return problems;
}

/**
 * Returns the credentials, or exits with a short actionable message.
 * `softExit` makes a misconfiguration exit 0 so CI and `npm run check` do not fail
 * just because nobody has pasted real keys yet.
 */
export function readSupabaseEnv({ needsPublishable = true, softExit = false, task = 'This script' } = {}) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

  const problems = problemsWith({ url, publishableKey, serviceKey, needsPublishable });
  if (problems.length === 0) return { url, publishableKey, serviceKey };

  console.error(`\n${task} needs live Supabase credentials. SKIPPED.\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\n${HINT}\n`);
  process.exit(softExit ? 0 : EXIT_MISCONFIGURED);
}

/** Turns a Supabase error into one readable line instead of a stack trace. */
export function describe(error) {
  if (!error) return 'unknown error';
  const status = error.status ?? error.statusCode;
  const message = error.message ?? String(error);
  if (status === 401 || /invalid api key|jwt/i.test(message)) {
    return `${message} — the SUPABASE_SERVICE_ROLE_KEY in .env.local is not accepted by this project.`;
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return `${message} — could not reach the project URL. Check NEXT_PUBLIC_SUPABASE_URL and your connection.`;
  }
  return status ? `${message} (status ${status})` : message;
}

/** Exits cleanly on a configuration/credential failure, loudly on a real bug. */
export function fail(context, error) {
  console.error(`\n${context}: ${describe(error)}\n`);
  process.exit(EXIT_MISCONFIGURED);
}
