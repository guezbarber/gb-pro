"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, MapPin, Phone, Clock, Smartphone, Share, PlusSquare } from "lucide-react";

const PASOS = [
  { numero: 1, titulo: "Nombre de tu barbería", descripcion: "¿Cómo se llama tu negocio?", icono: Scissors },
  { numero: 2, titulo: "Ubicación", descripcion: "Para que tus clientes te encuentren.", icono: MapPin },
  { numero: 3, titulo: "WhatsApp", descripcion: "A este número llegan las reservas.", icono: Phone },
  { numero: 4, titulo: "Horarios de atención", descripcion: "¿Cuándo atiendes?", icono: Clock },
  { numero: 5, titulo: "Tu primer servicio", descripcion: "Agrega el servicio que más ofreces.", icono: Scissors },
  { numero: 6, titulo: "Instala la app", descripcion: "Accede más rápido desde tu celular.", icono: Smartphone },
];

function detectarDispositivo() {
  if (typeof window === "undefined") return "desconocido";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desconocido";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const totalPasos = 6;

  const [barberName, setBarberName] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [servicioNombre, setServicioNombre] = useState("");
  const [servicioPrecio, setServicioPrecio] = useState("");
  const [servicioDuracion, setServicioDuracion] = useState("30");

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [dispositivo, setDispositivo] = useState("desconocido");
  const [dispositivoElegido, setDispositivoElegido] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    };
    checkUser();
    setDispositivo(detectarDispositivo());
  }, [router]);

  const avanzarPaso = (e) => {
    e.preventDefault();
    if (paso < totalPasos) {
      setPaso(paso + 1);
      if (paso + 1 === 6) finalizarOnboarding();
    }
  };

  const finalizarOnboarding = async () => {
    setLoading(true);

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
      open_time: openTime,
      close_time: closeTime,
    };

    if (existe) {
      await supabase.from("barber_settings").update(settingsPayload).eq("barber_id", userId);
    } else {
      await supabase.from("barber_settings").insert([{ barber_id: userId, ...settingsPayload }]);
    }

    const { data: bshopExiste } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", userId)
      .single();

    let bshopId = bshopExiste?.id;

    if (!bshopExiste) {
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: bshop } = await supabase
        .from("barbershops")
        .insert([{
          owner_id: userId,
          name: barberName.trim(),
          plan: "basico",
          open_time: openTime,
          close_time: closeTime,
          whatsapp_number: whatsapp.trim(),
          ciudad: ciudad.trim(),
          direccion: direccion.trim(),
          codigo,
        }])
        .select()
        .single();

      if (bshop) {
        bshopId = bshop.id;
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

    // Crear primer servicio
    if (servicioNombre.trim()) {
      await supabase.from("services").insert([{
        barber_id: userId,
        name: servicioNombre.trim(),
        price: parseFloat(servicioPrecio) || 0,
        duration_minutes: parseInt(servicioDuracion) || 30,
      }]);
    }

    setLoading(false);
  };

  const irAlDashboard = () => {
    router.push("/dashboard/agenda");
  };

  const porcentaje = (paso / totalPasos) * 100;
  const PasoActual = PASOS[paso - 1];
  const IconoPaso = PasoActual.icono;

  const dispositivoFinal = dispositivoElegido || dispositivo;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">

      <div className="absolute top-0 w-full bg-background border-b border-border/40 py-4 text-center">
        <span className="font-black tracking-tighter text-2xl">GB PRO</span>
      </div>

      <div className="w-full max-w-lg mt-12">

        {/* Progreso */}
        {paso < 6 && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>Paso {paso} de {totalPasos - 1}</span>
              <span>{Math.round((paso / (totalPasos - 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(paso / (totalPasos - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="border-border/50 shadow-xl bg-card">
          <CardContent className="p-8">

            {/* PASO 6 — Instalar app */}
            {paso === 6 ? (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-zinc-950 rounded-2xl flex items-center justify-center">
                    <Smartphone size={28} strokeWidth={1.5} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">¡Todo listo!</h2>
                  <p className="text-muted-foreground text-sm">Instala GB PRO en tu celular para acceder más rápido.</p>
                </div>

                {/* Selección de dispositivo si no se detectó */}
                {dispositivo === "desconocido" && !dispositivoElegido && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setDispositivoElegido("ios")}
                      className="p-4 rounded-xl border-2 border-border/50 hover:border-zinc-900 hover:bg-muted/20 transition-all text-center">
                      <p className="text-2xl mb-1">🍎</p>
                      <p className="font-bold text-sm">iPhone</p>
                    </button>
                    <button onClick={() => setDispositivoElegido("android")}
                      className="p-4 rounded-xl border-2 border-border/50 hover:border-zinc-900 hover:bg-muted/20 transition-all text-center">
                      <p className="text-2xl mb-1">🤖</p>
                      <p className="font-bold text-sm">Android</p>
                    </button>
                  </div>
                )}

                {/* Tutorial iOS */}
                {dispositivoFinal === "ios" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cómo instalar en iPhone</p>
                    {[
                      { icono: Share, texto: "Toca el botón de compartir en Safari (el cuadrado con la flecha)" },
                      { icono: PlusSquare, texto: "Selecciona \"Añadir a pantalla de inicio\"" },
                      { icono: Smartphone, texto: "Toca \"Añadir\" y listo — GB PRO aparece como una app" },
                    ].map((paso, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl">
                        <div className="w-7 h-7 bg-zinc-950 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <paso.icono size={14} className="text-white" />
                        </div>
                        <p className="text-sm">{paso.texto}</p>
                      </div>
                    ))}
                    {dispositivo === "desconocido" && (
                      <button onClick={() => setDispositivoElegido("android")} className="text-xs text-muted-foreground underline">
                        Tengo Android
                      </button>
                    )}
                  </div>
                )}

                {/* Tutorial Android */}
                {dispositivoFinal === "android" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cómo instalar en Android</p>
                    {[
                      { icono: Smartphone, texto: "Abre gbpro.app en Chrome" },
                      { icono: PlusSquare, texto: "Toca los tres puntos (⋮) arriba a la derecha" },
                      { icono: Smartphone, texto: "Selecciona \"Instalar app\" o \"Añadir a pantalla de inicio\"" },
                    ].map((paso, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl">
                        <div className="w-7 h-7 bg-zinc-950 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <paso.icono size={14} className="text-white" />
                        </div>
                        <p className="text-sm">{paso.texto}</p>
                      </div>
                    ))}
                    {dispositivo === "desconocido" && (
                      <button onClick={() => setDispositivoElegido("ios")} className="text-xs text-muted-foreground underline">
                        Tengo iPhone
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 font-bold"
                    onClick={irAlDashboard}
                  >
                    Ahora no
                  </Button>
                  <Button
                    className="flex-1 h-12 font-bold bg-zinc-950 hover:bg-zinc-800 text-white"
                    onClick={irAlDashboard}
                  >
                    Ir a mi panel
                  </Button>
                </div>
              </div>
            ) : (
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
                      required autoFocus
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
                      <Input required autoFocus placeholder="Ej: Montevideo" className="h-12 text-base" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dirección <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                      <Input placeholder="Ej: Av. 18 de Julio 1234" className="h-12 text-base" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* PASO 3 — WhatsApp */}
                {paso === 3 && (
                  <div className="space-y-2 animate-in slide-in-from-right-4 fade-in">
                    <Label>Número de WhatsApp</Label>
                    <Input
                      required autoFocus type="tel"
                      placeholder="Ej: 099123456"
                      className="h-14 text-lg"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">A este número llegan las confirmaciones de reservas.</p>
                  </div>
                )}

                {/* PASO 4 — Horarios */}
                {paso === 4 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Apertura</Label>
                        <Input type="time" required className="h-12 text-base" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cierre</Label>
                        <Input type="time" required className="h-12 text-base" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Los clientes solo podrán reservar dentro de este horario.</p>
                  </div>
                )}

                {/* PASO 5 — Primer servicio */}
                {paso === 5 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                    <div className="space-y-1.5">
                      <Label>Nombre del servicio</Label>
                      <Input required autoFocus placeholder="Ej: Corte clásico" className="h-12 text-base" value={servicioNombre} onChange={(e) => setServicioNombre(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Precio</Label>
                        <Input required type="number" placeholder="Ej: 400" className="h-12 text-base" value={servicioPrecio} onChange={(e) => setServicioPrecio(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Duración (min)</Label>
                        <select className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base" value={servicioDuracion} onChange={(e) => setServicioDuracion(e.target.value)}>
                          {[15, 20, 30, 45, 60, 90].map(m => (
                            <option key={m} value={m}>{m} min</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Puedes agregar más servicios después en la sección Servicios.</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-border/50">
                  {paso > 1 && (
                    <Button type="button" variant="outline" className="h-12 px-6 font-bold" onClick={() => setPaso(paso - 1)} disabled={loading}>
                      Atrás
                    </Button>
                  )}
                  <Button type="submit" className="h-12 flex-1 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white" disabled={loading}>
                    {loading ? "Configurando..." : paso === totalPasos - 1 ? "Finalizar" : "Siguiente"}
                  </Button>
                </div>

              </form>
            )}
          </CardContent>
        </Card>

        {paso < 6 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Puedes editar todo esto después en Configuración.
          </p>
        )}
      </div>
    </div>
  );
}