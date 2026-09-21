# Safeen Trucks

A marketplace for trucks, truck parts and dealer inventory in the Kurdistan Region and Iraq.
Kurdish, Arabic and English, mobile first, with WhatsApp and phone as the primary contact channel.

**Everything for Trucks. One Marketplace.**

---

## Quick start (Windows)

PowerShell blocks `npm.ps1` on many Windows machines. Use **`npm.cmd`** — it always works and needs
no policy change. (On macOS/Linux just use `npm`.)

```bash
npm.cmd install
```

```bash
copy .env.example .env.local
```

Open `.env.local` and paste your four values (see the table below), then:

```bash
npm.cmd run dev
```

Open http://localhost:3000 — you are redirected to `/en`, `/ku` or `/ar` based on your browser
language. Until Supabase is configured the site shows a short setup notice instead of the
marketplace; that is expected.

Full first-time sequence:

```bash
npm.cmd install
```

```bash
npm.cmd run seed
```

```bash
npm.cmd run test:rls
```

```bash
npm.cmd run dev
```

(Run the SQL migrations in the Supabase dashboard between `install` and `seed` — see **Database**.)

---

## Environment variables

Copy `.env.example` to `.env.local` and fill it in from **Supabase → Project Settings → API**.
Exactly four variables, one per line:

| Variable                               | Where it comes from                | Used by                              |
| -------------------------------------- | ---------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL                        | browser + server clients, image URLs |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key             | browser + server clients, RLS applies |
| `SUPABASE_SERVICE_ROLE_KEY`            | Secret / service-role key          | `seed` and `test:rls` scripts only   |
| `NEXT_PUBLIC_SITE_URL`                 | `http://localhost:3000` in dev      | canonical URLs, sitemap, OpenGraph   |

`.env.local` is git-ignored; `.env.example` is committed with placeholders only. The service-role
key bypasses every security policy — it must never be prefixed with `NEXT_PUBLIC_`, and it is never
imported by client code.

`npm.cmd run seed` and `npm.cmd run test:rls` load `.env.local` automatically via Node's native
`--env-file-if-exists`. No extra dependency, nothing to type by hand.

---

## Database

Migrations live in `supabase/migrations/` and must be applied **in filename order**:

| File                 | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| `0001_init.sql`      | tables, enums, indexes, RLS policies, storage bucket and policies          |
| `0002_taxonomy.sql`  | brands, models, truck types, part categories, Iraqi governorates           |
| `0003_guards.sql`    | column-level triggers: no self-featuring, self-publishing or self-verifying |

Easiest route: open the Supabase SQL editor, paste each file, run it. With the CLI instead:

```bash
supabase link --project-ref your-project-ref
```

```bash
supabase db push
```

Then seed demo content:

```bash
npm.cmd run seed
```

That creates three demo accounts (dealer, private seller, admin — the password is printed by the
script), one verified dealer, four trucks and two parts. It is idempotent: re-running updates the
same rows instead of duplicating them. Listings are seeded without photos; upload a few from the
Sell flow to see the cards in full.

To make your own account an admin, run in the SQL editor:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

---

## Commands

| Command                   | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `npm.cmd run dev`         | dev server on http://localhost:3000                              |
| `npm.cmd run build`       | production build                                                 |
| `npm.cmd start`           | serve the production build                                       |
| `npm.cmd test`            | unit tests (no database needed)                                  |
| `npm.cmd run typecheck`   | TypeScript, strict                                               |
| `npm.cmd run lint`        | ESLint                                                           |
| `npm.cmd run check`       | typecheck + lint + unit tests                                    |
| `npm.cmd run seed`        | demo data (needs the service-role key)                           |
| `npm.cmd run test:rls`    | security policy tests against your real project                  |

`npm.cmd test` runs on Node's built-in test runner with native TypeScript — no test framework
dependency. It covers scoring, filter parsing, listing validation, phone/WhatsApp link generation,
image upload rules and three-language key parity, and never touches the network.

`npm.cmd run test:rls` creates two throwaway users, asserts the security rules, then deletes them.
If credentials are missing or clearly invalid it prints `SKIPPED` with the reason and exits 0 — it
never pretends to have passed.

---

## Deploy

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and
   `NEXT_PUBLIC_SITE_URL` (your production domain). Add `SUPABASE_SERVICE_ROLE_KEY` only if you
   run the seed from CI.
4. In Supabase → Authentication → URL Configuration, add the production domain and
   `https://<domain>/auth/callback` as a redirect URL.

---

## Stack

| Layer     | Choice                                       |
| --------- | -------------------------------------------- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language  | TypeScript, strict                           |
| Styling   | Tailwind CSS v4                              |
| Data      | Supabase (Postgres + Auth + Storage)         |
| Hosting   | Vercel or any Node host                      |

Three runtime dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `zod`. No state library, no
UI kit, no icon package — components and icons are local.

## Project layout

```
src/
  app/[locale]/      routes; the locale layout owns <html lang dir>
  components/        shared UI (cards, filters, gallery, contact buttons, nav)
  features/          domain logic: trucks, parts, dealers, favorites, searches,
                     requests, reports, account, admin
  i18n/              locale config, dictionary loading, translator, provider
  lib/               env, supabase clients, auth, formatting, images, quality score, seo
  locales/           en.json, ku.json, ar.json — all visible copy
supabase/migrations/ schema, reference data, security triggers
scripts/             seed, RLS integration test, shared credential checks
tests/               unit tests
```

## How it works

**Languages.** Every route lives under `/en`, `/ku` or `/ar`. The locale layout sets `lang` and
`dir`, so Kurdish and Arabic render right to left without duplicated pages. All copy comes from
`src/locales/*.json`; a unit test fails if a key is missing from any language.

**Listing lifecycle.** `draft → pending → published`, plus `paused`, `sold`, `rejected`, `expired`.
Publishing submits for review; an admin approves, rejects with a reason, features or pauses.
Sellers can pause, resume, mark sold and delete their own listings — but cannot approve or feature
them, and the database enforces that even if someone calls the REST API directly.

**Listing quality.** A rule-based score out of 100 (no AI) from photos, price, mileage, specs,
description length and a WhatsApp number, with concrete suggestions in the publish step.

**Contact.** WhatsApp and Call are the primary actions, sticky at the bottom on mobile. Iraqi local
numbers are normalised to international form and the WhatsApp message is pre-filled in the buyer's
language. Clicks are recorded as anonymous `contact_events` so sellers see what works.

**Search.** Filters live in the URL, so a search can be shared or saved. Searches returning nothing
are recorded in `search_misses` and surfaced to admins as unmet demand.

**Security.** RLS is on for every table, and `0003_guards.sql` adds column-level triggers so a
seller cannot self-feature or skip moderation, a user cannot promote themselves to admin, and a
dealer cannot self-verify. Server actions re-check the caller's role. The service-role key is used
only by the two CLI scripts.

## Not in this version

AI search and pricing, auctions, 360° viewers, in-app payments or escrow, real-time chat, native
apps, and automated saved-search notifications. The schema leaves room for them; none are needed
for the marketplace to work.
