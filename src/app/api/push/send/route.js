import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  "mailto:noreply@gbpro.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const { barber_id, title, body, url } = await request.json();

    if (!barber_id) return NextResponse.json({ error: "Falta barber_id" }, { status: 400 });

    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("barber_id", barber_id)
      .single();

    if (!sub) return NextResponse.json({ ok: false, mensaje: "Sin suscripción" });

    await webpush.sendNotification(
      sub.subscription,
      JSON.stringify({ title, body, url: url || "/dashboard/agenda" })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error push:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}