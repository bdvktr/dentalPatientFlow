# Skill: dental-saas-ui-polish

You are improving the visual design, UX, and perceived quality of **Dental PatientFlow AI** — a B2B SaaS product for UK/Ireland private dental clinics. The goal is to transform it from generic shadcn scaffolding into a premium, trustworthy, clinical-grade SaaS product that a dental practice owner would take seriously at a first demo.

---

## Design direction

**Tone:** calm, professional, clinical, trustworthy. Not corporate-cold. Not startup-casual.

**Palette:**
- Surfaces: white and off-white (`bg-white`, `bg-slate-50`, `bg-gray-50/50`)
- Accents: soft blue (`blue-600`, `blue-700`), teal (`teal-600`), slate (`slate-600`, `slate-700`)
- Borders: subtle (`border-slate-200`, `border-gray-100`)
- Text: dark slate (`slate-900`, `slate-800`) for headings; `slate-600` for secondary; `slate-400` for tertiary
- Destructive / alerts: standard red, amber — not harsh

**Avoid absolutely:**
- Generic AI product gradients (purple-to-pink, blue-to-purple)
- Glassmorphism or heavy blur effects
- Crypto/startup-bro aesthetic (huge bold hero, neon accents)
- Childish or overly decorative icons
- Any claim of guaranteed patients, guaranteed revenue, or treatment suitability
- Any language resembling medical advice, diagnosis, or clinical recommendation

---

## Pages to prioritise (in order)

1. **Landing page** (`src/app/page.tsx`) — hero, value prop, CTA, trust signals
2. **Demo page** (if it exists; otherwise the landing page serves as demo surface)
3. **Public enquiry form** (`src/app/c/[clinicSlug]/enquiry/page.tsx` + `src/components/enquiry/enquiry-form.tsx`) — patient-facing, must feel safe and professional
4. **Enquiry success state** (inside `enquiry-form.tsx`) — confirmation copy, booking CTA
5. **Dashboard overview** (`src/app/app/(dashboard)/page.tsx`) — metric cards, lead tables
6. **Leads table** (`src/app/app/(dashboard)/leads/page.tsx`) — scannability, status, empty state
7. **Lead detail timeline** (`src/app/app/(dashboard)/leads/[leadId]/page.tsx`) — timeline, info cards, actions
8. **Onboarding page** (`src/app/app/onboarding/page.tsx`) — reassuring, not a dead-end wall

---

## Visual standards to enforce

### Spacing and layout
- Page content max-width: `max-w-7xl mx-auto` for dashboard; `max-w-2xl` or `max-w-xl` for forms and narrow pages
- Consistent horizontal padding: `px-6` on mobile, `px-8` on desktop
- Section vertical rhythm: `space-y-8` or `gap-8` between major sections; `space-y-4` within sections
- No orphaned content touching the viewport edge on mobile

### Cards
- Radius: `rounded-xl` for prominent cards; `rounded-lg` for inline cards and table wrappers
- Border: `border border-slate-200`
- Background: `bg-white` or `bg-slate-50/50`
- Padding: `p-5` or `p-6`
- Subtle shadow where elevation matters: `shadow-sm`

### Typography hierarchy
- Page titles: `text-2xl font-semibold tracking-tight text-slate-900`
- Section headings: `text-base font-semibold text-slate-800`
- Subheadings / labels: `text-xs font-medium uppercase tracking-wide text-slate-500`
- Body: `text-sm text-slate-700`
- Muted / secondary: `text-sm text-slate-500`

### CTAs and buttons
- Primary CTA: `bg-blue-600 hover:bg-blue-700 text-white` — one clear primary action per screen
- Secondary: outlined or ghost, never competing with primary in colour weight
- Destructive: `bg-red-600` only for confirmed-destructive actions
- Button size: `h-10 px-5` standard; `h-9 px-4` for compact contexts

