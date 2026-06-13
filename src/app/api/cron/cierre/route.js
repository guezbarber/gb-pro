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

  // Hora actual en Uruguay (UTC-3)
  const ahora = new Date();
  const horaUY = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  const horaActual = `${String(horaUY.getUTCHours()).padStart(2, "0")}:${String(horaUY.getUTCMinutes()).padStart(2, "0")}`;

  // Buscar barberos con recordatorio activo cuya hora de cierre coincide (±15 min)
  const { data: settings } = await supabase
    .from("barber_settings")
    .select("barber_id, barber_name, close_time")
    .eq("recordatorio_cierre", true)
    .not("close_time", "is", null);

  if (!settings || settings.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const finHoy = new Date(hoy);
  finHoy.setHours(23, 59, 59, 999);

  const { data: { users } } = await supabase.auth.admin.listUsers();

  let enviados = 0;

  for (const setting of settings) {
    if (!setting.close_time) continue;

    // Verificar si la hora de cierre coincide con la hora actual (ventana de 15 min)
    const [hCierre, mCierre] = setting.close_time.split(":").map(Number);
    const [hActual, mActual] = horaActual.split(":").map(Number);
    const minutosCierre = hCierre * 60 + mCierre;
    const minutosActual = hActual * 60 + mActual;

    if (Math.abs(minutosCierre - minutosActual) > 14) continue;

    const user = users?.find(u => u.id === setting.barber_id);
    if (!user?.email) continue;

    // Turnos de hoy
    const { data: turnosHoy } = await supabase
      .from("appointments")
      .select("*, services(name, price)")
      .eq("barber_id", setting.barber_id)
      .gte("start_time", hoy.toISOString())
      .lte("start_time", finHoy.toISOString())
      .order("start_time", { ascending: true });

    const completados = (turnosHoy || []).filter(t => t.status === "completado");
    const totalIngresos = completados.reduce((s, t) => s + (t.services?.price || 0), 0);
    const totalTurnos = turnosHoy?.length || 0;
    const totalCompletados = completados.length;
    const totalFaltaron = (turnosHoy || []).filter(t => t.status === "falto").length;

    const turnosFormateados = (turnosHoy || []).map(t => ({
      cliente: t.client_name,
      servicio: t.services?.name || "Turno",
      hora: new Date(t.start_time).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" }),
      precio: t.services?.price || 0,
      status: t.status || "pendiente",
    }));

    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "resumen_cierre_barbero",
          barberoEmail: user.email,
          barberoNombre: setting.barber_name,
          turnos: turnosFormateados,
          totalTurnos,
          totalCompletados,
          totalFaltaron,
          totalIngresos,
        }),
      });
      enviados++;
    } catch (err) {
      console.error("Error enviando cierre:", err);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}