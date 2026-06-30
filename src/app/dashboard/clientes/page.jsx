"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Cake, FileText, Clock } from "lucide-react";

const DIAS_INACTIVO = 30;

const formatearFecha = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatearCumple = (dateStr) => {
  if (!dateStr) return null;
  const [, mes, dia] = dateStr.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${parseInt(dia)} de ${meses[parseInt(mes) - 1]}`;
};

const esCumpleañosHoy = (dateStr) => {
  if (!dateStr) return false;
  const hoy = new Date();
  const [, mes, dia] = dateStr.split("-");
  return parseInt(mes) === hoy.getMonth() + 1 && parseInt(dia) === hoy.getDate();
};

const diasDesde = (isoString) => {
  const ahora = new Date();
  const fecha = new Date(isoString);
  return Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));
};

// Mensaje de WhatsApp para reactivar (en español)
const mensajeWhatsApp = (nombre, negocio) => {
  const texto = `Hola ${nombre}! Te escribo de ${negocio}. Hace un tiempo que no te vemos y queríamos saber cómo andás. ¿Te gustaría agendar un turno? Te esperamos.`;
  return encodeURIComponent(texto);
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [negocioNombre, setNegocioNombre] = useState("");

  const [notaEditando, setNotaEditando] = useState(null);
  const [textoNota, setTextoNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);

  const [cumpleEditando, setCumpleEditando] = useState(null);
  const [textoCumple, setTextoCumple] = useState("");
  const [guardandoCumple, setGuardandoCumple] = useState(false);

  useEffect(() => { cargarClientes(); }, []);

  const cargarClientes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings } = await supabase
      .from("barber_settings")
      .select("barber_name")
      .eq("barber_id", user.id)
      .single();
    if (settings?.barber_name) setNegocioNombre(settings.barber_name);

    const { data: turnos } = await supabase
      .from("appointments")
      .select("*, services(price)")
      .eq("barber_id", user.id)
      .order("start_time", { ascending: false });

    const { data: notas } = await supabase.from("client_notes").select("*").eq("barber_id", user.id);
    const { data: perfiles } = await supabase.from("client_profiles").select("*").eq("barber_id", user.id);

    const mapaNotas = new Map();
    if (notas) notas.forEach(n => mapaNotas.set(n.client_key, n.nota));

    const mapaPerfiles = new Map();
    if (perfiles) perfiles.forEach(p => mapaPerfiles.set(p.client_key, p));

    if (turnos) {
      const mapaClientes = new Map();
      turnos.forEach((turno) => {
        const idUnico = turno.client_phone?.trim() || turno.client_name?.trim();
        const precio = turno.services?.price || 0;
        if (!mapaClientes.has(idUnico)) {
          mapaClientes.set(idUnico, {
            key: idUnico,
            nombre: turno.client_name,
            telefono: turno.client_phone,
            email: turno.client_email || "",
            visitas: 1,
            totalGastado: precio,
            ultimaVisita: turno.start_time,
            nota: mapaNotas.get(idUnico) || "",
            birthdate: mapaPerfiles.get(idUnico)?.birthdate || "",
          });
        } else {
          const c = mapaClientes.get(idUnico);
          c.visitas += 1;
          c.totalGastado += precio;
          if (!c.email && turno.client_email) c.email = turno.client_email;
        }
      });
      setClientes(Array.from(mapaClientes.values()));
    }
    setLoading(false);
  };

  const guardarNota = async (clienteKey) => {
    setGuardandoNota(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("client_notes").upsert(
      { barber_id: user.id, client_key: clienteKey, nota: textoNota },
      { onConflict: "barber_id,client_key" }
    );
    if (!error) {
      setClientes(prev => prev.map(c => c.key === clienteKey ? { ...c, nota: textoNota } : c));
      setNotaEditando(null); setTextoNota("");
    } else alert("Error: " + error.message);
    setGuardandoNota(false);
  };

  const guardarCumple = async (cliente) => {
    setGuardandoCumple(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("client_profiles").upsert(
      { barber_id: user.id, client_key: cliente.key, client_name: cliente.nombre, birthdate: textoCumple || null },
      { onConflict: "barber_id,client_key" }
    );
    if (!error) {
      setClientes(prev => prev.map(c => c.key === cliente.key ? { ...c, birthdate: textoCumple } : c));
      setCumpleEditando(null); setTextoCumple("");
    } else alert("Error: " + error.message);
    setGuardandoCumple(false);
  };

  // Clientes que no vuelven: ultima visita hace mas de 30 dias
  const clientesInactivos = clientes
    .filter(c => diasDesde(c.ultimaVisita) >= DIAS_INACTIVO)
    .sort((a, b) => new Date(a.ultimaVisita) - new Date(b.ultimaVisita));

  const asuntoEmail = "Te extrañamos en " + (negocioNombre || "nuestro negocio");
  const cuerpoEmail = (nombre) =>
    `Hola ${nombre},%0D%0A%0D%0AHace un tiempo que no te vemos por ${negocioNombre || "nuestro local"} y queríamos saludarte. Nos encantaría volver a atenderte.%0D%0A%0D%0A¿Te gustaría agendar un turno? Te esperamos.%0D%0A%0D%0ASaludos.`;

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-1">Tu base de datos automática.</p>
      </div>

      {/* Clientes que no vuelven */}
      {!loading && clientesInactivos.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-800">
              <Clock size={16} strokeWidth={2} /> Clientes que no vuelven ({clientesInactivos.length})
            </CardTitle>
            <p className="text-xs text-amber-700/80">Hace más de {DIAS_INACTIVO} días que no vienen. Escribiles para que vuelvan: el mensaje ya está listo.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientesInactivos.map((cliente, idx) => (
                <div key={idx} className="bg-background rounded-xl border border-amber-200/70 p-4 flex flex-col gap-3">
                  <div>
                    <p className="font-bold text-sm truncate">{cliente.nombre}</p>
                    <p className="text-xs text-muted-foreground">{cliente.telefono || "Sin número"}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-700">
                      <Clock size={11} />
                      <span>Hace {diasDesde(cliente.ultimaVisita)} días</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cliente.telefono ? (
                      <a
                        href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}?text=${mensajeWhatsApp(cliente.nombre, negocioNombre || "nuestro negocio")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="w-full h-9 text-xs font-bold flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
                          <MessageSquare size={13} /> Enviar WhatsApp
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" disabled className="w-full h-9 text-xs opacity-40">Sin WhatsApp</Button>
                    )}
                    {cliente.email ? (
                      <a href={`mailto:${cliente.email}?subject=${encodeURIComponent(asuntoEmail)}&body=${cuerpoEmail(cliente.nombre)}`}>
                        <Button variant="outline" className="w-full h-9 text-xs font-bold flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                          <Mail size={13} /> Enviar email
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" disabled className="w-full h-9 text-xs opacity-30">Sin email</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col gap-3 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold">Directorio ({clientes.length})</CardTitle>
            <Input
              placeholder="Buscar por nombre, celular o email..."
              className="w-full sm:max-w-xs h-11 text-base"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse text-sm">Cargando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border-2 rounded-xl border-dashed">
              No hay clientes registrados aún.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesFiltrados.map((cliente, idx) => (
                <Card key={idx} className={`border-border/50 shadow-none transition-all ${esCumpleañosHoy(cliente.birthdate) ? "border-amber-300 bg-amber-50/30" : "bg-muted/10"}`}>
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base truncate">{cliente.nombre}</p>
                        {esCumpleañosHoy(cliente.birthdate) && (
                          <Cake size={14} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{cliente.telefono || "Sin número"}</p>
                      {cliente.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{cliente.email}</p>}

                      <div className="flex flex-wrap gap-2 text-xs font-medium my-3">
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md">
                          {cliente.visitas} {cliente.visitas === 1 ? "turno" : "turnos"}
                        </span>
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md">
                          ${cliente.totalGastado}
                        </span>
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md">
                          {formatearFecha(cliente.ultimaVisita)}
                        </span>
                      </div>

                      {/* Nota */}
                      {notaEditando === cliente.key ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            className="w-full text-sm rounded-lg border border-input bg-muted/30 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                            rows={3}
                            placeholder="Notas sobre el cliente"
                            value={textoNota}
                            onChange={(e) => setTextoNota(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-9 text-sm" onClick={() => guardarNota(cliente.key)} disabled={guardandoNota}>
                              {guardandoNota ? "..." : "Guardar"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-9 text-sm" onClick={() => { setNotaEditando(null); setTextoNota(""); }}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors mt-1 py-1"
                          onClick={() => { setNotaEditando(cliente.key); setTextoNota(cliente.nota); }}
                        >
                          <FileText size={11} />
                          <span className="italic">{cliente.nota || "Agregar nota"}</span>
                        </div>
                      )}

                      {/* Cumpleaños */}
                      {cumpleEditando === cliente.key ? (
                        <div className="space-y-2 mt-2">
                          <Input type="date" className="h-10 text-sm" value={textoCumple} onChange={(e) => setTextoCumple(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-9 text-sm" onClick={() => guardarCumple(cliente)} disabled={guardandoCumple}>
                              {guardandoCumple ? "..." : "Guardar"}
                            </Button>
                            <Button size="sm" variant="outline" className="h-9 text-sm" onClick={() => { setCumpleEditando(null); setTextoCumple(""); }}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors mt-1 py-1"
                          onClick={() => { setCumpleEditando(cliente.key); setTextoCumple(cliente.birthdate || ""); }}
                        >
                          <Cake size={11} />
                          <span className="italic">{cliente.birthdate ? formatearCumple(cliente.birthdate) : "Agregar cumpleaños"}</span>
                        </div>
                      )}
                    </div>

                    {/* Botones de contacto */}
                    <div className="flex flex-col gap-2">
                      {cliente.telefono ? (
                        <a href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full h-10 text-sm font-bold flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
                            <MessageSquare size={14} /> WhatsApp
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline" disabled className="w-full h-10 text-sm opacity-40">Sin WhatsApp</Button>
                      )}
                      {cliente.email ? (
                        <a href={`mailto:${cliente.email}`}>
                          <Button variant="outline" className="w-full h-10 text-sm font-bold flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                            <Mail size={14} /> Email
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline" disabled className="w-full h-10 text-sm opacity-30">Sin email</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}