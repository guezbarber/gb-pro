import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const footer = `
  <div style="background: #f4f4f5; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
    <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Powered by <strong>GB PRO</strong> — gbpro.app</p>
  </div>
`;

const header = `
  <div style="background: #09090b; padding: 32px; text-align: center;">
    <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -1px;">GB PRO</h1>
  </div>
`;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      tipo,
      // Cliente
      clienteEmail, clienteNombre,
      // Barbero
      barberoEmail, barberoNombre,
      // Turno
      servicio, fecha, hora, puntos,
      // Resumen diario
      turnos,
    } = body;

    let subject = "";
    let html = "";
    let to = clienteEmail;

    // ─────────────────────────────────────────
    // EMAILS AL CLIENTE
    // ─────────────────────────────────────────

    if (tipo === "confirmacion_turno") {
      subject = `Turno confirmado en ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Tu turno está confirmado</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, aquí están los detalles de tu reserva:</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Barbería</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${barberoNombre}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td></tr>
                <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td></tr>
              </table>
            </div>
            <p style="color: #71717a; font-size: 14px; text-align: center;">Si necesitas cancelar, contáctanos por WhatsApp.</p>
          </div>
          ${footer}
        </div>
      `;
    }

    if (tipo === "recordatorio_turno") {
      subject = `Recordatorio: mañana tienes turno en ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Te esperamos mañana</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, recordatorio de tu turno en <strong>${barberoNombre}</strong>.</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td></tr>
                <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td></tr>
              </table>
            </div>
            <p style="color: #71717a; font-size: 14px; text-align: center;">Si necesitas cancelar, avísanos antes del turno.</p>
          </div>
          ${footer}
        </div>
      `;
    }

    if (tipo === "puntos_ganados") {
      subject = `Ganaste ${puntos} puntos en ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px; text-align: center;">
            <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">+${puntos} puntos</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${clienteNombre}</strong>, acabas de sumar puntos en <strong>${barberoNombre}</strong>.</p>
            <div style="background: #09090b; color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 8px 0;">Puntos ganados</p>
              <p style="font-size: 48px; font-weight: 900; margin: 0;">+${puntos}</p>
            </div>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; text-align: left;">
              <p style="font-size: 13px; color: #71717a; margin: 0 0 8px 0; font-weight: 700;">NIVELES</p>
              <p style="font-size: 13px; margin: 4px 0;">Bronce — 0 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">Plata — 50 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">Oro — 100 pts</p>
              <p style="font-size: 13px; margin: 4px 0;">Diamante — 200 pts</p>
            </div>
          </div>
          ${footer}
        </div>
      `;
    }

    if (tipo === "cumpleanos") {
      subject = `Feliz cumpleaños de parte de ${barberoNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px; text-align: center;">
            <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">Feliz cumpleaños, ${clienteNombre}</h2>
            <p style="color: #71717a; margin-bottom: 24px;">En tu día especial, <strong>${barberoNombre}</strong> te tiene una sorpresa.</p>
            <div style="background: #09090b; color: white; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <p style="font-size: 14px; color: #a1a1aa; margin: 0 0 8px 0;">Regalo de cumpleaños</p>
              <p style="font-size: 48px; font-weight: 900; margin: 0;">+${puntos || 250}</p>
              <p style="font-size: 14px; color: #a1a1aa; margin: 8px 0 0 0;">puntos para ti</p>
            </div>
            <p style="color: #71717a; font-size: 14px;">Los puntos ya están en tu cuenta. Úsalos en tu próxima visita.</p>
          </div>
          ${footer}
        </div>
      `;
    }

    // ─────────────────────────────────────────
    // EMAILS AL BARBERO
    // ─────────────────────────────────────────

    if (tipo === "nuevo_turno_barbero") {
      to = barberoEmail;
      subject = `Nueva reserva — ${clienteNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Nueva reserva recibida</h2>
            <p style="color: #71717a; margin-bottom: 24px;"><strong>${clienteNombre}</strong> acaba de agendar un turno.</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Cliente</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${clienteNombre}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td></tr>
                <tr style="border-top: 1px solid #e4e4e7;"><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td></tr>
              </table>
            </div>
            <a href="https://gbpro.app/dashboard/agenda" style="display: block; background: #09090b; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; text-decoration: none;">Ver en la agenda</a>
          </div>
          ${footer}
        </div>
      `;
    }

    if (tipo === "turno_cancelado_barbero") {
      to = barberoEmail;
      subject = `Turno cancelado — ${clienteNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Turno cancelado</h2>
            <p style="color: #71717a; margin-bottom: 24px;"><strong>${clienteNombre}</strong> canceló su turno.</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Cliente</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${clienteNombre}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Servicio</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${servicio}</td></tr>
                <tr style="border-top: 1px solid #fecaca;"><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Fecha</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${fecha}</td></tr>
                <tr><td style="padding: 8px 0; color: #71717a; font-size: 14px;">Hora</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${hora}</td></tr>
              </table>
            </div>
            <a href="https://gbpro.app/dashboard/agenda" style="display: block; background: #09090b; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; text-decoration: none;">Ver agenda</a>
          </div>
          ${footer}
        </div>
      `;
    }

    if (tipo === "resumen_diario_barbero") {
      to = barberoEmail;
      const totalTurnos = turnos?.length || 0;
      const totalIngresos = turnos?.reduce((s, t) => s + (t.precio || 0), 0) || 0;
      subject = `Tu agenda de hoy — ${totalTurnos} turno${totalTurnos !== 1 ? "s" : ""}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff;">
          ${header}
          <div style="padding: 32px;">
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">Tu agenda de hoy</h2>
            <p style="color: #71717a; margin-bottom: 24px;">Hola <strong>${barberoNombre}</strong>, aquí está tu resumen del día.</p>

            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
              <div style="flex: 1; background: #09090b; color: white; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 4px 0;">TURNOS HOY</p>
                <p style="font-size: 32px; font-weight: 900; margin: 0;">${totalTurnos}</p>
              </div>
              <div style="flex: 1; background: #f4f4f5; border-radius: 12px; padding: 16px; text-align: center;">
                <p style="font-size: 12px; color: #71717a; margin: 0 0 4px 0;">INGRESOS EST.</p>
                <p style="font-size: 32px; font-weight: 900; margin: 0;">$${totalIngresos}</p>
              </div>
            </div>

            ${totalTurnos > 0 ? `
              <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 13px; color: #71717a; font-weight: 700; margin: 0 0 12px 0;">DETALLE DE TURNOS</p>
                ${turnos.map(t => `
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
                    <div>
                      <p style="margin: 0; font-weight: 700; font-size: 14px;">${t.cliente}</p>
                      <p style="margin: 0; color: #71717a; font-size: 12px;">${t.servicio}</p>
                    </div>
                    <p style="margin: 0; font-weight: 700; font-size: 14px;">${t.hora}</p>
                  </div>
                `).join("")}
              </div>
            ` : `
              <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="color: #71717a; margin: 0;">No tienes turnos para hoy.</p>
              </div>
            `}

            <a href="https://gbpro.app/dashboard/agenda" style="display: block; background: #09090b; color: white; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; text-decoration: none;">Ver agenda completa</a>
          </div>
          ${footer}
        </div>
      `;
    }

    if (!subject || !html) {
      return NextResponse.json({ error: "Tipo de email no válido" }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json({ error: "No hay destinatario" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "GB PRO <onboarding@resend.dev>",
      to,
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