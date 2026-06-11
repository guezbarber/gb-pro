// ============================================================
// GB PRO — Crear planes de suscripción en MercadoPago
// Ejecutar UNA SOLA VEZ con: node crear-planes-mp.js
// ============================================================

const MP_ACCESS_TOKEN = "TEST-APP_USR-3934452298319826-061010-21fb0a5b5f70e85b5944f1cf99f1f171-3464420152"; // Pega tu token de producción cuando lo tengas
// Por ahora usa el de test: TEST-APP_USR-3934452298319826-...

async function crearPlan(nombre, monto, descripcion) {
  const res = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      reason: nombre,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: monto,
        currency_id: "USD",
      },
      payment_methods_allowed: {
        payment_types: [{ id: "credit_card" }, { id: "debit_card" }],
      },
      back_url: "https://gb-pro-blue.vercel.app/dashboard/suscripcion",
    }),
  });

  const data = await res.json();

  if (data.id) {
    console.log(`\n✅ Plan creado: ${nombre}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Monto: $${monto} USD/mes`);
    console.log(`   Estado: ${data.status}`);
    return data.id;
  } else {
    console.error(`\n❌ Error creando ${nombre}:`, JSON.stringify(data, null, 2));
    return null;
  }
}

async function main() {
  console.log("Creando planes de suscripción GB PRO en MercadoPago...\n");

  const idPro = await crearPlan(
    "GB PRO — Barbero Independiente",
    12.99,
    "Turnos ilimitados, CRM, finanzas, marketing y más"
  );

  const idBoss = await crearPlan(
    "GB BOSS — Barbería con Equipo",
    24.99,
    "Todo el plan PRO + hasta 5 barberos con acceso propio"
  );

  console.log("\n============================================================");
  console.log("GUARDA ESTOS IDs EN TU .env.local:");
  console.log("============================================================");
  if (idPro) console.log(`MP_PLAN_PRO_ID=${idPro}`);
  if (idBoss) console.log(`MP_PLAN_BOSS_ID=${idBoss}`);
  console.log("============================================================\n");
}

main();