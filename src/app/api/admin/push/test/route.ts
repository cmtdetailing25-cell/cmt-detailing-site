import { NextResponse } from "next/server";
import { sendPushToAll, markEmailFallback } from "@/lib/webpush";
import { sendBookingEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://cmtdetailing.com";
    const adminUrl = `${appUrl}/admin/bookings`;

    const result = await sendPushToAll(
      {
        title:              "Test Notification — CMT Admin",
        body:               "Push notifications are working correctly.",
        url:                adminUrl,
        tag:                "test",
        requireInteraction: false,
      },
      "test",
    );

    let emailResult: { ok: boolean; error?: string } | null = null;

    // Email fallback if nothing was delivered
    if (result.sent === 0) {
      emailResult = await sendBookingEmail({
        fullName:         "Test User",
        phone:            "555-000-0000",
        email:            "test@example.com",
        vehicleYear:      "2024",
        vehicleMake:      "Test",
        vehicleModel:     "Vehicle",
        serviceRequested: "Test Push Notification",
        town:             "Taunton",
        preferredDate:    new Date().toLocaleDateString(),
        preferredTime:    "now",
        notes:            "This is a test notification sent from the CMT Admin push debug panel.",
        adminUrl,
      });
      if (emailResult.ok) await markEmailFallback("test");
    }

    return NextResponse.json({
      ok: true,
      push:  result,
      email: emailResult,
    });
  } catch (err) {
    console.error("[push/test]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
