import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Creamos un cliente de Supabase con poderes absolutos usando la llave maestra
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Error de seguridad en Webhook:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Si el evento es un pago completado con éxito...
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Stripe nos devuelve el ID del barbero que mandamos al crear el pago
    const userId = session.metadata?.userId || session.client_reference_id;
    
    console.log('✅ ¡BINGO! Pago exitoso. ID de Sesión:', session.id);
    console.log('👤 ID del Barbero que pagó:', userId);

    if (userId) {
      // ¡Aquí ocurre la magia! Actualizamos a PRO en la tabla correcta de Supabase
      const { data, error } = await supabaseAdmin
        .from('barber_settings') // <--- ¡AQUÍ ESTÁ CORREGIDO!
        .update({ 
          plan: 'PRO',           
          updated_at: new Date() 
        })
        .eq('barber_id', userId); // Cambié 'id' por 'barber_id' guiándome por tu captura

      if (error) {
        console.error('❌ Error actualizando Supabase:', error.message);
      } else {
        console.log('💎 ¡Barbero actualizado a PRO en la base de datos!');
      }
    } else {
      console.log('⚠️ El pago entró, pero no se encontró el ID del barbero en la sesión.');
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}