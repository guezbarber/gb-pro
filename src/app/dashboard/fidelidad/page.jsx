"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Trophy, Mail } from "lucide-react";

export default function FidelidadPage() {
  const [plan, setPlan] = useState("basico");
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ajustando, setAjustando] = useState(null);
  const [puntosAjuste, setPuntosAjuste] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [barberoNombre, setBarberoNombre] = useState("");

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase.from("barber_settings").select("plan, barber_name").eq("barber_id", user.id).single();
    if (settings) { setPlan(settings.plan || "basico"); setBarberoNombre(settings.barber_name || "Tu barbería"); }

    const { data: turnos } = await supabase.from("appointments").select("client_name, client_phone, client_email, start_time, services(price)").eq("barber_id", user.id).order("start_time", { ascending: false });
    const { data: puntosBD } = await supabase.from("client_points").select("*").eq("barber_id", user.id);

    const mapaPuntos = new Map();
    if (puntosBD) puntosBD.forEach(p => mapaPuntos.set(p.client_key, p.puntos));

    if (turnos) {
      const mapa = new Map();
      turnos.forEach(t => {
        const key = t.client_phone?.trim() || t.client_name?.trim();
        if (!mapa.has(key)) {
          mapa.set(key, { key, nombre: t.client_name, telefono: t.client_phone, email: t.client_email || "", visitas: 1, totalGastado: t.services?.price || 0, ultimaVisita: t.start_time, puntos: mapaPuntos.get(key) || 0 });
        } else {
          const c = mapa.get(key);
          c.visitas += 1; c.totalGastado += t.services?.price || 0;
          if (!c.email && t.client_email) c.email = t.client_email;
        }
      });
      setClientes(Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos));
    }
    setLoading(false);
  };

  const enviarEmailPuntos = async (cliente, puntos, barbero) => {
    if (!cliente.email) return;
    try {
      await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "puntos_ganados", clienteEmail: cliente.email, clienteNombre: cliente.nombre, barberoNombre: barbero, puntos }) });
    } catch {}
  };

  const ajustarPuntos = async (cliente, operacion) => {
    const cantidad = parseInt(puntosAjuste);
    if (!cantidad || cantidad <= 0) { alert("Ingresa una cantidad válida."); return; }
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const nuevosPuntos = operacion === "sumar" ? cliente.puntos + cantidad : Math.max(0, cliente.puntos - cantidad);
    const { error } = await supabase.from("client_points").upsert({ barber_id: user.id, client_key: cliente.key, client_name: cliente.nombre, puntos: nuevosPuntos }, { onConflict: "barber_id,client_key" });
    if (!error) {
      if (operacion === "sumar" && cliente.email) await enviarEmailPuntos(cliente, cantidad, barberoNombre);
      setClientes(prev => prev.map(c => c.key === cliente.key ? { ...c, puntos: nuevosPuntos } : c).sort((a, b) => b.puntos - a.puntos));
      setAjustando(null); setPuntosAjuste("");
    } else alert("Error: " + error.message);
    setGuardando(false);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || c.telefono?.includes(busqueda)
  );

  const getNivel = (puntos) => {
    if (puntos >= 200) return { label: "Diamante", color: "text-blue-600" };
    if (puntos >= 100) return { label: "Oro", color: "text-amber-600" };
    if (puntos >= 50) return { label: "Plata", color: "text-zinc-500" };
    return { label: "Bronce", color: "text-orange-700" };
  };

  if (plan !== "PRO" && plan !== "BOSS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Fidelidad</h1>
          <p className="text-muted-foreground mt-1">Sistema de puntos para que tus clientes siempre vuelvan.</p>
        </div>
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
              <Star size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">Convierte clientes en fans</h2>
              <p className="text-zinc-400 mt-3 text-base max-w-md mx-auto">Con el plan PRO activas el sistema de puntos. Tus clientes acumulan puntos por cada visita.</p>
            </div>
            <a href="/dashboard/suscripcion">
              <Button className="bg-white text-black hover:bg-zinc-200 font-black text-base h-12 px-10 mt-4">Ver planes</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Fidelidad</h1>
        <p className="text-muted-foreground mt-1">Gestiona los puntos de tus clientes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Con puntos", value: clientes.filter(c => c.puntos > 0).length },
          { label: "Diamante", value: clientes.filter(c => c.puntos >= 200).length },
          { label: "Oro", value: clientes.filter(c => c.puntos >= 100 && c.puntos < 200).length },
          { label: "Total puntos", value: clientes.reduce((s, c) => s + c.puntos, 0) },
        ].map((m, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-2xl font-black">{loading ? "..." : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col gap-3 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">Ranking de clientes</CardTitle>
              <CardDescription className="text-xs mt-1">Toca un cliente para sumar o restar puntos. Si tiene email recibe una notificación.</CardDescription>
            </div>
            <Input placeholder="Buscar cliente..." className="w-full sm:max-w-xs h-11 text-base" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">Cargando...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay clientes todavía.</div>
          ) : (
            <div className="space-y-2">
              {clientesFiltrados.map((cliente, idx) => {
                const nivel = getNivel(cliente.puntos);
                const estaAjustando = ajustando === cliente.key;
                return (
                  <div key={idx} className="border border-border/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => { setAjustando(estaAjustando ? null : cliente.key); setPuntosAjuste(""); }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-muted-foreground w-6">#{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{cliente.nombre}</p>
                            {cliente.email && <Mail size={11} className="text-muted-foreground" />}
                          </div>
                          <p className={`text-xs font-bold ${nivel.color}`}>{nivel.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl">{cliente.puntos}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>
                    {estaAjustando && (
                      <div className="border-t border-border/50 p-4 bg-muted/10 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground">Ajustar puntos de {cliente.nombre}</p>
                        <div className="flex gap-2">
                          <Input type="number" min="1" placeholder="Cantidad" className="h-11 text-base flex-1" value={puntosAjuste} onChange={(e) => setPuntosAjuste(e.target.value)} />
                          <Button size="sm" className="h-11 px-4 font-bold bg-zinc-950 text-white shrink-0" onClick={() => ajustarPuntos(cliente, "sumar")} disabled={guardando}>
                            {guardando ? "..." : "+ Sumar"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-11 px-4 font-bold shrink-0" onClick={() => ajustarPuntos(cliente, "restar")} disabled={guardando}>
                            − Restar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}