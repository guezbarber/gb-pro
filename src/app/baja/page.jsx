"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Check } from "lucide-react";

export default function BajaPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [estado, setEstado] = useState("procesando"); // procesando | listo | error | sinId

  useEffect(() => {
    if (!id) {
      setEstado("sinId");
      return;
    }
    darDeBaja();
  }, [id]);

  const darDeBaja = async () => {
    const { error } = await supabase
      .from("barber_settings")
      .update({ acepta_novedades: false })
      .eq("barber_id", id);

    if (error) {
      setEstado("error");
    } else {
      setEstado("listo");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-zinc-950 p-6 text-center">
          <span className="font-black tracking-tighter text-xl text-white">GB PRO</span>
        </div>
        <div className="p-8 text-center space-y-4">
          {estado === "procesando" && (
            <p className="text-muted-foreground animate-pulse">Procesando tu solicitud...</p>
          )}

          {estado === "listo" && (
            <>
              <div className="w-14 h-14 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check size={28} className="text-green-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Listo</h1>
              <p className="text-muted-foreground">
                Te diste de baja de los correos de novedades y consejos de GB PRO. No vas a recibir más estos correos.
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Esto no afecta los correos importantes de tu cuenta (turnos, recordatorios, etc.).
              </p>
            </>
          )}

          {estado === "error" && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">Algo salió mal</h1>
              <p className="text-muted-foreground">
                No pudimos procesar tu baja. Probá de nuevo en un momento o escribinos.
              </p>
            </>
          )}

          {estado === "sinId" && (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">Enlace inválido</h1>
              <p className="text-muted-foreground">
                Este enlace no es válido. Usá el botón de baja que aparece en el correo que recibiste.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}