-- =============================================================
-- Seed: Demo clinic, treatments, follow-up templates, and leads
--
-- Applied by: supabase db seed  (runs as postgres / superuser,
-- which bypasses RLS — that is intentional for seeding).
--
-- All names, emails, and phone numbers are entirely fictional.
-- Do NOT use real patient data here.
--
-- To reset and re-seed: supabase db reset
-- =============================================================

-- -----------------------------------------------------------
-- Demo clinic
-- -----------------------------------------------------------
INSERT INTO public.clinics (id, name, slug, email, phone, address, website, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Bright Smiles Dental (Demo)',
  'bright-smiles-demo',
  'demo@brightsmiles.example',
  '+44 20 0000 0001',
  '1 Dental Street, London, EC1A 1BB',
  'https://brightsmiles.example',
  true
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Demo treatments
-- -----------------------------------------------------------
INSERT INTO public.treatments (id, clinic_id, name, type, description, is_active)
VALUES
  (
    '00000000-0000-0000-0003-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Dental Implants',
    'dental_implants',
    'Permanent tooth replacement using titanium posts.',
    true
  ),
  (
    '00000000-0000-0000-0003-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Invisalign',
    'invisalign',
    'Clear removable aligners for straighter teeth.',
    true
  ),
  (
    '00000000-0000-0000-0003-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Teeth Whitening',
    'whitening',
    'Professional in-chair and take-home whitening options.',
    true
  ),
  (
    '00000000-0000-0000-0003-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Cosmetic Dentistry',
    'cosmetic',
    'Composite bonding, veneers, and smile enhancements.',
    true
  ),
  (
    '00000000-0000-0000-0003-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Smile Makeover',
    'smile_makeover',
    'Comprehensive transformation combining multiple treatments.',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Demo follow-up email templates
-- -----------------------------------------------------------
INSERT INTO public.followup_templates
  (id, clinic_id, treatment_type, name, subject, body_html, delay_days, step_order, is_active)
VALUES
  -- Implant sequence
  (
    '00000000-0000-0000-0001-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'dental_implants',
    'Implants – Day 1 follow-up',
    'Thank you for your dental implant enquiry',
    '<p>Dear {{lead_name}},</p>
<p>Thank you for getting in touch about dental implants. We would love to arrange a free, no-obligation consultation to discuss your options in detail.</p>
<p>Please reply to this email or call us on <strong>+44 20 0000 0001</strong> to book a convenient time.</p>
<p>Warm regards,<br>The Bright Smiles Dental Team</p>',
    1,
    1,
    true
  ),
  (
    '00000000-0000-0000-0001-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'dental_implants',
    'Implants – Day 5 follow-up',
    'Still considering dental implants?',
    '<p>Dear {{lead_name}},</p>
<p>We wanted to follow up on your recent dental implant enquiry. Our experienced team is happy to answer any questions you might have about the process, timeline, or costs.</p>
<p>We look forward to hearing from you.</p>
<p>Warm regards,<br>The Bright Smiles Dental Team</p>',
    5,
    2,
    true
  ),

  -- Invisalign sequence
  (
    '00000000-0000-0000-0001-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'invisalign',
    'Invisalign – Day 1 follow-up',
    'Thank you for your Invisalign enquiry',
    '<p>Dear {{lead_name}},</p>
<p>Thank you for enquiring about Invisalign. We would be delighted to arrange a complimentary smile assessment to show you what Invisalign could achieve for you.</p>
<p>Please get in touch to book your appointment.</p>
<p>Warm regards,<br>The Bright Smiles Dental Team</p>',
    1,
    1,
    true
  ),

  -- General fallback sequence (treatment_type = NULL = all treatments)
  (
    '00000000-0000-0000-0001-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'General – Day 2 follow-up',
    'Thank you for contacting Bright Smiles Dental',
    '<p>Dear {{lead_name}},</p>
<p>Thank you for your enquiry. One of our friendly team members will be in touch shortly to help you take the next step.</p>
<p>If you have any questions in the meantime, please do not hesitate to call us.</p>
<p>Warm regards,<br>The Bright Smiles Dental Team</p>',
    2,
    1,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Demo leads (fictional names, emails, and phone numbers only)
-- -----------------------------------------------------------
INSERT INTO public.leads
  (id, clinic_id, full_name, email, phone, treatment_type, status,
   gdpr_consent, marketing_consent, source, message)
VALUES
  -- New, uncontacted implant lead
  (
    '00000000-0000-0000-0002-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Alice Demo',
    'alice.demo@example.com',
    '+44 7700 000001',
    'dental_implants',
    'new',
    true, false,
    'enquiry_form',
    'Interested in a single tooth implant on my upper left. Looking for pricing information and availability.'
  ),

  -- Contacted Invisalign lead
  (
    '00000000-0000-0000-0002-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Bob Demo',
    'bob.demo@example.com',
    '+44 7700 000002',
    'invisalign',
    'contacted',
    true, true,
    'enquiry_form',
    'Would like to know more about Invisalign. Had traditional braces as a teenager and would prefer a more discreet option this time.'
  ),

  -- Consultation booked – smile makeover
  (
    '00000000-0000-0000-0002-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Carol Demo',
    'carol.demo@example.com',
    '+44 7700 000003',
    'smile_makeover',
    'consultation_booked',
    true, true,
    'enquiry_form',
    'Interested in a full smile makeover. Would like to discuss whitening and composite veneers.'
  ),

  -- Lost whitening lead
  (
    '00000000-0000-0000-0002-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'David Demo',
    'david.demo@example.com',
    NULL,
    'whitening',
    'lost',
    true, false,
    'enquiry_form',
    'Enquiring about professional teeth whitening options and approximate cost.'
  ),

  -- New cosmetic lead
  (
    '00000000-0000-0000-0002-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Eve Demo',
    'eve.demo@example.com',
    '+44 7700 000005',
    'cosmetic',
    'new',
    true, false,
    'enquiry_form',
    'Looking to improve the appearance of some chipped front teeth. Interested in composite bonding.'
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Demo lead activity entries
-- -----------------------------------------------------------
INSERT INTO public.lead_activity
  (id, lead_id, clinic_id, actor_id, activity_type, description)
VALUES
  -- Bob was contacted
  (
    '00000000-0000-0000-0004-000000000001'::uuid,
    '00000000-0000-0000-0002-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'status_changed',
    'Status changed from new to contacted'
  ),
  -- Bob – staff note
  (
    '00000000-0000-0000-0004-000000000002'::uuid,
    '00000000-0000-0000-0002-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'note_added',
    'Called patient. Left voicemail. Will try again tomorrow.'
  ),
  -- Carol moved to booked
  (
    '00000000-0000-0000-0004-000000000003'::uuid,
    '00000000-0000-0000-0002-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'status_changed',
    'Status changed from contacted to consultation_booked'
  ),
  -- Carol – booking confirmation note
  (
    '00000000-0000-0000-0004-000000000004'::uuid,
    '00000000-0000-0000-0002-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'note_added',
    'Patient confirmed via phone. Consultation booked for next Tuesday at 2 pm.'
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- NOTE: Demo user profiles are not seeded here because profiles
-- reference auth.users, which is managed by Supabase Auth.
--
-- To create a demo platform_owner for testing:
--   1. Sign up via the app (/signup)
--   2. Run this in the Supabase SQL editor:
--
--   UPDATE public.profiles
--   SET role = 'platform_owner'
--   WHERE id = '<your-auth-user-id>';
--
-- To assign a user to the demo clinic as clinic_admin:
--
--   UPDATE public.profiles
--   SET clinic_id = '00000000-0000-0000-0000-000000000001',
--       role      = 'clinic_admin'
--   WHERE id = '<your-auth-user-id>';
-- -----------------------------------------------------------
