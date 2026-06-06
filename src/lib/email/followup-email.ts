// HTML email template builder for patient follow-up emails.
// This file is intentionally free of server-only APIs so it can be tested in isolation.

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renders the clinic-authored body_html and wraps it in a clean,
 * email-client-compatible layout.
 *
 * Supported placeholders in body_html:
 *   {{lead_name}} → patient's first name (XSS-escaped)
 */
export function buildFollowupEmailHtml(params: {
  clinicName: string;
  bodyHtml: string;
  patientFirstName: string;
  clinicEmail: string | null;
}): string {
  const body = params.bodyHtml.replace(
    /\{\{lead_name\}\}/gi,
    esc(params.patientFirstName)
  );

  const contactLine = params.clinicEmail
    ? `To unsubscribe, reply to this email or contact us at <a href="mailto:${esc(params.clinicEmail)}" style="color:#6b7280">${esc(params.clinicEmail)}</a>.`
    : "To unsubscribe from these updates, please reply to this email.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(params.clinicName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f3f4f6;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
        <!-- Header -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:17px;font-weight:600;color:#111827;line-height:1.4;">${esc(params.clinicName)}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;font-size:15px;line-height:1.7;color:#374151;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 24px;background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.5;">
              ${contactLine}
            </p>
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.4;">
              Dental PatientFlow AI — administrative follow-up only. This message does not
              constitute dental advice, diagnosis, or treatment recommendations.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
