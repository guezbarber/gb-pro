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
    // ✅ Buscamos turnos de mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);

    const mananaFin = new Date(manana);
    mananaFin.setHours(23, 59, 59, 999);

    const { data: turnos, error } = await supabase
      .from("appointments")
      .select("*, services(name, price), barber_id")
      .gte("start_time", manana.toISOString())
      .lte("start_time", mananaFin.toISOString())
      .eq("status", "pendiente")
      .not("client_email", "is", null);

    if (error) throw error;

    if (!turnos || turnos.length === 0) {
      return NextResponse.json({ mensaje: "No hay turnos mañana con email", total: 0 });
    }

    let emailsEnviados = 0;
    let errores = 0;

    for (const turno of turnos) {
      // Buscar nombre de la barbería
      const { data: settings } = await supabase
        .from("barber_settings")
        .select("barber_name, whatsapp_number")
        .eq("barber_id", turno.barber_id)
        .single();

      const barberoNombre = settings?.barber_name || "Tu barbería";
      const whatsapp = settings?.whatsapp_number || "";

      const fecha = new Date(turno.start_time);
      const fechaStr = fecha.toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long" });
      const horaStr = fecha.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });

      const { error: emailError } = await resend.emails.send({
        from: "GB PRO <onboarding@resend.dev>",
        to: turno.client_email,
        subject: `⏰ Recordatorio: Tu turno mañana en ${barberoNombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
            <div style="background: #09090b; padding: 32px; text-align: center;">
              <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">⏰ Recordatorio de turno</h2>
              <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${turno.client_name}</strong>, te recordamos que mañana tenés un turno agendado.</p>

              <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Barbería</td>
                    <td style="padding: 8px 0; font-weight: 700; text-align: right;">${barberoNombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td>
                    <td style="padding: 8px 0; font-weight: 700; text-align: right;">${turno.services?.name || "Corte"}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e4e4e7;">
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td>
                    <td style="padding: 8px 0; font-weight: 700; text-align: right; text-transform: capitalize;">${fechaStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td>
                    <td style="padding: 8px 0; font-weight: 700; text-align: right;">${horaStr}</td>
                  </tr>
                  ${turno.services?.price ? `
                  <tr style="border-top: 1px solid #e4e4e7;">
                    <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Total</td>
                    <td style="padding: 8px 0; font-weight: 900; text-align: right; font-size: 18px;">$${turno.services.price}</td>
                  </tr>` : ""}
                </table>
              </div>

              ${whatsapp ? `
              <a href="https://wa.me/${whatsapp}" style="display: block; background: #25D366; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; text-decoration: none; margin-bottom: 16px;">
                💬 Avisar por WhatsApp si no puedo ir
              </a>` : ""}

              <p style="color: #71717a; font-size: 13px; text-align: center;">Si necesitás cancelar o reprogramar, contactá a tu barbero con anticipación.</p>
            </div>
            <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong> — El sistema operativo de la barbería</p>
            </div>
          </div>
        `,
      });

      if (emailError) errores++;
      else emailsEnviados++;
    }

    return NextResponse.json({
      mensaje: "Recordatorios enviados",
      total: turnos.length,
      emailsEnviados,
      errores,
    });

  } catch (err) {
    console.error("Error cron recordatorio:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}