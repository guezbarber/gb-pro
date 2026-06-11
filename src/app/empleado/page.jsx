"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, RotateCcw, Scissors } from "lucide-react";

function esHoyLocal(fechaISO) {
  const fecha = new Date(fechaISO);
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
}

export default function EmpleadoDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleado] = useState(null);
  const [barbershop, setBarbershop] = useState(null);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [turnosProximos, setTurnosProximos] = useState([]);
  const [actualizando, setActualizando] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: barberRecord } = await supabase.from("barbers").select("*, barbershops(name, whatsapp_number)").eq("user_id", user.id).single();

    if (!barberRecord) { router.push("/unirse"); return; }
    if (barberRecord.rol === "owner") { router.push("/dashboard"); return; }

    setEmpleado(barberRecord);
    setBarbershop(barberRecord.barbershops);

    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const { data: turnos } = await supabase.from("appointments").select("*, services(name, price, duration_minutes)").eq("barber_member_id", barberRecord.id).gte("start_time", hoy.toISOString()).order("start_time", { ascending: true });

    if (turnos) {
      setTurnosHoy(turnos.filter(t => esHoyLocal(t.start_time)));
      setTurnosProximos(turnos.filter(t => !esHoyLocal(t.start_time)));
    }
    setLoading(false);
  };

  const cambiarStatus = async (id, nuevoStatus) => {
    setActualizando(id);
    const { error } = await supabase.from("appointments").update({ status: nuevoStatus }).eq("id", id);
    if (!error) {
      const act = (lista) => lista.map(t => t.id === id ? { ...t, status: nuevoStatus } : t);
      setTurnosHoy(prev => act(prev));
      setTurnosProximos(prev => act(prev));
    }
    setActualizando(null);
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); router.push("/"); };

  const getStatusStyle = (status) => {
    if (status === "completado") return { border: "border-green-200 bg-green-50", badge: "bg-green-100 text-green-700", texto: "Completado" };
    if (status === "falto") return { border: "border-red-200 bg-red-50", badge: "bg-red-100 text-red-600", texto: "Faltó" };
    return { border: "border-border/60 bg-white", badge: "", texto: "" };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse font-black text-2xl tracking-tighter">GB PRO</p>
    </div>
  );

  const ingresosHoy = turnosHoy.filter(t => t.status === "completado").reduce((s, t) => s + (t.services?.price || 0), 0);

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="bg-card border-b border-border/50 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <span className="font-black tracking-tighter text-xl">GB PRO</span>
          <p className="text-xs text-muted-foreground font-medium">{barbershop?.name || "Mi Barbería"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={cerrarSesion} className="text-muted-foreground font-bold">Salir</Button>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hola, {empleado?.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Tus turnos de hoy.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Turnos hoy", value: turnosHoy.length },
            { label: "Completados", value: turnosHoy.filter(t => t.status === "completado").length },
            { label: "Ingresos", value: `$${ingresosHoy}` },
          ].map((m, i) => (
            <Card key={i} className="bg-zinc-900 border-none text-white">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-3xl font-black">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Mis turnos de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {turnosHoy.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl space-y-2">
                <Scissors size={24} className="mx-auto opacity-30" />
                No tienes turnos para hoy.
              </div>
            ) : (
              <div className="space-y-3">
                {turnosHoy.map((turno) => {
                  const fecha = new Date(turno.start_time);
                  const status = turno.status || "pendiente";
                  const style = getStatusStyle(status);
                  return (
                    <div key={turno.id} className={`relative flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-xl border gap-3 ${style.border}`}>
                      {status === "pendiente" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 rounded-l-xl" />}
                      {status === "completado" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl" />}
                      {status === "falto" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl" />}
                      <div className="pl-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base">{turno.client_name}</p>
                          {status !== "pendiente" && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>{style.texto}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{turno.services?.name}{turno.client_phone && <span className="mx-1">·</span>}{turno.client_phone}</p>
                      </div>
                      <div className="flex items-center gap-3 pl-2 sm:pl-0">
                        <div className="text-right">
                          <p className="font-black text-xl">{fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          {turno.services?.price && <p className={`text-sm font-bold ${status === "falto" ? "text-red-400 line-through" : "text-zinc-700"}`}>${turno.services.price}</p>}
                        </div>
                        <div className="flex gap-1">
                          {status === "pendiente" && (
                            <>
                              <Button size="sm" className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white active:scale-95" onClick={() => cambiarStatus(turno.id, "completado")} disabled={actualizando === turno.id}>
                                <Check size={14} strokeWidth={2.5} />
                              </Button>
                              <Button size="sm" className="h-9 w-9 p-0 bg-red-500 hover:bg-red-600 text-white active:scale-95" onClick={() => cambiarStatus(turno.id, "falto")} disabled={actualizando === turno.id}>
                                <X size={14} strokeWidth={2.5} />
                              </Button>
                            </>
                          )}
                          {status !== "pendiente" && (
                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 active:scale-95" onClick={() => cambiarStatus(turno.id, "pendiente")} disabled={actualizando === turno.id}>
                              <RotateCcw size={13} strokeWidth={2} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {turnosProximos.length > 0 && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Próximos turnos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {turnosProximos.map((turno) => {
                  const fecha = new Date(turno.start_time);
                  return (
                    <div key={turno.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/10">
                      <div>
                        <p className="font-bold text-sm">{turno.client_name}</p>
                        <p className="text-xs text-muted-foreground">{turno.services?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-base">{fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-xs text-muted-foreground">{fecha.toLocaleDateString("es-UY", { weekday: "short", day: "2-digit", month: "short" })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}