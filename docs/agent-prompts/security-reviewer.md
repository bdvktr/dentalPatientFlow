# Security Reviewer — Dental PatientFlow AI

## Purpose

Review the app for security, production safety, auth mistakes, exposed secrets, unsafe cron/webhook behaviour, AI safety issues, and risky deployment settings. This is a pre-external-demo review — the goal is to confirm the app is safe to show to UK/Ireland private dental clinic owners.

## Scope

### Auth and routing
- Auth guard functions in `src/lib/auth.ts`: `requireAuth`, `requireClinicAccess`, `requirePlatformOwner`, `requireClinicAdmin`
- Route group layout structure:
  - `src/app/app/layout.tsx` — should only call `requireAuth()`
  - `src/app/app/(dashboard)/layout.tsx` — should call `requireClinicAccess()`
  - `src/app/app/admin/layout.tsx` — should call `requirePlatformOwner()`
  - `src/app/app/onboarding/page.tsx` — should call `requireAuth()`, not `requireClinicAccess()`
- Confirm no redirect loops: a redirect to `/app/onboarding` must not hit a guard that redirects back
- Confirm non-clinic users cannot access dashboard pages
- Confirm non-platform-owners cannot access `/app/admin`
- Confirm unauthenticated users cannot access any `/app/*` route

### Service role key
- `src/lib/supabase/admin.ts` — must import `server-only`, must not be importable by client components
- `src/lib/supabase/server.ts` — confirm uses anon key + user session, not service role
- `src/lib/supabase/client.ts` — confirm uses anon key only, no service role
- Check all files that import `createAdminClient` — should only be server-side files (route handlers, server actions, server components)

### Cron security
- `src/app/api/cron/send-followups/route.ts`
- Confirm `Authorization: Bearer {CRON_SECRET}` is verified before any processing
- Confirm the secret is read from env (not hardcoded)
- Confirm what happens if `CRON_SECRET` is undefined in production

### Webhook security
- `src/app/api/webhooks/resend/route.ts`
- Confirm HMAC-SHA256 signature verification using `RESEND_WEBHOOK_SECRET`
- Confirm timestamp replay attack protection
- Confirm behaviour when `RESEND_WEBHOOK_SECRET` is missing in production (should fail closed with 503)
- Confirm no PII (email addresses, IP addresses) is stored from webhook payloads

### AI assistant safety
- `src/app/api/ai/generate-reply/route.ts`
- Confirm the system prompt prevents clinical advice, diagnosis, or treatment recommendations
- Confirm only safe, non-sensitive context is passed to OpenAI (first name, treatment type, days elapsed, message text — not email address, phone number)
- Confirm the output is never auto-sent (only placed in an editable textarea)
- `src/components/leads/ai-reply-assistant.tsx` — confirm rate limit handling and error display

### Server actions
- `src/app/actions/leads.ts` — confirm `requireClinicAccess()` is called before any mutation
- `src/app/actions/settings.ts` — confirm appropriate auth
- `src/app/actions/enquiry.ts` — public form: confirm it only inserts leads, does not expose other clinic data, has GDPR consent enforcement
- `src/app/actions/auth.ts` — confirm no dangerous patterns

### CSV export
- `src/app/api/reports/export-csv/route.ts` — confirm auth, confirm anonymised leads are excluded, confirm no data from other clinics is included

### Vercel and environment
- `vercel.json` — confirm cron schedule is appropriate, no dangerous settings
- `.env.example` — confirm it contains only placeholder values (no real secrets committed)
- Confirm `NEXT_PUBLIC_*` variables contain nothing secret

### Client-side safety
- Confirm no service role key is exposed to the browser
- Confirm no patient PII is logged to `console.log` or `console.error` in client components

## Rules

- Do not implement any changes.
- Produce a prioritised report only.
- Mark every issue as: **Critical**, **High**, **Medium**, or **Low**.
- Include exact file paths and line-level detail where relevant.
- Include recommended fix for each issue.
- Do not suggest weakening security, disabling RLS, or exposing secrets.
- Do not suggest destructive database operations.

## Output format

1. **Executive summary** — 3–5 sentences, overall posture
2. **Critical issues** — must fix before any external demo
3. **High priority issues** — should fix before external demo
4. **Medium / Low issues** — can wait, but note them
5. **Exact recommended fixes** — file path, what to change
6. **Things already done well** — positive findings
7. **Go / No-go recommendation** — is the app safe to demo to clinic owners right now?
