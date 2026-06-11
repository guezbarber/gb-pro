"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Check, Calendar } from "lucide-react";

export default function CalendarCallbackPage() {
  const router = useRouter();
  const [estado, setEstado] = useState("conectando");

  useEffect(() => { guardarTokens(); }, []);

  const guardarTokens = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) { setEstado("error"); return; }

      const { user, provider_token, provider_refresh_token } = session;

      if (!provider_token) { setEstado("error"); return; }

      const { error } = await supabase.from("google_calendar_tokens").upsert({
        barber_id: user.id,
        access_token: provider_token,
        refresh_token: provider_refresh_token || null,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        calendar_id: "primary",
      }, { onConflict: "barber_id" });

      if (error) { setEstado("error"); return; }

      setEstado("exitoso");
      setTimeout(() => router.push("/dashboard/configuracion"), 2000);

    } catch { setEstado("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="text-center space-y-4 max-w-sm">
        {estado === "conectando" && (
          <>
            <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-full flex items-center justify-center animate-pulse">
              <Calendar size={28} className="text-zinc-400" />
            </div>
            <p className="font-bold text-lg">Conectando Google Calendar...</p>
            <p className="text-muted-foreground text-sm">Esto tarda unos segundos.</p>
          </>
        )}
        {estado === "exitoso" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check size={32} strokeWidth={2.5} className="text-green-600" />
            </div>
            <p className="font-bold text-lg">Google Calendar conectado</p>
            <p className="text-muted-foreground text-sm">Redirigiendo a configuración...</p>
          </>
        )}
        {estado === "error" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Calendar size={28} className="text-red-500" />
            </div>
            <p className="font-bold text-lg text-red-600">Error al conectar</p>
            <p className="text-muted-foreground text-sm">No se pudo obtener el token de Google Calendar.</p>
            <a href="/dashboard/configuracion" className="text-sm font-bold hover:underline">
              Volver a configuración
            </a>
          </>
        )}
      </div>
    </div>
  );
}