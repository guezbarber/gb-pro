"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";

export default function PagoFallidoPage({ params }) {
  const { id: barberId } = use(params);

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="bg-zinc-950 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-black">Pago no completado</h2>
          <p className="text-muted-foreground text-sm">
            El pago no fue procesado. Tu turno fue reservado pero la seña sigue pendiente.
          </p>
        </div>

        <a href={`/reserva/${barberId}`}>
          <Button className="w-full font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white">
            Reintentar reserva
          </Button>
        </a>
      </div>
    </div>
  );
}