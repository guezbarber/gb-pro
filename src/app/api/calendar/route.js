import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Builds an OAuth2 client with the stored tokens and wires up auto-persist on refresh.
// expiry_date lets googleapis know to refresh proactively instead of waiting for a 401.
const getOAuthClient = (tokens, barber_id) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
  });

  // Fired by googleapis whenever it issues a new access token.
  // Persists the refreshed credentials so the next call doesn't need to refresh again.
  oauth2Client.on("tokens", async (newTokens) => {
    const update = { access_token: newTokens.access_token };
    if (newTokens.expiry_date) {
      update.expires_at = new Date(newTokens.expiry_date).toISOString();
    }
    if (newTokens.refresh_token) {
      update.refresh_token = newTokens.refresh_token;
    }
    await supabase
      .from("google_calendar_tokens")
      .update(update)
      .eq("barber_id", barber_id);
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

    const oauth2Client = getOAuthClient(tokens, barber_id);
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

    const oauth2Client = getOAuthClient(tokens, barber_id);
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
