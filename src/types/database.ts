// Auto-generate this file with:
//   pnpm supabase gen types typescript --project-id <your-project-id> \
//     --schema public > src/types/database.ts
//
// The types below are hand-written to match the schema in
// supabase/migrations/ and kept in sync manually until the
// Supabase CLI is wired up in CI.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = "platform_owner" | "clinic_admin" | "clinic_staff";

export type LeadStatus =
  | "new"
  | "contacted"
  | "consultation_booked"
  | "treatment_started"
  | "lost"
  | "archived";

export type TreatmentType =
  | "dental_implants"
  | "invisalign"
  | "whitening"
  | "cosmetic"
  | "smile_makeover"
  | "other";

export type FollowupTaskStatus = "pending" | "sent" | "cancelled" | "failed";

export type MessageEventType =
  | "email_sent"
  | "email_delivered"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "email_complained"
  | "email_delivery_delayed"
  | "email_failed";

export type ActivityType =
  | "lead_created"
  | "status_changed"
  | "note_added"
  | "email_sent"
  | "email_delivered"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "email_complained"
  | "email_delivery_delayed"
  | "email_failed"
  | "lead_archived"
  | "lead_anonymised"
  | "followup_cancelled"
  | "assignment_changed"
  | "ai_draft_generated";

// ─── Row types (used in application code) ────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  timezone: string;
  booking_url: string | null;
  privacy_url: string | null;
  followup_enabled: boolean;
  retention_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string | null;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  clinic_id: string;
  name: string;
  type: TreatmentType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  clinic_id: string;
  treatment_type: TreatmentType | null;
  status: LeadStatus;
  full_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  assigned_to: string | null;
  source: string;
  booked_at: string | null;
  archived_at: string | null;
  anonymised_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowupTemplate {
  id: string;
  clinic_id: string;
  treatment_type: TreatmentType | null;
  name: string;
  subject: string;
  body_html: string;
  delay_days: number;
  step_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowupTask {
  id: string;
  lead_id: string;
  clinic_id: string;
  template_id: string | null;
  status: FollowupTaskStatus;
  scheduled_for: string;
  sent_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageEvent {
  id: string;
  followup_task_id: string | null;
  lead_id: string;
  clinic_id: string;
  event_type: MessageEventType;
  resend_email_id: string | null;
  provider_event_id: string | null;
  clicked_url: string | null;
  metadata: Json | null;
  occurred_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  clinic_id: string;
  actor_id: string | null;
  activity_type: ActivityType;
  description: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  clinic_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Database shape (for createClient<Database>()) ───────────────────────────
//
// The Supabase SDK checks that each Row extends Record<string, unknown> via a
// conditional type. TypeScript interfaces do NOT satisfy that check (only mapped
// types and inline object literals do).  We therefore use { [K in keyof T]: T[K] }
// to produce a mapped-type equivalent of each interface for Row, while keeping
// the interfaces above for use throughout the application.
//
// Insert types reflect the actual SQL schema: nullable columns and columns with
// DB-level defaults are marked optional so callers don't have to supply them.

type Mapped<T> = { [K in keyof T]: T[K] };

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: Mapped<Clinic>;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          website?: string | null;
          timezone?: string;
          booking_url?: string | null;
          privacy_url?: string | null;
          followup_enabled?: boolean;
          retention_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Clinic, "id" | "created_at">>;
        Relationships: [];
      };
      profiles: {
        Row: Mapped<Profile>;
        Insert: {
          id: string;
          clinic_id?: string | null;
          role?: UserRole;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      treatments: {
        Row: Mapped<Treatment>;
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          type: TreatmentType;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Treatment, "id" | "created_at">>;
        Relationships: [];
      };
      leads: {
        Row: Mapped<Lead>;
        Insert: {
          id?: string;
          clinic_id: string;
          treatment_type?: TreatmentType | null;
          status?: LeadStatus;
          full_name: string;
          email: string;
          phone?: string | null;
          message?: string | null;
          gdpr_consent?: boolean;
          marketing_consent?: boolean;
          assigned_to?: string | null;
          source?: string;
          booked_at?: string | null;
          archived_at?: string | null;
          anonymised_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lead, "id" | "created_at">>;
        Relationships: [];
      };
      followup_templates: {
        Row: Mapped<FollowupTemplate>;
        Insert: {
          id?: string;
          clinic_id: string;
          treatment_type?: TreatmentType | null;
          name: string;
          subject: string;
          body_html: string;
          delay_days: number;
          step_order: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FollowupTemplate, "id" | "created_at">>;
        Relationships: [];
      };
      followup_tasks: {
        Row: Mapped<FollowupTask>;
        Insert: {
          id?: string;
          lead_id: string;
          clinic_id: string;
          template_id?: string | null;
          status?: FollowupTaskStatus;
          scheduled_for: string;
          sent_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FollowupTask, "id" | "created_at">>;
        Relationships: [];
      };
      message_events: {
        Row: Mapped<MessageEvent>;
        Insert: {
          id?: string;
          followup_task_id?: string | null;
          lead_id: string;
          clinic_id: string;
          event_type: MessageEventType;
          resend_email_id?: string | null;
          provider_event_id?: string | null;
          clicked_url?: string | null;
          metadata?: Json | null;
          occurred_at?: string;
        };
        Update: Partial<Mapped<MessageEvent>>;
        Relationships: [];
      };
      lead_activity: {
        Row: Mapped<LeadActivity>;
        Insert: {
          id?: string;
          lead_id: string;
          clinic_id: string;
          actor_id?: string | null;
          activity_type: ActivityType;
          description?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Mapped<LeadActivity>>;
        Relationships: [];
      };
      audit_logs: {
        Row: Mapped<AuditLog>;
        Insert: {
          id?: string;
          clinic_id?: string | null;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Mapped<AuditLog>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole | null;
      };
      get_current_user_clinic_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_platform_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_clinic_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      lead_status: LeadStatus;
      treatment_type: TreatmentType;
      followup_task_status: FollowupTaskStatus;
      message_event_type: MessageEventType;
      activity_type: ActivityType;
    };
  };
};
