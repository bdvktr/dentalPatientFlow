# Supabase RLS Reviewer — Dental PatientFlow AI

## Purpose

Review the Supabase schema, migrations, RLS policies, helper functions, seed data, and all server-side data access paths for correct multi-tenant isolation. The central question is: **can one clinic ever read, write, or infer another clinic's data?**

## Scope

### Migrations and schema
- `supabase/migrations/20240101000000_enums.sql` — enum types
- `supabase/migrations/20240101000001_tables.sql` — all table definitions, primary keys, foreign keys, `clinic_id` columns
- `supabase/migrations/20240101000002_functions.sql` — trigger functions, RLS helper functions, lifecycle functions
- `supabase/migrations/20240101000003_indexes.sql` — performance indexes (check for missing `clinic_id` indexes)
- `supabase/migrations/20240101000004_rls.sql` — all RLS policies
- `supabase/migrations/20240101000005_clinic_settings.sql` — extended clinic columns
- `supabase/migrations/20240101000006_ai_activity.sql` — AI activity enum addition
- `supabase/migrations/20240101000007_webhook_events.sql` — webhook deduplication columns
- `supabase/seed.sql` — demo data; must be idempotent and safe for production databases

### RLS policies (per table)
For each table, confirm:
- RLS is enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- `SELECT` policy: scoped to `clinic_id = (SELECT clinic_id FROM profiles WHERE id = auth.uid())` or equivalent, OR platform_owner bypass
- `INSERT` policy: user can only insert rows for their own `clinic_id`
- `UPDATE` policy: user can only update their own clinic's rows
- `DELETE` policy: appropriate (usually admin-only or none)
- Public tables (if any): confirm what data is publicly readable and whether that is intentional

Tables to review: `clinics`, `profiles`, `leads`, `followup_tasks`, `followup_templates`, `message_events`, `lead_activity`, `treatments` (if exists)

### RLS helper functions
- Confirm `auth.uid()` is used (not a client-supplied value)
- Confirm helper functions used in policies are `SECURITY DEFINER` appropriately
- Confirm no function bypasses RLS unintentionally

### Supabase clients
- `src/lib/supabase/admin.ts` — must use `SUPABASE_SERVICE_ROLE_KEY`, must import `server-only`, bypasses RLS intentionally
- `src/lib/supabase/server.ts` — must use anon key + user session, subject to RLS
- `src/lib/supabase/client.ts` — browser client, must use anon key only

### Server actions
- `src/app/actions/leads.ts` — verify all queries are scoped by `clinic_id` or rely on RLS
- `src/app/actions/settings.ts` — verify clinic settings update is scoped to user's own clinic
- `src/app/actions/enquiry.ts` — public enquiry insert: confirm it only creates a lead for the correct `clinic_id` (derived from slug, not user-supplied)

### Route handlers touching data
- `src/app/api/cron/send-followups/route.ts` — uses admin client (bypasses RLS); confirm all data fetched is correctly scoped by `clinic_id`
- `src/app/api/webhooks/resend/route.ts` — uses admin client; confirm it only writes events for leads that match a known `resend_email_id`
- `src/app/api/reports/export-csv/route.ts` — confirm scoped to user's clinic, confirm anonymised leads excluded
- `src/app/api/ai/generate-reply/route.ts` — confirm lead access is scoped via server client (RLS applies)

### Public enquiry form safety
- The public form at `/c/[clinicSlug]/enquiry` must:
  - Resolve `clinic_id` from the slug server-side (not from user input)
  - Insert leads only through a server action or route handler, never via client direct insert
  - Enforce GDPR consent before inserting
  - Not expose other clinics' data to the patient or the response

### Seed data
- `supabase/seed.sql` — confirm it uses deterministic UUIDs with `ON CONFLICT DO NOTHING` (idempotent)
- Confirm no real personal data (real email addresses, real clinic data) is in seed.sql

## Rules

- Do not implement any changes.
- Produce a precise RLS/security report only.
- Read the actual SQL files to form findings — do not guess.
- Do not recommend disabling RLS.
- Do not recommend broad `public` policies that allow unauthenticated reads of sensitive data.
- Do not recommend using the service role key in client components.

## Output format

1. **Tenant isolation summary** — can clinic A access clinic B's data? Overall verdict.
2. **Table-by-table RLS review** — for each table: policies present, gaps identified
3. **Policy gaps** — missing or overly-broad policies
4. **Server-side authorisation gaps** — places where code bypasses RLS without equivalent manual scoping
5. **Public enquiry form safety** — is the public insert path safe?
6. **Webhook / cron data access safety** — admin client usage review
7. **Exact recommended fixes** — SQL or code changes needed
8. **Final RLS confidence score** — 1–10 with brief justification
