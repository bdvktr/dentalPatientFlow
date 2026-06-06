import { z } from "zod";

export const TREATMENT_OPTIONS = [
  { value: "dental_implants", label: "Dental Implants" },
  { value: "invisalign",      label: "Invisalign" },
  { value: "whitening",       label: "Teeth Whitening" },
  { value: "cosmetic",        label: "Cosmetic Dentistry" },
  { value: "smile_makeover",  label: "Smile Makeover" },
  { value: "other",           label: "Other" },
] as const;

export const CONTACT_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "either", label: "Either" },
] as const;

export const TIMEFRAME_OPTIONS = [
  { value: "within_1_week",   label: "Within 1 week" },
  { value: "within_2_weeks",  label: "Within 2 weeks" },
  { value: "within_1_month",  label: "Within 1 month" },
  { value: "flexible",        label: "Flexible" },
] as const;

const TREATMENT_VALUES = TREATMENT_OPTIONS.map((o) => o.value) as [string, ...string[]];
const CONTACT_VALUES   = CONTACT_OPTIONS.map((o) => o.value)   as [string, ...string[]];
const TIMEFRAME_VALUES = TIMEFRAME_OPTIONS.map((o) => o.value) as [string, ...string[]];

export const enquirySchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(30, "Phone number is too long").trim().optional(),
  treatmentType: z.enum(TREATMENT_VALUES as [string, ...string[]]).optional(),
  preferredContact: z.enum(CONTACT_VALUES as [string, ...string[]]).optional(),
  preferredTimeframe: z.enum(TIMEFRAME_VALUES as [string, ...string[]]).optional(),
  message: z.string().max(2000, "Message is too long (max 2,000 characters)").trim().optional(),
  gdprConsent: z
    .boolean()
    .refine((v) => v === true, "You must agree to let us store and use your enquiry details."),
  marketingConsent: z.boolean().optional().default(false),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
