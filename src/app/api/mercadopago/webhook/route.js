import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Solo procesamos notificaciones de pagos
    if (type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Obtener los detalles del pago desde MP
    const paymentClient = new Payment(mp);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    // Buscar el turno por external_reference y marcarlo como seña pagada
    const externalRef = payment.external_reference;
    if (!externalRef) {
      return NextResponse.json({ received: true });
    }

    // Actualizar el turno con el pago confirmado
    await supabase
      .from("appointments")
      .update({
        sena_pagada: true,
        sena_monto: payment.transaction_amount,
        sena_payment_id: String(paymentId),
      })
      .eq("mp_external_reference", externalRef);

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Error webhook MP:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}