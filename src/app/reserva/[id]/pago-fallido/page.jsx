"use client";

import { use } from "react";
import { XCircle } from "lucide-react";

export default function PagoFallidoPage({ params }) {
  const { id: barberId } = use(params);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-4 flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tight">GB PRO</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 text-center space-y-5">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">El pago no se completó</h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Tu turno está reservado pero la seña sigue pendiente. Puedes intentar el pago nuevamente.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <a href={`/reserva/${barberId}`} className="block">
              <button className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors">
                Reintentar pago
              </button>
            </a>
            <a href="/" className="block">
              <button className="w-full h-12 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl transition-colors text-sm">
                Volver al inicio
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
