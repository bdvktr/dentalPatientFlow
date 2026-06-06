import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">
            Dental PatientFlow AI
          </span>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Convert more dental implant enquiries into booked consultations.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Dental PatientFlow AI helps private dental clinics capture leads,
            send automated follow-up emails, and track patients from first
            enquiry to booked consultation.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Sign in to your clinic
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/40 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold tracking-tight">
              Everything your clinic needs to follow up on leads
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <FeatureCard
                title="Capture enquiries 24/7"
                description="Embed a branded enquiry form on your website. Every submission is captured instantly — no more missed leads from out-of-hours enquiries."
              />
              <FeatureCard
                title="Automated follow-up emails"
                description="Send timely, professional follow-up emails automatically. Customise the sequence to match your clinic's tone and treatment offerings."
              />
              <FeatureCard
                title="Track every lead"
                description="See which enquiries need attention, which are booked, and which need a nudge — all in one simple dashboard."
              />
            </div>
          </div>
        </section>

        {/* Safety disclaimer */}
        <section className="border-t border-border px-6 py-10 text-center">
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Dental PatientFlow AI supports administrative follow-up only. It
            does not provide dental advice, diagnosis, or treatment
            recommendations.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Dental PatientFlow AI</span>
          <span>For UK &amp; Ireland private dental clinics</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
