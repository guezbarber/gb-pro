import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { tipo, clienteEmail, clienteNombre, barberoNombre, servicio, fecha, hora, puntos } = body;

    let subject = "";
    let html = "";

    if (tipo === "confirmacion_turno") {
      subject = `✂️ Turno confirmado en ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          <div style="background: #09090b; padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">¡Tu turno está confirmado! ✅</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, aquí están los detalles de tu reserva:</p>
            
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Barbería</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${barberoNombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td>
                </tr>
                <tr style="border-top: 1px solid #e4e4e7;">
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td>
                </tr>
              </table>
            </div>

            <p style="color: #71717a; font-size: 14px; text-align: center;">Si necesitas cancelar o reprogramar, contáctanos por WhatsApp.</p>
          </div>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong> — El sistema operativo de la barbería</p>
          </div>
        </div>
      `;
    }

    if (tipo === "puntos_ganados") {
      subject = `⭐ ¡Ganaste ${puntos} puntos en ${barberoNombre}!`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          <div style="background: #09090b; padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
          </div>
          <div style="padding: 32px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">⭐</div>
            <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">¡Ganaste ${puntos} puntos!</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, acabas de sumar puntos en <strong>${barberoNombre}</strong>. Sigue viniendo para desbloquear recompensas.</p>

            <div style="background: #09090b; color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 8px 0;">Puntos ganados</p>
              <p style="font-size: 48px; font-weight: 900; margin: 0;">+${puntos}</p>
            </div>

            <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; text-align: left;">
              <p style="font-size: 13px; color: #71717a; margin: 0 0 8px 0; font-weight: 700;">NIVELES DE FIDELIDAD</p>
              <p style="font-size: 13px; margin: 4px 0;">🥉 Bronce — 0 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">🥈 Plata — 50 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">🥇 Oro — 100 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">💎 Diamante — 200 pts</p>
            </div>
          </div>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong> — El sistema operativo de la barbería</p>
          </div>
        </div>
      `;
    }

    // ✅ NUEVO — Recordatorio 24 horas antes del turno
    if (tipo === "recordatorio_turno") {
      subject = `Recordatorio: mañana tienes turno en ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          <div style="background: #09090b; padding: 32px; text-align: center;">
            <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
          </div>
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Te esperamos mañana</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, este es un recordatorio de tu turno en <strong>${barberoNombre}</strong>.</p>

            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td>
                </tr>
                <tr style="border-top: 1px solid #e4e4e7;">
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td>
                  <td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td>
                </tr>
              </table>
            </div>

            <p style="color: #71717a; font-size: 14px; text-align: center;">Si necesitas cancelar o reprogramar, contáctanos por WhatsApp antes de tu turno.</p>
          </div>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong> — El sistema operativo de la barbería</p>
          </div>
        </div>
      `;
    }

    if (!subject || !html) {
      return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "GB PRO <onboarding@resend.dev>",
      to: clienteEmail,
      subject,
      html,
    });

    if (error) {
      console.error("Error Resend:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Error email route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}