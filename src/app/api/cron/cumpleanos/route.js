import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  try {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    // ✅ FIX: usar extract para comparar mes y día en columnas de tipo date
    const { data: perfiles, error } = await supabase
      .from("client_profiles")
      .select("*")
      .filter("birthdate", "not.is", null)
      .gte("birthdate", "0001-01-01"); // traemos todos y filtramos en JS

    if (error) throw error;

    // ✅ Filtramos en JavaScript por mes y día
    const cumpleaneros = (perfiles || []).filter(p => {
      if (!p.birthdate) return false;
      const [, pMes, pDia] = p.birthdate.split("-");
      return pMes === mes && pDia === dia;
    });

    if (cumpleaneros.length === 0) {
      return NextResponse.json({ mensaje: "No hay cumpleaños hoy", total: 0 });
    }

    let emailsEnviados = 0;
    let errores = 0;

    for (const perfil of cumpleaneros) {
      // Buscar email del cliente en sus turnos
      const { data: turno } = await supabase
        .from("appointments")
        .select("client_email, client_name")
        .eq("barber_id", perfil.barber_id)
        .eq("client_key", perfil.client_key)
        .not("client_email", "is", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!turno?.client_email) continue;

      // Buscar nombre de la barbería
      const { data: settings } = await supabase
        .from("barber_settings")
        .select("barber_name")
        .eq("barber_id", perfil.barber_id)
        .single();

      const barberoNombre = settings?.barber_name || "Tu barbería";

      // Sumar 50 puntos de regalo
      const { data: puntosActuales } = await supabase
        .from("client_points")
        .select("puntos")
        .eq("barber_id", perfil.barber_id)
        .eq("client_key", perfil.client_key)
        .maybeSingle();

      const nuevosPuntos = (puntosActuales?.puntos || 0) + 50;

      await supabase
        .from("client_points")
        .upsert({
          barber_id: perfil.barber_id,
          client_key: perfil.client_key,
          client_name: perfil.client_name,
          puntos: nuevosPuntos,
        }, { onConflict: "barber_id,client_key" });

      // Enviar email de cumpleaños
      const { error: emailError } = await resend.emails.send({
        from: "GB PRO <onboarding@resend.dev>",
        to: turno.client_email,
        subject: `🎂 ¡Feliz cumpleaños ${perfil.client_name}! Regalo de ${barberoNombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
            <div style="background: #09090b; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
            </div>
            <div style="padding: 32px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">🎂</div>
              <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">¡Feliz cumpleaños, ${perfil.client_name}!</h2>
              <p style="color: #71717a; margin-bottom: 24px; font-size: 16px;">
                Todo el equipo de <strong>${barberoNombre}</strong> te desea un día increíble.
              </p>
              <div style="background: #09090b; color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 8px 0;">🎁 Regalo de cumpleaños</p>
                <p style="font-size: 48px; font-weight: 900; margin: 0;">+50</p>
                <p style="font-size: 16px; color: #a1a1aa; margin: 8px 0 0 0;">puntos de fidelidad</p>
              </div>
              <p style="color: #71717a; font-size: 14px;">Ya sumamos 50 puntos a tu cuenta. ¡Úsalos en tu próxima visita! 🎉</p>
            </div>
            <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong></p>
            </div>
          </div>
        `,
      });

      if (emailError) errores++;
      else emailsEnviados++;
    }

    return NextResponse.json({
      mensaje: "Cron de cumpleaños ejecutado",
      total: cumpleaneros.length,
      emailsEnviados,
      errores,
    });

  } catch (err) {
    console.error("Error cron cumpleaños:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}