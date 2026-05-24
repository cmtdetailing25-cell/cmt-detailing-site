/**
 * Email helper — SERVER ONLY.
 * Uses Resend for transactional email. Silently no-ops if RESEND_API_KEY is missing.
 */

interface BookingEmailData {
  fullName:         string;
  phone:            string;
  email:            string;
  vehicleYear:      string;
  vehicleMake:      string;
  vehicleModel:     string;
  serviceRequested: string;
  town:             string;
  preferredDate:    string;
  preferredTime:    string;
  notes?:           string | null;
  adminUrl:         string;
}

export async function sendBookingEmail(data: BookingEmailData): Promise<{ ok: boolean; error?: string }> {
  const apiKey     = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  // onboarding@resend.dev works immediately without domain verification.
  // Set EMAIL_FROM once cmtdetailing.com is verified on resend.com/domains.
  const from       = process.env.EMAIL_FROM ?? "CMT Admin <onboarding@resend.dev>";

  if (!apiKey || !adminEmail) return { ok: false, error: "Email not configured" };

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#151b23;color:#e9f0ef;border-radius:12px;padding:32px;">
      <h2 style="margin:0 0 4px;color:#e9f0ef;">New Booking Request</h2>
      <p style="margin:0 0 24px;color:#708289;font-size:13px;">CMT Detailing</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#708289;width:140px;">Name</td><td style="color:#e9f0ef;">${data.fullName}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Phone</td><td style="color:#e9f0ef;">${data.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Email</td><td style="color:#e9f0ef;">${data.email}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Vehicle</td><td style="color:#e9f0ef;">${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Service</td><td style="color:#e9f0ef;">${data.serviceRequested}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Date</td><td style="color:#e9f0ef;">${data.preferredDate} at ${data.preferredTime}</td></tr>
        <tr><td style="padding:8px 0;color:#708289;">Town</td><td style="color:#e9f0ef;">${data.town}</td></tr>
        ${data.notes ? `<tr><td style="padding:8px 0;color:#708289;vertical-align:top;">Notes</td><td style="color:#e9f0ef;">${data.notes}</td></tr>` : ""}
      </table>

      <a href="${data.adminUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        View in Admin →
      </a>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body:    JSON.stringify({
        from,
        to:      adminEmail,
        subject: `New Booking — ${data.fullName} · ${data.serviceRequested}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { message?: string }).message ?? `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
