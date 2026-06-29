import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ADMIN_EMAIL = "guezbarber@gmail.com";
const BASE_URL = "https://gbpro.app";

function plantillaEmail(titulo, mensajeHtml, baseDeUnsub) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr><td style="background-color:#0a0a0a;padding:28px 32px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">GB PRO</span>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0a0a0a;line-height:1.3;">${titulo}</h1>
            <div style="font-size:15px;line-height:1.7;color:#3f3f46;">${mensajeHtml}</div>
          </td></tr>
          <tr><td style="padding:0 32px 28px;">
            <div style="border-top:1px solid #e4e4e7;padding-top:20px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">Recibiste este correo porque usas GB PRO.</p>
              <a href="${baseDeUnsub}" style="font-size:12px;color:#71717a;text-decoration:underline;">Darme de baja de estos correos</a>
            </div>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;">GB PRO &mdash; Gestiona tu negocio</p>
      </td></tr>
    </table>
  </body>
  </html>`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { titulo, mensaje, adminEmail } = body;

    // Seguridad: solo el admin puede disparar esto
    if (adminEmail !== ADMIN_EMAIL) {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!titulo || !mensaje) {
      return Response.json({ error: "Falta titulo o mensaje" }, { status: 400 });
    }

    // 1. Traer todos los barberos que aceptan novedades
    const { data: settings, error: errSettings } = await supabaseAdmin
      .from("barber_settings")
      .select("barber_id, acepta_novedades")
      .eq("acepta_novedades", true);

    if (errSettings) {
      return Response.json({ error: errSettings.message }, { status: 500 });
    }

    if (!settings || settings.length === 0) {
      return Response.json({ enviados: 0, mensaje: "No hay barberos suscritos." });
    }

    // 2. Para cada barber_id, sacar su email de auth.users
    const correos = [];
    for (const s of settings) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(s.barber_id);
      if (userData?.user?.email) {
        correos.push({ id: s.barber_id, email: userData.user.email });
      }
    }

    if (correos.length === 0) {
      return Response.json({ enviados: 0, mensaje: "No se encontraron correos." });
    }

    // 3. Convertir saltos de linea del mensaje a HTML
    const mensajeHtml = mensaje
      .split("\n")
      .map((linea) => linea.trim() === "" ? "<br/>" : `<p style="margin:0 0 12px;">${linea}</p>`)
      .join("");

    // 4. Enviar uno por uno (cada uno con su link de baja personalizado)
    let enviados = 0;
    let fallidos = 0;

    for (const c of correos) {
      const linkBaja = `${BASE_URL}/baja?id=${c.id}`;
      try {
        await resend.emails.send({
          from: "GB PRO <noreply@gbpro.app>",
          to: c.email,
          subject: titulo,
          html: plantillaEmail(titulo, mensajeHtml, linkBaja),
        });
        enviados++;
      } catch {
        fallidos++;
      }
      // pequena pausa para no saturar Resend
      await new Promise((r) => setTimeout(r, 120));
    }

    return Response.json({ enviados, fallidos, total: correos.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}