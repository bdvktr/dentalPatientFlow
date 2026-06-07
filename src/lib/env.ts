/**
 * Returns NEXT_PUBLIC_BASE_URL with no trailing slash.
 * In production, throws immediately if the value is missing or not a valid URL
 * so misconfigured deployments fail loudly rather than silently generating
 * broken enquiry links.
 */
export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL;

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[env] NEXT_PUBLIC_BASE_URL is required in production. " +
          "Set it to your deployment URL, e.g. https://yourapp.vercel.app"
      );
    }
    return "http://localhost:3000";
  }

  try {
    new URL(raw);
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[env] NEXT_PUBLIC_BASE_URL is not a valid URL: "${raw}". ` +
          "It must include the protocol, e.g. https://yourapp.vercel.app"
      );
    }
  }

  return raw.replace(/\/$/, "");
}
