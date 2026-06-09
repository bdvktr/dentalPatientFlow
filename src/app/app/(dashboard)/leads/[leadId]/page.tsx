import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireClinicAccess, isClinicAdmin, isPlatformOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/leads/status-badge";
import { LeadStatusActions } from "@/components/leads/lead-status-actions";
import { NoteForm } from "@/components/leads/note-form";
import { TREATMENT_OPTIONS } from "@/lib/validations/enquiry";
import { AiReplyAssistant } from "@/components/leads/ai-reply-assistant";
import type { ActivityType, MessageEventType, LeadStatus } from "@/types/database";

const TREATMENT_LABELS = Object.fromEntries(
  TREATMENT_OPTIONS.map((o) => [o.value, o.label])
);

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  lead_created: "Lead created",
  status_changed: "Status changed",
  note_added: "Note",
  email_sent: "Email sent",
  email_delivered: "Delivered",
  email_opened: "Opened",
  email_clicked: "Link clicked",
  email_bounced: "Bounced",
  email_complained: "Spam complaint",
  email_delivery_delayed: "Delivery delayed",
  email_failed: "Email failed",
  lead_archived: "Archived",
  lead_anonymised: "Anonymised",
  followup_cancelled: "Follow-up cancelled",
  assignment_changed: "Reassigned",
  ai_draft_generated: "AI draft generated",
};

const EMAIL_EVENT_LABELS: Record<MessageEventType, string> = {
  email_sent: "Email sent",
  email_delivered: "Email delivered",
  email_opened: "Email opened",
  email_clicked: "Link clicked",
  email_bounced: "Email bounced",
  email_complained: "Spam complaint",
  email_delivery_delayed: "Delivery delayed",
  email_failed: "Email failed",
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const user = await requireClinicAccess();
  const supabase = await createClient();

  // Fetch lead (RLS ensures clinic scoping)
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) notFound();

  // Fetch activity + email events in parallel
  const [activityResult, emailResult] = await Promise.all([
    supabase
      .from("lead_activity")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("message_events")
      .select("*")
      .eq("lead_id", leadId)
      .order("occurred_at", { ascending: false }),
  ]);

  const activities = activityResult.data ?? [];
  const emailEvents = emailResult.data ?? [];

  const canAnonymize = isClinicAdmin(user) || isPlatformOwner(user);
  const isAnonymised = lead.anonymised_at !== null;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/app/leads"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to leads
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{lead.full_name}</h1>
          <StatusBadge status={lead.status as LeadStatus} />
          {isAnonymised && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Anonymised
            </span>
          )}
          {lead.treatment_type && (
            <span className="text-sm text-muted-foreground">
              {TREATMENT_LABELS[lead.treatment_type] ?? lead.treatment_type}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: info + actions */}
        <div className="space-y-5 lg:col-span-1">
          {/* Lead info */}
          <section className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Lead information
            </h2>

            {isAnonymised && (
              <p className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                PII has been permanently removed from this record.
              </p>
            )}

            <InfoRow label="Email">
              {isAnonymised ? (
                <span className="text-muted-foreground italic">Removed</span>
              ) : (
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:underline underline-offset-4"
                >
                  {lead.email}
                </a>
              )}
            </InfoRow>

            <InfoRow label="Phone">
              {lead.phone ? (
                isAnonymised ? (
                  <span className="text-muted-foreground italic">Removed</span>
                ) : (
                  <a
                    href={`tel:${lead.phone}`}
                    className="hover:underline underline-offset-4"
                  >
                    {lead.phone}
                  </a>
                )
              ) : (
                <span className="text-muted-foreground">Not provided</span>
              )}
            </InfoRow>

            <InfoRow label="Treatment">
              {lead.treatment_type
                ? (TREATMENT_LABELS[lead.treatment_type] ?? lead.treatment_type)
                : <span className="text-muted-foreground">Not specified</span>}
            </InfoRow>

            <InfoRow label="Source">
              <span className="capitalize">
                {lead.source.replace(/_/g, " ")}
              </span>
            </InfoRow>

            <InfoRow label="GDPR consent">
              {lead.gdpr_consent ? "Given" : "Not recorded"}
            </InfoRow>

            <InfoRow label="Marketing">
              {lead.marketing_consent ? "Opted in" : "Not opted in"}
            </InfoRow>

            <InfoRow label="Received">
              {formatDate(lead.created_at)}
            </InfoRow>

            {lead.booked_at && (
              <InfoRow label="Booked">
                {formatDate(lead.booked_at)}
              </InfoRow>
            )}

            {lead.archived_at && (
              <InfoRow label="Archived">
                {formatDate(lead.archived_at)}
              </InfoRow>
            )}
          </section>

          {/* Message / notes from patient */}
          {lead.message && !isAnonymised && (
            <section className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Patient message
              </h2>
              <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
            </section>
          )}

          {/* Status actions */}
          <section className="rounded-lg border border-border bg-card p-4">
            <LeadStatusActions
              leadId={lead.id}
              currentStatus={lead.status as LeadStatus}
              anonymisedAt={lead.anonymised_at}
              canAnonymize={canAnonymize}
            />
          </section>
        </div>

        {/* Right column: notes + timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Add note */}
          <section className="rounded-lg border border-border bg-card p-4">
            <NoteForm leadId={lead.id} />
          </section>

          {/* AI reply assistant — hidden for anonymised leads */}
          {!isAnonymised && (
            <AiReplyAssistant leadId={lead.id} hasOpenAI={hasOpenAI} />
          )}

          {/* Activity timeline */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Activity ({activities.length})
            </h2>

            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div>
                {activities.map((activity, i) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex shrink-0 flex-col items-center">
                      <ActivityDot type={activity.activity_type as ActivityType} />
                      {i < activities.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium">
                          {ACTIVITY_LABELS[activity.activity_type as ActivityType] ??
                            activity.activity_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(activity.created_at)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Email history */}
          {emailEvents.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email history ({emailEvents.length})
              </h2>

              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Event
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {emailEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-2.5">
                          <div>
                            {EMAIL_EVENT_LABELS[event.event_type as MessageEventType] ??
                              event.event_type}
                            {event.clicked_url && (
                              <a
                                href={event.clicked_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 block truncate max-w-xs text-xs text-muted-foreground hover:text-foreground hover:underline"
                                title={event.clicked_url}
                              >
                                {event.clicked_url}
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatDateTime(event.occurred_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Email open and click tracking can be affected by privacy tools and
                may not always reflect direct patient action.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function ActivityDot({ type }: { type: ActivityType }) {
  const color = {
    lead_created: "bg-blue-400",
    status_changed: "bg-amber-400",
    note_added: "bg-gray-400",
    email_sent: "bg-green-400",
    email_delivered: "bg-green-500",
    email_opened: "bg-sky-400",
    email_clicked: "bg-sky-500",
    email_bounced: "bg-red-500",
    email_complained: "bg-red-600",
    email_delivery_delayed: "bg-amber-400",
    email_failed: "bg-red-400",
    lead_archived: "bg-gray-400",
    lead_anonymised: "bg-amber-400",
    followup_cancelled: "bg-gray-300",
    assignment_changed: "bg-purple-400",
    ai_draft_generated: "bg-violet-400",
  }[type] ?? "bg-gray-300";

  return (
    <div className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
      <div className={`h-2 w-2 rounded-full ${color}`} />
    </div>
  );
}
