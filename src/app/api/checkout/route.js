import { NextResponse } from "next/server";
import Stripe from "stripe";

// Iniciamos Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request) {
  try {
    const body = await request.json();
    const { priceId, userId } = body;

    // Esto imprimirá en tu terminal de VS Code lo que está llegando
    console.log("💳 Petición recibida:", { priceId, userId });

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Falta la STRIPE_SECRET_KEY en el archivo .env.local");
    }

    // Aseguramos la URL de retorno
    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard/agenda?success=true`,
      cancel_url: `${origin}/dashboard/suscripcion?canceled=true`,
      client_reference_id: userId || "barbero-anonimo",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Esto imprimirá el error real del banco en tu terminal
    console.error("🔥 Error de Stripe:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}