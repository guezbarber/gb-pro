"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";

export default function PagoPendientePage({ params }) {
  const { id: barberId } = use(params);

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="bg-zinc-950 rounded-2xl p-6 text-white">
          <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-black">Pago en proceso</h2>
          <p className="text-muted-foreground text-sm">
            Tu pago está siendo procesado. Te confirmaremos cuando esté listo. Tu turno está reservado.
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