"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, MapPin, Phone } from "lucide-react";

const PASOS = [
  { numero: 1, titulo: "Nombre de tu barbería", descripcion: "¿Cómo se llama tu negocio?", icono: Scissors },
  { numero: 2, titulo: "Ubicación", descripcion: "Para que tus clientes te encuentren.", icono: MapPin },
  { numero: 3, titulo: "WhatsApp", descripcion: "A este número llegan las reservas.", icono: Phone },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const totalPasos = 3;

  const [barberName, setBarberName] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    };
    checkUser();
  }, [router]);

  const avanzarPaso = (e) => {
    e.preventDefault();
    if (paso < totalPasos) {
      setPaso(paso + 1);
    } else {
      finalizarOnboarding();
    }
  };

  const finalizarOnboarding = async () => {
    setLoading(true);

    // 1. Crear o actualizar barber_settings
    const { data: existe } = await supabase
      .from("barber_settings")
      .select("id")
      .eq("barber_id", userId)
      .single();

    const settingsPayload = {
      barber_name: barberName.trim(),
      whatsapp_number: whatsapp.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
      open_time: "09:00",
      close_time: "20:00",
    };

    let errorSettings;
    if (existe) {
      const { error } = await supabase
        .from("barber_settings")
        .update(settingsPayload)
        .eq("barber_id", userId);
      errorSettings = error;
    } else {
      const { error } = await supabase
        .from("barber_settings")
        .insert([{ barber_id: userId, ...settingsPayload }]);
      errorSettings = error;
    }

    if (errorSettings) {
      alert("Error al guardar: " + errorSettings.message);
      setLoading(false);
      return;
    }

    // 2. Crear barbershop si no existe
    const { data: bshopExiste } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (!bshopExiste) {
      // Generar código único de 6 caracteres
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: bshop, error: errorBshop } = await supabase
        .from("barbershops")
        .insert([{
          owner_id: userId,
          name: barberName.trim(),
          plan: "basico",
          open_time: "09:00",
          close_time: "20:00",
          whatsapp_number: whatsapp.trim(),
          ciudad: ciudad.trim(),
          direccion: direccion.trim(),
          codigo,
        }])
        .select()
        .single();

      if (errorBshop) {
        console.error("Error creando barbershop:", errorBshop.message);
        // No bloqueamos — el usuario puede configurar después
      } else if (bshop) {
        // 3. Crear el registro del owner en barbers
        await supabase.from("barbers").insert([{
          barbershop_id: bshop.id,
          user_id: userId,
          name: barberName.trim(),
          rol: "owner",
          tipo: "owner",
          atiende_clientes: true,
          activo: true,
          color: "#18181b",
        }]);
      }
    }

    router.push("/dashboard/agenda");
  };

  const porcentaje = (paso / totalPasos) * 100;
  const PasoActual = PASOS[paso - 1];
  const IconoPaso = PasoActual.icono;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">

      {/* Header */}
      <div className="absolute top-0 w-full bg-background border-b border-border/40 py-4 text-center">
        <span className="font-black tracking-tighter text-2xl">GB PRO</span>
      </div>

      <div className="w-full max-w-lg mt-12">

        {/* Progreso */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>Paso {paso} de {totalPasos}</span>
            <span>{Math.round(porcentaje)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>

        <Card className="border-border/50 shadow-xl bg-card">
          <CardContent className="p-8">
            <form onSubmit={avanzarPaso}>

              {/* Icono + título */}
              <div className="text-center space-y-3 mb-8">
                <div className="w-12 h-12 mx-auto bg-zinc-950 rounded-2xl flex items-center justify-center">
                  <IconoPaso size={20} strokeWidth={1.8} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">{PasoActual.titulo}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{PasoActual.descripcion}</p>
                </div>
              </div>

              {/* PASO 1 — Nombre */}
              {paso === 1 && (
                <div className="space-y-2 animate-in slide-in-from-right-4 fade-in">
                  <Label>Nombre de la barbería</Label>
                  <Input
                    required
                    autoFocus
                    placeholder="Ej: Guezbarber"
                    className="h-14 text-lg"
                    value={barberName}
                    onChange={(e) => setBarberName(e.target.value)}
                  />
                </div>
              )}

              {/* PASO 2 — Ubicación */}
              {paso === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                  <div className="space-y-1.5">
                    <Label>Ciudad</Label>
                    <Input
                      required
                      autoFocus
                      placeholder="Ej: Montevideo"
                      className="h-12 text-base"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dirección</Label>
                    <Input
                      required
                      placeholder="Ej: Av. 18 de Julio 1234"
                      className="h-12 text-base"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* PASO 3 — WhatsApp */}
              {paso === 3 && (
                <div className="space-y-2 animate-in slide-in-from-right-4 fade-in">
                  <Label>Número de WhatsApp</Label>
                  <Input
                    required
                    autoFocus
                    type="tel"
                    placeholder="Ej: 099123456"
                    className="h-14 text-lg"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A este número llegan las confirmaciones de reservas.
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
                {paso > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-6 font-bold"
                    onClick={() => setPaso(paso - 1)}
                    disabled={loading}
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  type="submit"
                  className="h-12 flex-1 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white"
                  disabled={loading}
                >
                  {loading
                    ? "Configurando..."
                    : paso === totalPasos
                      ? "Entrar a mi panel"
                      : "Siguiente"
                  }
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Puedes editar todo esto después en Configuración.
        </p>
      </div>
    </div>
  );
}