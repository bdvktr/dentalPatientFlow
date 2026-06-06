import { z } from "zod";

const optionalUrl = z.union([
  z.string().url("Enter a valid URL (e.g. https://example.com)"),
  z.literal(""),
]);

export const clinicSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Clinic name must be at least 2 characters")
    .max(200, "Name is too long")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be 60 characters or less")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens (e.g. my-clinic)"
    ),
  email: z.union([z.string().email("Enter a valid email address"), z.literal("")]).optional(),
  website: optionalUrl.optional(),
  booking_url: optionalUrl.optional(),
  privacy_url: optionalUrl.optional(),
  timezone: z.enum(["Europe/London", "Europe/Dublin"]),
  followup_enabled: z.boolean(),
  retention_days: z
    .number()
    .int("Must be a whole number")
    .min(30, "Minimum retention period is 30 days")
    .max(3650, "Maximum retention period is 3,650 days"),
});

export const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name is too long")
    .trim(),
  subject: z
    .string()
    .min(1, "Subject line is required")
    .max(200, "Subject line is too long")
    .trim(),
  body_html: z
    .string()
    .min(10, "Email body must be at least 10 characters")
    .max(10000, "Email body is too long (max 10,000 characters)")
    .trim(),
  treatment_type: z.string().optional(),
  delay_days: z
    .number()
    .int("Must be a whole number")
    .min(0, "Delay cannot be negative")
    .max(365, "Delay cannot exceed 365 days"),
  step_order: z
    .number()
    .int("Must be a whole number")
    .min(1, "Step order must be at least 1")
    .max(99, "Step order is too high"),
  is_active: z.boolean(),
});
