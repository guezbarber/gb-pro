"use client";

import { useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function PagoExitosoPage({ params }) {
  const { id: barberId } = use(params);
  const searchParams = useSearchParams();

  useEffect(() => {
    // MercadoPago devuelve external_reference en la URL
    const externalRef = searchParams.get("external_reference");
    const paymentId = searchParams.get("payment_id");

    if (externalRef && paymentId) {
      // Marcar la seña como pagada
      supabase
        .from("appointments")
        .update({
          sena_pagada: true,
          sena_payment_id: paymentId,
        })
        .eq("mp_external_reference", externalRef)
        .then(() => {});
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="bg-zinc-950 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-black">Seña confirmada</h2>
          <p className="text-muted-foreground text-sm">
            Tu pago fue procesado correctamente. Tu turno está confirmado.
          </p>
        </div>

        <a href={`/reserva/${barberId}`}>
          <Button variant="outline" className="w-full font-bold h-12">
            Volver a la barbería
          </Button>
        </a>
      </div>
    </div>
  );
}