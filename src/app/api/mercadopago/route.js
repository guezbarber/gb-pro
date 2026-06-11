import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// POST — Crear preferencia de pago para una seña
export async function POST(request) {
  try {
    const {
      barber_id,
      service_name,
      service_price,
      porcentaje_sena,
      client_name,
      client_email,
      fecha,
      hora,
      appointment_temp_id, // ID temporal para rastrear el pago
    } = await request.json();

    if (!barber_id || !service_price || !porcentaje_sena) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Calcular el monto de la seña
    const montoSena = Math.round((service_price * porcentaje_sena) / 100);

    if (montoSena <= 0) {
      return NextResponse.json({ error: "El monto de la seña debe ser mayor a 0" }, { status: 400 });
    }

    const preference = new Preference(mp);

    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: appointment_temp_id || `sena_${Date.now()}`,
            title: `Seña — ${service_name}`,
            description: `Reserva para el ${fecha} a las ${hora} — ${client_name}`,
            quantity: 1,
            unit_price: montoSena,
            currency_id: "UYU",
          },
        ],
        payer: {
          name: client_name,
          email: client_email || undefined,
        },
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/reserva/${barber_id}/pago-exitoso`,
          failure: `${process.env.NEXTAUTH_URL}/reserva/${barber_id}/pago-fallido`,
          pending: `${process.env.NEXTAUTH_URL}/reserva/${barber_id}/pago-pendiente`,
        },
        auto_return: "approved",
        external_reference: appointment_temp_id || `sena_${barber_id}_${Date.now()}`,
        notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`,
        metadata: {
          barber_id,
          appointment_temp_id,
          porcentaje_sena,
        },
      },
    });

    return NextResponse.json({
      success: true,
      preference_id: preferenceData.id,
      init_point: preferenceData.init_point,       // URL de pago producción
      sandbox_init_point: preferenceData.sandbox_init_point, // URL de pago test
      monto_sena: montoSena,
    });

  } catch (err) {
    console.error("Error creando preferencia MP:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}