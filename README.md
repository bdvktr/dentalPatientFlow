# Dental PatientFlow AI

B2B SaaS MVP for UK/Ireland private dental clinics. Captures dental implant,
Invisalign, and cosmetic enquiries, sends automated follow-up emails, tracks
leads, and provides AI-assisted administrative reply drafts.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Supabase** (Auth, Postgres, Row Level Security)
- **Resend** (transactional email)
- **OpenAI** (optional — administrative email drafts only, never clinical)
- **Vercel** (deployment + Cron Jobs)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/bdvktr/dentalPatientFlow.git
cd dentalPatientFlow
pnpm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Note your **Project URL** and **API keys** (Settings → API)
3. Copy your **service role key** — keep this secret, never expose it client-side

### 3. Apply database migrations

In the Supabase dashboard → **SQL Editor**, run each file in `supabase/migrations/` **in numeric order**:

| File | Purpose |
|---|---|
| `20240101000000_enums.sql` | Custom enum types |
| `20240101000001_tables.sql` | All tables |
| `20240101000002_functions.sql` | Triggers, RLS helpers, lifecycle functions |
| `20240101000003_indexes.sql` | Performance indexes |
| `20240101000004_rls.sql` | Row Level Security policies |
| `20240101000005_clinic_settings.sql` | Extended clinic settings columns |
| `20240101000006_ai_activity.sql` | AI activity enum value |

Or use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Then optionally load demo data:

