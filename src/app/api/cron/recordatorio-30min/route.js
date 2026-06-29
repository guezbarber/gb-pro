import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BASE_URL = "https://gbpro.app";

// Opcional: Le dice a Vercel que le dé el tiempo máximo posible a esta función (depende de tu plan)
export const maxDuration = 60; 

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() + 25 * 60000).toISOString();
    const hasta = new Date(ahora.getTime() + 35 * 60000).toISOString();

    // 1. Traer todos los turnos en esa ventana
    const { data: turnos, error } = await supabaseAdmin
      .from("appointments")
      .select("id, barber_id, client_name, start_time, recordatorio_30_enviado, services(name)")
      .gte("start_time", desde)
      .lte("start_time", hasta)
      .or("recordatorio_30_enviado.is.null,recordatorio_30_enviado.eq.false");

    if (error) throw error;

    if (!turnos || turnos.length === 0) {
      return NextResponse.json({ enviados: 0, mensaje: "No hay turnos en la ventana." });
    }

    // 2. Extraer los IDs ÚNICOS de los barberos para no consultar datos repetidos
    const barberIds = [...new Set(turnos.map((t) => t.barber_id))];

    // 3. Obtener configuración de todos esos barberos en UNA sola consulta
    const { data: settingsData } = await supabaseAdmin
      .from("barber_settings")
      .select("barber_id, barber_name, notif_email")
      .in("barber_id", barberIds);

    // Convertir el arreglo en un diccionario para buscar rápido (mapa mental)
    const settingsMap = {};
    settingsData?.forEach((s) => {
      settingsMap[s.barber_id] = s;
    });

    // 4. Obtener los emails de Auth en paralelo
    const userPromises = barberIds.map((id) => supabaseAdmin.auth.admin.getUserById(id));
    const userResponses = await Promise.all(userPromises);

    const emailMap = {};
    userResponses.forEach((res, index) => {
      if (res.data?.user) {
        emailMap[barberIds[index]] = res.data.user.email;
      }
    });

    // 5. Procesar el envío de todos los emails y actualización de BD EN PARALELO
    const promesasProcesamiento = turnos.map(async (turno) => {
      const settings = settingsMap[turno.barber_id];
      const barberoEmail = emailMap[turno.barber_id];

      // Si el barbero no quiere emails o no tiene, solo actualizamos el turno
      if (!barberoEmail || (settings && settings.notif_email === false)) {
        return supabaseAdmin
          .from("appointments")
          .update({ recordatorio_30_enviado: true })
          .eq("id", turno.id);
      }

      const horaTurno = new Date(turno.start_time).toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Montevideo",
      });

      // Preparamos las dos tareas pesadas (enviar mail y guardar en BD)
      const enviarEmailPromise = fetch(`${BASE_URL}/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "recordatorio_30min_barbero",
          barberoEmail,
          barberoNombre: settings?.barber_name || "GB PRO",
          clienteNombre: turno.client_name,
          servicio: turno.services?.name || "Servicio",
          hora: horaTurno,
        }),
      }).catch((err) => console.error("Error aisaldo en fetch:", err)); 
      // El catch aisla el error para que si un mail falla, no tranque a los demás

      const actualizarDbPromise = supabaseAdmin
        .from("appointments")
        .update({ recordatorio_30_enviado: true })
        .eq("id", turno.id);

      // Ejecutamos ambas tareas al mismo tiempo para este turno específico
      return Promise.all([enviarEmailPromise, actualizarDbPromise]);
    });

    // Esperamos a que TODOS los turnos terminen de procesarse al mismo tiempo
    await Promise.all(promesasProcesamiento);

    return NextResponse.json({ 
      enviados: turnos.length, 
      mensaje: "Procesamiento paralelo completado" 
    });

  } catch (err) {
    console.error("Error en cron:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}