### Metric / stat cards (dashboard)
- Number: `text-3xl font-bold tabular-nums text-slate-900`
- Label: `text-xs font-medium text-slate-500 uppercase tracking-wide` above number
- No emoji or icon overload — one icon per card maximum, muted colour

### Tables
- Header row: `bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500`
- Row hover: `hover:bg-slate-50/80`
- Row border: `divide-y divide-slate-100`
- Cell padding: `px-4 py-3`
- Status badges: pill-shaped, semantic colours, text label never omitted

### Forms
- Label: `text-sm font-medium text-slate-700` above every field
- Input: standard shadcn, `focus:ring-blue-500`, `border-slate-300`
- Helper text: `text-xs text-slate-500 mt-1`
- Error text: `text-xs text-red-600 mt-1`
- Required fields: `*` after label text

### Empty states
- Centred in available space
- Muted icon (24–32px, `text-slate-300`), heading, 1-line explanation, optional CTA
- No raw "No data found." text

### Mobile
- Forms go full-width on mobile
- Tables need horizontal scroll on small screens
- Metric grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`

---

## Microcopy standards

- Clinic-facing copy: professional, concise, confident
- Patient-facing copy: warm, clear, reassuring, plain English
- **Safety copy (mandatory near AI features):** "This assistant drafts administrative replies only. It does not provide dental advice, diagnosis, or treatment recommendations."
- **Prohibited claims:**
  - No guaranteed patients or guaranteed revenue
  - No AI diagnostic accuracy claims
  - No treatment suitability claims
  - No diagnosis claims
  - No treatment recommendation claims
  - No medical advice claims
- Date formatting: `en-GB` locale throughout (`14 Jun 2025`)
- Error messages: explain the problem and the next step

---

## Process — follow this order strictly

### Step 1 — Inspect before touching anything
Read the target file(s) in full. Note current spacing, components used (shadcn vs raw HTML), auth/data dependencies, and mobile layout assumptions.

### Step 2 — Write a visual improvement plan
Before editing, output a short bullet-point plan of what will change and why. **Do not start editing until the user confirms**, unless operating with explicit autonomous instructions.

### Step 3 — Implement in small batches
Work page by page. After each page: confirm logic is unchanged, no TypeScript errors, no invalid Tailwind utilities.

### Step 4 — Run checks after each batch
```
pnpm lint
pnpm typecheck
```
Fix all errors before moving to the next page.

### Step 5 — Test in browser if available
Verify layout at 1280px+ desktop and 375px mobile. Confirm forms are usable and CTAs are visible.

---

## Constraints

- Use existing Tailwind CSS utilities and shadcn/ui components only
- Do not install new npm packages for cosmetic purposes
- Do not alter routing, auth logic, data fetching, or server actions
- Do not remove consent checkboxes, GDPR notices, or safety copy
- Do not alter API route handlers, database queries, or Supabase client code
- Prefer editing existing `className` strings over restructuring component trees
- Do not create new component files unless a piece of UI is used in 3+ places

---

## Key file locations

```
src/app/page.tsx                                               Landing page
src/app/c/[clinicSlug]/enquiry/page.tsx                        Public enquiry page
src/components/enquiry/enquiry-form.tsx                        Public enquiry form (client)
src/app/app/(dashboard)/page.tsx                               Dashboard overview
src/app/app/(dashboard)/leads/page.tsx                         Leads list
src/app/app/(dashboard)/leads/[leadId]/page.tsx                Lead detail
src/app/app/(dashboard)/reports/page.tsx                       Reports
src/app/app/(dashboard)/settings/page.tsx                      Settings
src/app/app/(dashboard)/settings/templates/page.tsx            Template list
src/app/app/onboarding/page.tsx                                Onboarding
src/app/app/(dashboard)/layout.tsx                             Dashboard sidebar layout
src/components/leads/status-badge.tsx                          Status badge
src/components/leads/lead-status-actions.tsx                   Status action buttons
src/components/settings/settings-nav.tsx                       Settings tab nav
```
