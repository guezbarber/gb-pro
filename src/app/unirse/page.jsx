"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function UnirseBarberiaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [barberia, setBarberia] = useState(null);
  const [errorCodigo, setErrorCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cargarUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: bshop } = await supabase
        .from("barbershops")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (bshop) { router.push("/dashboard"); return; }

      const { data: barberRecord } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (barberRecord) { router.push("/dashboard"); return; }

      const { data: invPendiente } = await supabase
        .from("invitaciones")
        .select("id, estado")
        .eq("user_id", user.id)
        .single();

      if (invPendiente?.estado === "pendiente") setEnviado(true);
      else if (invPendiente?.estado === "aprobada") router.push("/dashboard");
    };
    cargarUser();
  }, [router]);

  const buscarBarberia = async () => {
    if (codigo.trim().length < 4) return;
    setBuscando(true);
    setErrorCodigo("");
    setBarberia(null);

    const { data, error } = await supabase
      .from("barbershops")
      .select("id, name, ciudad")
      .eq("codigo", codigo.trim().toUpperCase())
      .single();

    if (error || !data) {
      setErrorCodigo("Código incorrecto. Verificá con tu jefe.");
    } else {
      setBarberia(data);
    }
    setBuscando(false);
  };

  const enviarSolicitud = async () => {
    if (!barberia || !nombre.trim() || !user) return;
    setEnviando(true);

    const { error } = await supabase.from("invitaciones").insert([{
      barbershop_id: barberia.id,
      user_id: user.id,
      user_email: user.email,
      user_name: nombre.trim(),
      estado: "pendiente",
    }]);

    if (!error || error.code === "23505") {
      setEnviado(true);
    } else {
      alert("Error al enviar solicitud: " + error.message);
    }
    setEnviando(false);
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-zinc-950 rounded-2xl p-6 text-center text-white">
            <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
          </div>
          <Card className="border-border/50 shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Clock size={40} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-black">Solicitud enviada</h2>
              <p className="text-muted-foreground text-sm">
                Tu jefe tiene que aprobar tu solicitud. Cuando te aprueben, volvé a entrar a GB PRO.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        <div className="bg-zinc-950 rounded-2xl p-6 text-center text-white">
          <h1 className="text-xl font-black tracking-tight">GB PRO</h1>
          <p className="text-zinc-400 text-sm mt-1">Unirte a una barbería</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6 space-y-5">

            {/* Código */}
            <div className="space-y-2">
              <p className="font-bold text-sm">Código de la barbería</p>
              <p className="text-xs text-muted-foreground">Tu jefe te lo tiene que dar.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 508245"
                  className="h-12 text-base bg-muted/30 uppercase tracking-widest font-bold"
                  value={codigo}
                  onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setBarberia(null); setErrorCodigo(""); }}
                  maxLength={6}
                />
                <Button
                  className="h-12 px-5 font-bold bg-zinc-950 hover:bg-zinc-800 text-white shrink-0"
                  onClick={buscarBarberia}
                  disabled={buscando || codigo.trim().length < 4}
                >
                  {buscando ? "..." : "Buscar"}
                </Button>
              </div>
              {errorCodigo && <p className="text-sm text-red-500 font-medium">{errorCodigo}</p>}
              {barberia && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-bold text-green-800">{barberia.name}{barberia.ciudad ? ` — ${barberia.ciudad}` : ""}</p>
                </div>
              )}
            </div>

            {/* Nombre */}
            {barberia && (
              <div className="space-y-2">
                <p className="font-bold text-sm">Tu nombre</p>
                <Input
                  placeholder="Ej: Carlos"
                  className="h-12 text-base bg-muted/30"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
            )}

            {/* Botón */}
            {barberia && (
              <Button
                className="w-full h-12 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white"
                onClick={enviarSolicitud}
                disabled={enviando || !nombre.trim()}
              >
                {enviando ? "Enviando..." : "Solicitar unirme"}
              </Button>
            )}

          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Eres dueño de una barbería?{" "}
          <a href="/login" className="font-bold hover:text-foreground transition-colors">Inicia sesión aquí</a>
        </p>

      </div>
    </div>
  );
}