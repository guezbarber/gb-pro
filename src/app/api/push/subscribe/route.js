import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { barber_id, subscription } = await request.json();

    if (!barber_id || !subscription) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ barber_id, subscription }, { onConflict: "barber_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { barber_id } = await request.json();
    await supabase.from("push_subscriptions").delete().eq("barber_id", barber_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}