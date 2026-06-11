"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function SuscripcionExitoPage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    verificarPlan();
  }, []);

  const verificarPlan = async () => {
    // Esperar 3 segundos para que el webhook procese el pago
    await new Promise(r => setTimeout(r, 3000));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("barber_settings")
      .select("plan")
      .eq("barber_id", user.id)
      .single();

    if (data?.plan) setPlan(data.plan);
    setVerificando(false);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">

        <div className="bg-zinc-950 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          {verificando ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
              </div>
              <h2 className="text-xl font-black">Verificando tu pago...</h2>
              <p className="text-muted-foreground text-sm">Esto tarda unos segundos.</p>
            </>
          ) : plan && plan !== "basico" ? (
            <>
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check size={32} strokeWidth={2.5} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-black">Plan {plan} activado</h2>
              <p className="text-muted-foreground text-sm">
                Tu suscripción está activa. Ya tienes acceso a todas las funciones.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <h2 className="text-xl font-black">Pago en proceso</h2>
              <p className="text-muted-foreground text-sm">
                MercadoPago está confirmando tu pago. Puede tardar unos minutos. Si ya pagaste, tu plan se activará automáticamente.
              </p>
            </>
          )}
        </div>

        <a href="/dashboard">
          <Button className="w-full h-12 font-bold bg-zinc-950 hover:bg-zinc-800 text-white">
            Ir al dashboard
          </Button>
        </a>

        <p className="text-xs text-muted-foreground">
          ¿Problemas? Escríbenos a{" "}
          <a href="mailto:soporte@gbpro.app" className="font-bold hover:text-foreground">
            soporte@gbpro.app
          </a>
        </p>
      </div>
    </div>
  );
}