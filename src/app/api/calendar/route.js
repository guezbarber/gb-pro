import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Crear cliente OAuth con los tokens del barbero
const getOAuthClient = (accessToken, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
};

// ✅ POST — Crear evento en Google Calendar
export async function POST(request) {
  try {
    const { barber_id, appointment_id, client_name, servicio, start_time, duration_minutes } = await request.json();

    // Buscar tokens del barbero
    const { data: tokens, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("barber_id", barber_id)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json({ error: "Google Calendar no conectado" }, { status: 400 });
    }

    const oauth2Client = getOAuthClient(tokens.access_token, tokens.refresh_token);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const inicio = new Date(start_time);
    const fin = new Date(inicio.getTime() + (duration_minutes || 30) * 60000);

    const evento = await calendar.events.insert({
      calendarId: tokens.calendar_id || "primary",
      requestBody: {
        summary: `${servicio} — ${client_name}`,
        description: `Turno agendado via GBPro\nCliente: ${client_name}\nServicio: ${servicio}`,
        start: { dateTime: inicio.toISOString() },
        end: { dateTime: fin.toISOString() },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      },
    });

    // Guardar el event_id para poder borrarlo después
    await supabase
      .from("appointments")
      .update({ google_event_id: evento.data.id })
      .eq("id", appointment_id);

    return NextResponse.json({ success: true, eventId: evento.data.id });

  } catch (err) {
    console.error("Error creando evento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE — Borrar evento de Google Calendar
export async function DELETE(request) {
  try {
    const { barber_id, appointment_id } = await request.json();

    const { data: tokens } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("barber_id", barber_id)
      .single();

    if (!tokens) {
      return NextResponse.json({ error: "Google Calendar no conectado" }, { status: 400 });
    }

    const { data: appt } = await supabase
      .from("appointments")
      .select("google_event_id")
      .eq("id", appointment_id)
      .single();

    if (!appt?.google_event_id) {
      return NextResponse.json({ success: true, mensaje: "No había evento en Calendar" });
    }

    const oauth2Client = getOAuthClient(tokens.access_token, tokens.refresh_token);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: tokens.calendar_id || "primary",
      eventId: appt.google_event_id,
    });

    await supabase
      .from("appointments")
      .update({ google_event_id: null })
      .eq("id", appointment_id);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Error borrando evento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ GET — Verificar si el barbero tiene Google Calendar conectado
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const barber_id = searchParams.get("barber_id");

    if (!barber_id) {
      return NextResponse.json({ conectado: false });
    }

    const { data: tokens } = await supabase
      .from("google_calendar_tokens")
      .select("id, expires_at")
      .eq("barber_id", barber_id)
      .single();

    return NextResponse.json({ conectado: !!tokens });

  } catch (err) {
    return NextResponse.json({ conectado: false });
  }
}