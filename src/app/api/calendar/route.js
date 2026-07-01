import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Refreshes the access_token if it expires within 5 minutes.
// Throws with reconectar=true if the refresh_token was revoked by the user.
const refreshTokenIfNeeded = async (tokens, barber_id) => {
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0;
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() + fiveMinutes < expiresAt) return tokens;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();

  if (data.error) {
    // Token revoked by the user — clean up so the UI shows "reconnect"
    await supabase.from("google_calendar_tokens").delete().eq("barber_id", barber_id);
    const err = new Error("Google Calendar desconectado. Vuelve a conectar tu cuenta.");
    err.reconectar = true;
    throw err;
  }

  const updated = {
    ...tokens,
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };

  await supabase
    .from("google_calendar_tokens")
    .update({ access_token: updated.access_token, expires_at: updated.expires_at })
    .eq("barber_id", barber_id);

  return updated;
};

const getOAuthClient = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  return oauth2Client;
};

// POST — Crear evento en Google Calendar
export async function POST(request) {
  try {
    const { barber_id, appointment_id, client_name, servicio, start_time, duration_minutes } = await request.json();

    const { data: tokens, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("barber_id", barber_id)
      .single();

    if (tokenError || !tokens) {
      return NextResponse.json({ error: "Google Calendar no conectado" }, { status: 400 });
    }

    const freshTokens = await refreshTokenIfNeeded(tokens, barber_id);
    const oauth2Client = getOAuthClient(freshTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const inicio = new Date(start_time);
    const fin = new Date(inicio.getTime() + (duration_minutes || 30) * 60000);

    const evento = await calendar.events.insert({
      calendarId: freshTokens.calendar_id || "primary",
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

    await supabase
      .from("appointments")
      .update({ google_event_id: evento.data.id })
      .eq("id", appointment_id);

    return NextResponse.json({ success: true, eventId: evento.data.id });

  } catch (err) {
    if (err.reconectar) {
      return NextResponse.json({ error: err.message, reconectar: true }, { status: 401 });
    }
    console.error("Error creando evento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Borrar evento de Google Calendar
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

    const freshTokens = await refreshTokenIfNeeded(tokens, barber_id);
    const oauth2Client = getOAuthClient(freshTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: freshTokens.calendar_id || "primary",
      eventId: appt.google_event_id,
    });

    await supabase
      .from("appointments")
      .update({ google_event_id: null })
      .eq("id", appointment_id);

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err.reconectar) {
      return NextResponse.json({ error: err.message, reconectar: true }, { status: 401 });
    }
    console.error("Error borrando evento:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — Verificar si el barbero tiene Google Calendar conectado
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
