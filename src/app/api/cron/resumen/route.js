import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy);
  finHoy.setHours(23, 59, 59, 999);

  // Traer todos los barberos con email
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const usersConEmail = users?.filter(u => u.email) || [];

  let enviados = 0;

  for (const user of usersConEmail) {
    // Obtener datos del barbero
    const { data: settings } = await supabase
      .from("barber_settings")
      .select("barber_name")
      .eq("barber_id", user.id)
      .single();

    if (!settings) continue;

    // Turnos de hoy de este barbero
    const { data: turnosHoy } = await supabase
      .from("appointments")
      .select("*, services(name, price)")
      .eq("barber_id", user.id)
      .gte("start_time", hoy.toISOString())
      .lte("start_time", finHoy.toISOString())
      .order("start_time", { ascending: true });

    const turnosFormateados = (turnosHoy || []).map(t => {
      const fecha = new Date(t.start_time);
      return {
        cliente: t.client_name,
        servicio: t.services?.name || "Turno",
        hora: fecha.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
        precio: t.services?.price || 0,
      };
    });

    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "resumen_diario_barbero",
          barberoEmail: user.email,
          barberoNombre: settings.barber_name,
          turnos: turnosFormateados,
        }),
      });
      enviados++;
    } catch (err) {
      console.error("Error enviando resumen:", err);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}