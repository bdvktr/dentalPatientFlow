# Dental PatientFlow AI — Claude Instructions

You are working on a production-minded MVP for Dental PatientFlow AI.

## Product

Dental PatientFlow AI is a B2B SaaS MVP for UK/Ireland private dental clinics. It helps clinics capture dental implant, Invisalign, cosmetic dentistry, whitening, and smile makeover enquiries, send administrative follow-up emails, track leads, and help patients book consultations.

This is not a medical product.
This is not a diagnosis product.
This is not a treatment recommendation product.
AI must only generate safe administrative reply drafts.

## Tech Stack

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Resend
- OpenAI API optional
- Vercel-compatible deployment

Do not use:
- Prisma
- MongoDB
- Firebase
- hardcoded secrets
- client-side service role keys
- medical diagnosis logic

## Architecture Rules

- Use server components by default.
- Use client components only when interactivity is required.
- Use Server Actions or Route Handlers for mutations.
- Validate all inputs with zod.
- Keep Supabase service role usage server-only.
- Never import admin Supabase client into client components.
- Enable RLS on every sensitive table.
- Always check authorization server-side.
- Do not rely only on client-side permission checks.
- Use UUID primary keys.
- Add created_at and updated_at where useful.
- Use clear file structure.

## Security Rules

- Never log patient PII in browser console.
- Never expose secrets.
- Never commit .env files.
- Never create public read access to leads.
- Public enquiry form must insert leads through a server action or route handler.
- Add consent checkbox to public enquiry form.
- Add optional marketing consent separately.
- Cancel remaining follow-ups when lead is booked, lost, archived, or anonymized.
- AI assistant must never provide clinical advice.
- Add audit/activity logs for important actions.

## Coding Style

- Prefer simple, readable code.
- Avoid overengineering.
- Avoid unnecessary abstractions.
- Keep components small.
- Use descriptive names.
- Add comments only for non-obvious logic.
- Do not create fake production secrets.
- If a feature needs an API key, use env variables and fail gracefully when missing.

## Workflow

Before major implementation:
1. Inspect the current files.
2. Summarize what already exists.
3. Create a short implementation plan.
4. Implement only the requested phase.
5. Run typecheck/build where possible.
6. Fix errors before moving on.
7. Summarize changed files.

## Commands

Use pnpm unless the project already uses another package manager.

Useful commands:
- pnpm install
- pnpm dev
- pnpm build
- pnpm lint
- pnpm typecheck

## Product Copy

Primary headline:
"Convert more dental implant enquiries into booked consultations."

Safety copy:
"Dental PatientFlow AI supports administrative follow-up only. It does not provide dental advice, diagnosis, or treatment recommendations."

Avoid claims:
- guaranteed patients
- guaranteed revenue
- AI diagnosis
- treatment suitability
- medical recommendations
- emergency advice