```bash
# Supabase dashboard SQL Editor
-- paste contents of supabase/seed.sql
```

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all values:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only. **Never expose to client.** |
| `RESEND_API_KEY` | Yes* | From [resend.com](https://resend.com). App degrades gracefully if absent — no emails sent. |
| `RESEND_FROM_EMAIL` | Yes* | Must be a verified domain/address in Resend, e.g. `noreply@yourclinic.com` |
| `CRON_SECRET` | Yes | Any random string, e.g. `openssl rand -hex 32`. Used to authenticate cron requests. |
| `OPENAI_API_KEY` | Optional | Enables AI reply drafts. App works without it — feature is disabled. |
| `NEXT_PUBLIC_BASE_URL` | Yes | Full URL of your deployment, e.g. `https://yourapp.vercel.app` |

*Required for follow-up emails to send. The app runs without them — emails are silently skipped.

### 5. Create the first platform owner

After signing up via `/signup`, promote your account to `platform_owner` in the Supabase dashboard:

```sql
-- Supabase SQL Editor
UPDATE public.profiles
SET role = 'platform_owner'
WHERE id = '<your-auth-user-uuid>';
```

You can find your UUID in Supabase → Authentication → Users.

### 6. Create your first clinic

As platform owner, go to `/app/admin` and create a clinic, or insert directly:

```sql
INSERT INTO public.clinics (name, slug, email)
VALUES ('My Dental Clinic', 'my-dental-clinic', 'hello@myclinic.com');

-- Then assign yourself to the clinic:
UPDATE public.profiles
SET clinic_id = '<clinic-uuid>', role = 'clinic_admin'
WHERE id = '<your-auth-user-uuid>';
```

### 7. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The public enquiry form is at: `http://localhost:3000/c/<your-clinic-slug>/enquiry`

---

## Deployment (Vercel)

1. Push to GitHub and connect the repo in Vercel
2. Add all environment variables in **Vercel → Project → Settings → Environment Variables**
3. Vercel cron jobs require the **Pro plan** or above
4. The cron schedule is in `vercel.json` — runs hourly by default:
   ```json
   { "crons": [{ "path": "/api/cron/send-followups", "schedule": "0 * * * *" }] }
   ```
5. Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL

---

## AI reply assistant (optional)

The AI assistant drafts safe, non-clinical administrative replies on the lead detail page.

1. Set `OPENAI_API_KEY` in your environment
2. Uses `gpt-4o-mini` — cost-efficient for short email drafts
3. Only passes non-sensitive context to OpenAI: patient first name, treatment interest, days since enquiry, and the patient's enquiry message
4. **Never sends** email address, phone number, or internal staff notes to OpenAI
5. Output goes into an editable textarea — **never auto-sent**
6. Every generation is logged in the activity timeline

If `OPENAI_API_KEY` is not set, the button is visible but disabled with an explanatory note.

**Safety notice:** The assistant is restricted to administrative replies only. It cannot provide dental advice, diagnoses, or treatment recommendations. A mandatory warning banner is shown on every generated draft.

---

## Follow-up email cron

The route `GET /api/cron/send-followups` processes due follow-up tasks and sends emails via Resend.

**How it works:**

1. Verifies `Authorization: Bearer {CRON_SECRET}` — Vercel injects this automatically
2. Fetches up to 50 `pending` tasks where `scheduled_for <= now()`
3. Skips tasks for inactive clinics (`is_active = false` or `followup_enabled = false`)
4. Skips tasks for closed leads (`consultation_booked`, `treatment_started`, `lost`, `archived`, anonymised)
5. Skips tasks with missing or inactive templates
6. Sends via Resend, records `message_events` and `lead_activity`
7. Atomic idempotency guard: `UPDATE ... WHERE status = 'pending'` prevents duplicate sends
8. Returns `{ processed, sent, failed, skipped }` JSON

**Test locally:**

```bash
curl -s http://localhost:3000/api/cron/send-followups \
  -H "Authorization: Bearer your-cron-secret" | jq
```

**Email template placeholders** (in `followup_templates.body_html`):

| Placeholder | Value |
|---|---|
| `{{lead_name}}` | Patient's first name (XSS-escaped) |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── api/
│   │   ├── ai/          # AI reply draft route handler
│   │   ├── cron/        # Follow-up email cron
│   │   └── reports/     # CSV export route handler
│   ├── app/             # Authenticated dashboard
│   │   ├── admin/       # Platform owner admin area
│   │   ├── leads/       # Lead list + lead detail
│   │   ├── reports/     # Reports + metrics
│   │   └── settings/    # Clinic settings + template editor
│   ├── auth/            # Supabase auth callback
│   ├── c/[clinicSlug]/  # Public enquiry form (unauthenticated)
│   ├── layout.tsx
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Login/signup forms, sign-out button
│   ├── enquiry/         # Public enquiry form
│   ├── leads/           # Lead list, status actions, AI assistant
│   ├── reports/         # Bar charts, filter form
│   └── settings/        # Clinic settings form, template editor
├── lib/
│   ├── email/           # Follow-up email HTML builder
│   ├── reports/         # Metric computation (pure functions)
│   ├── supabase/        # Server + admin Supabase clients
│   └── validations/     # Zod schemas
└── types/
    └── database.ts      # Hand-maintained Supabase types
supabase/
├── migrations/          # SQL migrations — apply in numeric order
└── seed.sql             # Demo clinic + leads data
```

---

## Security

- **RLS enabled on all 9 tables** — unauthenticated users cannot read any sensitive data
- **Service role key is server-only** — imported only via `"server-only"` module
- **Public enquiry form** — lead creation goes through a server action, never direct client insert
- **GDPR consent** — required checkbox on enquiry form; optional marketing consent is separate
- **Anonymisation** — DB trigger wipes all PII and cancels pending follow-ups irreversibly
- **IDOR protection** — every mutation verifies ownership server-side via `clinic_id` check
- **Cron authentication** — CRON_SECRET bearer token required; separate from Supabase auth
- **AI safety** — non-clinical system prompt; output is editable draft, never auto-sent; no PII except first name sent to OpenAI
- **CSV export** — anonymised leads are excluded (`anonymised_at IS NULL`)

---

## Commands

```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm typecheck  # TypeScript check (tsc --noEmit)
pnpm lint       # ESLint
```
