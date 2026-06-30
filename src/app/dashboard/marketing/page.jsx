"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

const PLANTILLAS = [
  { label: "Reactivar cliente", texto: "¡Hola {nombre}! Hace tiempo que no te vemos. Esta semana tenemos horarios disponibles. ¿Agendamos tu próximo corte?" },
  { label: "Promoción especial", texto: "¡Hola {nombre}! Esta semana tenemos una oferta especial para clientes fieles. Escríbenos y te contamos." },
  { label: "Recordatorio turno", texto: "¡Hola {nombre}! Te recordamos que mañana tienes turno agendado. Te esperamos." },
];

export default function MarketingPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [diasInactivo, setDiasInactivo] = useState(21);

  useEffect(() => { cargarClientes(); }, []);

  const cargarClientes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: turnos } = await supabase.from("appointments").select("client_name, client_phone, start_time").eq("barber_id", user.id).order("start_time", { ascending: false });

    if (turnos) {
      const mapa = new Map();
      turnos.forEach(t => {
        const key = t.client_phone?.trim() || t.client_name?.trim();
        if (!mapa.has(key)) mapa.set(key, { nombre: t.client_name, telefono: t.client_phone, ultimaVisita: t.start_time, visitas: 1 });
        else mapa.get(key).visitas += 1;
      });
      setClientes(Array.from(mapa.values()).filter(c => c.telefono));
    }
    setLoading(false);
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filtro === "inactivos") return Math.floor((new Date() - new Date(c.ultimaVisita)) / 86400000) >= diasInactivo;
    if (filtro === "frecuentes") return c.visitas >= 3;
    return true;
  });

  const toggleSeleccionado = (telefono) => setSeleccionados(prev => prev.includes(telefono) ? prev.filter(t => t !== telefono) : [...prev, telefono]);
  const seleccionarTodos = () => setSeleccionados(seleccionados.length === clientesFiltrados.length ? [] : clientesFiltrados.map(c => c.telefono));

  const enviarCampana = () => {
    if (!mensaje.trim()) { alert("Escribe un mensaje antes de enviar."); return; }
    if (seleccionados.length === 0) { alert("Selecciona al menos un cliente."); return; }
    setEnviando(true);
    seleccionados.forEach((telefono, i) => {
      const cliente = clientes.find(c => c.telefono === telefono);
      const msg = mensaje.replace("{nombre}", cliente?.nombre || "");
      setTimeout(() => window.open(`https://wa.me/${telefono.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg)}`, "_blank"), i * 800);
    });
    setTimeout(() => setEnviando(false), seleccionados.length * 800 + 500);
  };

  const diasDesde = (iso) => Math.floor((new Date() - new Date(iso)) / 86400000);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-1">Envía campañas de WhatsApp y reactiva clientes inactivos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Mensaje */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Redactar mensaje</CardTitle>
              <CardDescription className="text-xs">Usa {"{nombre}"} para personalizar con el nombre del cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full text-sm rounded-lg border border-input bg-muted/30 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]"
                placeholder="Escribí tu mensaje..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plantillas</p>
                {PLANTILLAS.map((p, i) => (
                  <button key={i} onClick={() => setMensaje(p.texto)} className="w-full text-left text-xs p-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors font-medium">
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 font-bold text-base bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-2"
            onClick={enviarCampana}
            disabled={enviando || seleccionados.length === 0 || !mensaje.trim()}
          >
            <MessageSquare size={18} />
            {enviando ? "Abriendo WhatsApp..." : `Enviar a ${seleccionados.length} cliente${seleccionados.length !== 1 ? "s" : ""}`}
          </Button>

          {seleccionados.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">Se abrirá WhatsApp para cada cliente seleccionado.</p>
          )}
        </div>

        {/* Lista */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold">Clientes ({clientesFiltrados.length})</CardTitle>
              <div className="flex gap-1 bg-muted/60 p-1 rounded-full border border-border/50">
                {[
                  { key: "todos", label: "Todos" },
                  { key: "inactivos", label: `+${diasInactivo}d` },
                  { key: "frecuentes", label: "Frecuentes" },
                ].map(f => (
                  <button key={f.key} onClick={() => { setFiltro(f.key); setSeleccionados([]); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filtro === f.key ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {filtro === "inactivos" && (
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Sin venir hace más de</Label>
                <Input type="number" min="1" className="h-7 w-16 text-xs" value={diasInactivo} onChange={(e) => setDiasInactivo(Number(e.target.value))} />
                <Label className="text-xs text-muted-foreground">días</Label>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground text-sm animate-pulse">Cargando clientes...</div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay clientes en esta categoría.</div>
            ) : (
              <div className="space-y-2">
                <button onClick={seleccionarTodos} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2">
                  {seleccionados.length === clientesFiltrados.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {clientesFiltrados.map((c, i) => {
                    const seleccionado = seleccionados.includes(c.telefono);
                    const dias = diasDesde(c.ultimaVisita);
                    return (
                      <div key={i} onClick={() => toggleSeleccionado(c.telefono)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${seleccionado ? "border-foreground bg-muted/30" : "border-border/50 hover:bg-muted/20"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${seleccionado ? "bg-foreground border-foreground" : "border-muted-foreground"}`}>
                            {seleccionado && <span className="text-background text-[10px] font-black">✓</span>}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{c.nombre}</p>
                            <p className="text-xs text-muted-foreground">{c.telefono}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{c.visitas} {c.visitas === 1 ? "visita" : "visitas"}</p>
                          <p className={`text-xs ${dias > 21 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>Hace {dias}d</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}