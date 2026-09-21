/** Shown when Supabase environment variables are missing, instead of a stack trace. */
export function SetupNotice() {
  return (
    <main className="container-page max-w-2xl py-16">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Safeen Trucks — setup</h1>
      <p className="mt-3 text-[var(--color-muted)]">
        The app is running, but it is not connected to Supabase yet.
      </p>
      <ol className="mt-5 list-decimal space-y-2 ps-5 text-sm">
        <li>Create a Supabase project.</li>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code> and paste the project URL,
          publishable key and service-role key.
        </li>
        <li>
          Run <code>supabase/migrations/0001_init.sql</code>, <code>0002_taxonomy.sql</code> and{' '}
          <code>0003_guards.sql</code> in the Supabase SQL editor, in that order.
        </li>
        <li>
          Run <code>npm.cmd run seed</code>, then restart the dev server.
        </li>
      </ol>
    </main>
  );
}
