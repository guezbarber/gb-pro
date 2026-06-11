import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

const MP_PLAN_PRO_ID = "a29a41c5a8224f9ea26a3e18f33b37c3";
const MP_PLAN_BOSS_ID = "cbf30b554ad042f6b7005c9780f07038";

export async function POST(request) {
  try {
    // ✅ Validar firma del webhook
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    if (MP_WEBHOOK_SECRET && xSignature) {
      const url = new URL(request.url);
      const dataId = url.searchParams.get("data.id") || "";

      const signatureParts = xSignature.split(",");
      const ts = signatureParts.find(p => p.startsWith("ts="))?.split("=")[1];
      const v1 = signatureParts.find(p => p.startsWith("v1="))?.split("=")[1];

      const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      const encoder = new TextEncoder();
      const keyData = encoder.encode(MP_WEBHOOK_SECRET);
      const msgData = encoder.encode(template);

      const cryptoKey = await crypto.subtle.importKey(
        "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
      const hashHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

      if (hashHex !== v1) {
        console.error("Firma inválida en webhook MP");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { type, data } = body;

    console.log("Webhook MP:", type, data);

    if (type !== "subscription_preapproval") {
      return NextResponse.json({ received: true });
    }

    const preapprovalId = data?.id;
    if (!preapprovalId) return NextResponse.json({ received: true });

    // Obtener detalles de la suscripción desde MP
    const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const suscripcion = await res.json();
    console.log("Suscripción:", suscripcion.status, suscripcion.preapproval_plan_id);

    if (!suscripcion || suscripcion.status !== "authorized") {
      return NextResponse.json({ received: true });
    }

    // Determinar plan
    const planId = suscripcion.preapproval_plan_id;
    let nuevoPlan = null;
    if (planId === MP_PLAN_PRO_ID) nuevoPlan = "PRO";
    if (planId === MP_PLAN_BOSS_ID) nuevoPlan = "BOSS";

    if (!nuevoPlan) return NextResponse.json({ received: true });

    // Buscar usuario por email
    const emailPagador = suscripcion.payer_email;
    if (!emailPagador) return NextResponse.json({ received: true });

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const usuario = users?.find(u => u.email === emailPagador);

    if (!usuario) {
      console.log("Usuario no encontrado:", emailPagador);
      return NextResponse.json({ received: true });
    }

    // Activar plan en Supabase
    await supabase
      .from("barber_settings")
      .update({ plan: nuevoPlan })
      .eq("barber_id", usuario.id);

    await supabase
      .from("barbershops")
      .update({ plan: nuevoPlan })
      .eq("owner_id", usuario.id);

    console.log(`✅ Plan ${nuevoPlan} activado para ${emailPagador}`);
    return NextResponse.json({ received: true, plan: nuevoPlan });

  } catch (err) {
    console.error("Error webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}