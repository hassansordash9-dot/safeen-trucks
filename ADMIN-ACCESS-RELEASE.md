# Safeen Trucks admin publication update

Prepared against GitHub main commit b2cc686. Source deployment is pending. The two requested account grants were applied through the authenticated production owner SQL editor on 2026-10-12 and independently verified after commit.

## Behavior

- Confirmed, enabled database admins exclusively create, edit, publish and delete truck/part listings.
- Publish goes directly live after image metadata saves successfully. A failed photo save leaves a new listing as a private draft. Existing sold listings stay sold when edited.
- Missing descriptions, missing photos, short titles and photo subject matter do not block admin publication. Quality scores remain advisory. File type, file size, array limits, valid identifiers and database constraints remain enforced.
- Anonymous visitors can browse/search published listings and see prices, public contact fields and attached photos. Existing sold detail pages remain visible. Drafts and their photos are restricted to enabled, confirmed admins.
- Application admins cannot grant roles through the public API. Role assignment uses privileged server-side administration only.

## Apply and verify

1. Back up the existing database and verify migration history against the production schema. Apply migrations 0004 and 0005 if missing, then 0006_verified_admin_publication.sql. Do not rerun the initial combined schema over an existing database.
2. Deploy this source with the existing public Supabase configuration. Coordinate the private bucket change with the new photo endpoint; older application versions use public bucket URLs and will lose photo access. Retain existing records and objects.
3. Purge any existing CDN/Next image caches that may contain formerly public draft photos. Changing the bucket policy cannot retract previously downloaded copies.
4. The two requested grants have already been applied using a separately retained owner-only administration script. For future grants, inspect Auth records and use privileged owner administration; do not expose a role-grant RPC to application clients. The transaction requires exactly one confirmed, enabled Auth account and enabled profile for each exact email. It aborts both grants if either account fails verification; it never creates accounts or confirms emails.
5. Run npm run test:admin-access with project-scoped server credentials provided securely to the process. It creates and removes its own temporary fixtures, checks both trucks and parts, role escalation, private/public photo downloads, anonymous access, and suspended/unconfirmed admin denial. Run against a staging project first. The test exits unsuccessfully if credentials are missing.
6. Verify in production: both named accounts can publish without a description or photos; a signed-out visitor can search/view the result and contact links; a draft listing and photo URL are denied; a normal account cannot write or grant roles. Verify delete on disposable test listings only.

## Limits

Production identity checks and role grants are complete: Both exact requested accounts each have a confirmed, enabled Auth identity and an active admin profile. RLS remains enabled on the inspected marketplace tables and storage objects. Migration 0006 and the source release have NOT been applied. The publishing fix and draft-photo protections have not been verified live. Local validation passed: 31 tests, TypeScript checks, and a production build. Live integration tests remain unrun. Shell-based GitHub synchronization was unavailable. The authenticated GitHub web workflow is being used to prepare a release branch. Do not change the production bucket to private until compatible source is deployed. Existing live edits and image saves still use multiple requests: failure may partially save edits, though a new draft cannot publish until its photos save. An atomic database save would be a separate reliability improvement.

Rollback must preserve the tightened access policies and private photo bucket; deploy a compatible prior application only after adapting its photo URLs. Reverting the bucket to public would expose drafts again.


