"use client";

import { use } from "react";
import { Clock } from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";

export default function PagoPendientePage({ params }) {
  const { id: barberId } = use(params);
  const { t } = useIdioma();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <div className="bg-zinc-950 px-4 py-4 flex items-center justify-center">
        <span className="text-white font-black text-xl tracking-tight">GB PRO</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 text-center space-y-5">
            <div className="flex justify-center">
              <Clock className="w-16 h-16 text-amber-500" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">{t("reserva.pagoEnProceso")}</h1>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {t("reserva.esperandoConfirmacion")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <a href={`/reserva/${barberId}`} className="block">
              <button className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl transition-colors">
                {t("reserva.verMiReserva")}
              </button>
            </a>
            <a href="/" className="block">
              <button className="w-full h-12 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl transition-colors text-sm">
                {t("reserva.volverInicio")}
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
