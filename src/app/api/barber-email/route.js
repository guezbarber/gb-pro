import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const barber_id = searchParams.get("barber_id");

  if (!barber_id) {
    return NextResponse.json({ error: "Falta barber_id" }, { status: 400 });
  }

  const { data: { user }, error } = await supabase.auth.admin.getUserById(barber_id);

  if (error || !user) {
    return NextResponse.json({ email: null });
  }

  return NextResponse.json({ email: user.email });
}