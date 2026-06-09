import Link from "next/link";
import { ClipboardList, Mail, LayoutDashboard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Dental PatientFlow AI
          </span>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center bg-slate-50/60">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-blue-600">
            For UK &amp; Ireland private dental clinics
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Convert more dental implant enquiries into booked consultations.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Capture enquiries for implants, Invisalign, cosmetic dentistry, and
            whitening. Organise follow-up, prioritise responses, and help your
            admin team respond faster.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign in to your clinic
            </Link>
          </div>
          <p className="mt-8 text-xs text-slate-400">
            No credit card required &middot; Set up in minutes &middot; GDPR
            compliant
          </p>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-white px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
              How it works
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <Step
                number="1"
                title="Embed your enquiry form"
                description="Share a link or embed the form on your website. Every patient submission is captured instantly — no missed enquiries."
              />
              <Step
                number="2"
                title="Organise and follow up"
                description="Leads appear in your dashboard immediately. Send follow-up emails, add notes, and track consultation interest in one place."
              />
              <Step
                number="3"
                title="Track to consultation"
                description="Monitor each lead from first contact to booked consultation. See what needs attention and where your admin team should focus."
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 bg-slate-50/60 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
              Everything your admin team needs
            </h2>
            <p className="mt-3 text-center text-sm text-slate-500">
              Built for private dental clinics handling implant, Invisalign, and
              cosmetic enquiries.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <FeatureCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="Capture enquiries 24/7"
                description="A branded enquiry form captures every submission — out of hours, at weekends, whenever a patient is ready to enquire."
              />
              <FeatureCard
                icon={<Mail className="h-5 w-5" />}
                title="Automated follow-up emails"
                description="Send timely, professional follow-up emails automatically. Customise the sequence to match your clinic's tone."
              />
              <FeatureCard
                icon={<LayoutDashboard className="h-5 w-5" />}
                title="Track every enquiry"
                description="See which leads need attention, which are booked, and which need a nudge — all in a simple, clean dashboard."
              />
            </div>
          </div>
        </section>

        {/* Safety disclaimer */}
        <section className="border-t border-slate-200 bg-white px-6 py-10 text-center">
          <p className="mx-auto max-w-xl text-sm text-slate-500">
            Dental PatientFlow AI supports administrative follow-up only. It
            does not provide dental advice, diagnosis, or treatment
            recommendations.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Dental PatientFlow AI</span>
          <span>For UK &amp; Ireland private dental clinics</span>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
