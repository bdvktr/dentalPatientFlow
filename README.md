# Dental PatientFlow AI

B2B SaaS MVP for UK/Ireland private dental clinics. Captures dental implant,
Invisalign, and cosmetic enquiries, sends automated follow-up emails, and
tracks leads from first contact to booked consultation.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + **shadcn/ui**
- **Supabase** (Auth, Postgres, RLS)
- **Resend** (transactional email)
- **OpenAI** (optional — administrative email drafts only)
- **Vercel** (deployment + cron jobs)

## Getting started

1. Copy `.env.example` to `.env.local` and fill in your keys.
2. Install dependencies: `pnpm install`
3. Run the dev server: `pnpm dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

See `.env.example` for all required and optional variables.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only, never expose) |
| `RESEND_API_KEY` | Yes | Email sending — app degrades gracefully if absent |
| `RESEND_FROM_EMAIL` | Yes | Verified sender address, e.g. `noreply@yourclinic.com` |
| `CRON_SECRET` | Yes | Random string used to authenticate cron requests |
| `OPENAI_API_KEY` | Optional | AI draft replies (future phase) |
| `NEXT_PUBLIC_BASE_URL` | Yes | Absolute URL, e.g. `https://yourapp.vercel.app` |

## Vercel Cron — follow-up emails

The route `GET /api/cron/send-followups` processes due follow-up tasks and sends emails via Resend.

**How it works:**

1. Verifies `Authorization: Bearer {CRON_SECRET}` — Vercel injects this automatically
2. Fetches up to 50 `pending` `followup_tasks` where `scheduled_for <= now()`
3. Skips tasks for closed leads (booked / lost / archived / anonymised) or inactive clinics / templates
4. Sends each email with the clinic's configured template via Resend
5. Marks tasks `sent` or `failed`, records `message_events` and `lead_activity`
6. Returns `{ processed, sent, failed, skipped }` JSON

**Deployment:**

Cron is configured in `vercel.json` (runs every hour):

```json
{ "crons": [{ "path": "/api/cron/send-followups", "schedule": "0 * * * *" }] }
```

Set `CRON_SECRET` in **Vercel → Project → Settings → Environment Variables**. Cron jobs require the **Vercel Pro** plan or above.

**Local testing:**

```bash
curl -s http://localhost:3000/api/cron/send-followups \
  -H "Authorization: Bearer your-cron-secret" | jq
```

If `RESEND_API_KEY` is not set, the route exits gracefully with `{ message: "Resend is not configured" }`.

**Email template placeholders** (used in `followup_templates.body_html`):

| Placeholder | Value |
|---|---|
| `{{lead_name}}` | Patient's first name |

## Database migrations

Apply the files in `supabase/migrations/` in numeric order via the Supabase dashboard SQL editor or:

```bash
supabase db push
```

## Project structure

```
src/
├── app/
│   ├── api/cron/        # Cron route handlers
│   ├── app/             # Authenticated dashboard (leads, settings, admin)
│   ├── auth/            # Supabase auth callback
│   ├── c/[clinicSlug]/  # Public enquiry forms
│   ├── layout.tsx
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Login/signup forms, sign-out button
│   ├── enquiry/         # Public enquiry form
│   └── leads/           # Dashboard lead components
├── lib/
│   ├── email/           # Email HTML builders
│   ├── supabase/        # Server + admin Supabase clients
│   └── validations/     # Zod schemas
└── types/
    └── database.ts      # Hand-maintained Supabase types
supabase/
├── migrations/          # SQL migrations (apply in order)
└── seed.sql             # Demo data
```

## Safety

This product supports administrative follow-up only. It does not provide
dental advice, diagnosis, or treatment recommendations. AI features are
restricted to drafting administrative reply emails for staff review.

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm typecheck  # TypeScript check (tsc --noEmit)
pnpm lint       # ESLint
```
