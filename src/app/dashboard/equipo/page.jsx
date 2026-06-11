"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COLORES_DISPONIBLES = [
  "#18181b", "#2563eb", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"
];

const LIMITE_BARBEROS_PRO = 5;

export default function EquipoPage() {
  const [plan, setPlan] = useState("basico");
  const [loading, setLoading] = useState(true);
  const [barbershopId, setBarbershopId] = useState(null);
  const [codigoBarberia, setCodigoBarberia] = useState("");
  const [copiado, setCopiado] = useState(false);

  const [equipo, setEquipo] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(false);

  // Solicitudes pendientes
  const [solicitudes, setSolicitudes] = useState([]);
  const [procesando, setProcesando] = useState(null);

  // Formulario nuevo barbero manual
  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#2563eb");
  const [nuevoAtiende, setNuevoAtiende] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Editar barbero
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editAtiende, setEditAtiende] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bshop } = await supabase
      .from("barbershops")
      .select("id, plan, codigo")
      .eq("owner_id", user.id)
      .single();

    if (bshop) {
      setPlan(bshop.plan || "basico");
      setBarbershopId(bshop.id);
      setCodigoBarberia(bshop.codigo || "");
      cargarEquipo(bshop.id);
      cargarSolicitudes(bshop.id);
    }

    setLoading(false);
  };

  const cargarEquipo = async (bshopId) => {
    setLoadingEquipo(true);
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

    const { data: miembros } = await supabase
      .from("barbers")
      .select("*")
      .eq("barbershop_id", bshopId)
      .order("created_at", { ascending: true });

    if (!miembros) { setLoadingEquipo(false); return; }

    const equipoConStats = await Promise.all(
      miembros.map(async (miembro) => {
        if (!miembro.atiende_clientes) {
          return { ...miembro, turnosMes: 0, ingresosMes: 0, turnosHoy: 0 };
        }

        const { data: turnosMes } = await supabase
          .from("appointments")
          .select("status, services(price)")
          .eq("barber_member_id", miembro.id)
          .gte("start_time", inicioMes);

        const validos = (turnosMes || []).filter(t => t.status !== "falto");
        const totalIngresos = validos.reduce((s, t) => s + (t.services?.price || 0), 0);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const { data: turnosHoyData } = await supabase
          .from("appointments")
          .select("id")
          .eq("barber_member_id", miembro.id)
          .gte("start_time", hoy.toISOString())
          .lt("start_time", manana.toISOString());

        return {
          ...miembro,
          turnosMes: validos.length,
          ingresosMes: totalIngresos,
          turnosHoy: (turnosHoyData || []).length,
        };
      })
    );

    setEquipo(equipoConStats);
    setLoadingEquipo(false);
  };

  const cargarSolicitudes = async (bshopId) => {
    const { data } = await supabase
      .from("invitaciones")
      .select("*")
      .eq("barbershop_id", bshopId)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true });

    setSolicitudes(data || []);
  };

  const aprobarSolicitud = async (solicitud) => {
    setProcesando(solicitud.id);

    // 1. Crear el barber en el equipo
    const { error: errorBarber } = await supabase.from("barbers").insert([{
      barbershop_id: solicitud.barbershop_id,
      user_id: solicitud.user_id,
      name: solicitud.user_name,
      email: solicitud.user_email,
      rol: "barber",
      tipo: "empleado",
      atiende_clientes: true,
      activo: true,
      color: "#2563eb",
    }]);

    if (errorBarber) {
      alert("Error al aprobar: " + errorBarber.message);
      setProcesando(null);
      return;
    }

    // 2. Actualizar la solicitud a aprobada
    await supabase
      .from("invitaciones")
      .update({ estado: "aprobada", updated_at: new Date().toISOString() })
      .eq("id", solicitud.id);

    // 3. Actualizar UI
    setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
    cargarEquipo(barbershopId);
    setProcesando(null);
  };

  const rechazarSolicitud = async (solicitud) => {
    setProcesando(solicitud.id);

    await supabase
      .from("invitaciones")
      .update({ estado: "rechazada", updated_at: new Date().toISOString() })
      .eq("id", solicitud.id);

    setSolicitudes(prev => prev.filter(s => s.id !== solicitud.id));
    setProcesando(null);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoBarberia);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const agregarBarbero = async () => {
    if (!nuevoNombre.trim()) return;
    if (equipo.filter(m => m.activo).length >= LIMITE_BARBEROS_PRO) {
      alert(`El plan PRO permite hasta ${LIMITE_BARBEROS_PRO} barberos.`);
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from("barbers").insert([{
      barbershop_id: barbershopId,
      name: nuevoNombre.trim(),
      email: nuevoEmail.trim() || null,
      rol: "barber",
      tipo: "empleado",
      atiende_clientes: nuevoAtiende,
      activo: true,
      color: nuevoColor,
    }]);

    if (!error) {
      setModalAgregar(false);
      setNuevoNombre(""); setNuevoEmail(""); setNuevoColor("#2563eb"); setNuevoAtiende(true);
      cargarEquipo(barbershopId);
    } else {
      alert("Error al agregar barbero: " + error.message);
    }
    setGuardando(false);
  };

  const abrirEdicion = (miembro) => {
    setEditandoId(miembro.id);
    setEditNombre(miembro.name);
    setEditColor(miembro.color || "#18181b");
    setEditAtiende(miembro.atiende_clientes);
  };

  const guardarEdicion = async () => {
    setGuardandoEdicion(true);
    const { error } = await supabase
      .from("barbers")
      .update({ name: editNombre.trim(), color: editColor, atiende_clientes: editAtiende })
      .eq("id", editandoId);

    if (!error) {
      setEquipo(prev => prev.map(m =>
        m.id === editandoId
          ? { ...m, name: editNombre.trim(), color: editColor, atiende_clientes: editAtiende }
          : m
      ));
      setEditandoId(null);
    } else {
      alert("Error al guardar: " + error.message);
    }
    setGuardandoEdicion(false);
  };

  const toggleActivo = async (miembro) => {
    if (miembro.rol === "owner") return;
    const nuevoEstado = !miembro.activo;
    const { error } = await supabase.from("barbers").update({ activo: nuevoEstado }).eq("id", miembro.id);
    if (!error) {
      setEquipo(prev => prev.map(m => m.id === miembro.id ? { ...m, activo: nuevoEstado } : m));
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );

  if (plan !== "PRO" && plan !== "BOSS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mi Equipo</h1>
          <p className="text-muted-foreground mt-1">Gestiona los barberos de tu local.</p>
        </div>
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="text-6xl">👥</div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">Gestiona tu equipo completo</h2>
              <p className="text-zinc-400 mt-3 text-base max-w-md mx-auto">
                Con el plan BOSS podés agregar hasta 5 barberos, ver el rendimiento de cada uno y controlar todo desde un solo panel.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
              {[
                { title: "Hasta 5 barberos", desc: "Cada uno con su propio acceso" },
                { title: "Estadísticas por barbero", desc: "Turnos e ingresos individuales" },
                { title: "Control total", desc: "Aprobar, activar, desactivar" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-zinc-400 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <a href="/dashboard/suscripcion">
              <Button className="bg-white text-black hover:bg-zinc-200 font-black text-base h-12 px-10 mt-4">
                Activar BOSS — $24.99/mes
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const barberosActivos = equipo.filter(m => m.activo);
  const puedeAgregarMas = barberosActivos.length < LIMITE_BARBEROS_PRO;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* MODAL AGREGAR BARBERO */}
      {modalAgregar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">Agregar barbero</h2>
              <p className="text-zinc-400 text-sm mt-1">{barberosActivos.length}/{LIMITE_BARBEROS_PRO} barberos activos</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input placeholder="Ej: Carlos" className="h-12 text-base bg-muted/30" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                <Input type="email" placeholder="carlos@email.com" className="h-12 text-base bg-muted/30" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Color en la agenda</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES_DISPONIBLES.map((color) => (
                    <button key={color} onClick={() => setNuevoColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all ${nuevoColor === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <p className="font-bold text-sm">Atiende clientes</p>
                  <p className="text-xs text-muted-foreground">Aparece como opción al agendar</p>
                </div>
                <button onClick={() => setNuevoAtiende(!nuevoAtiende)} className={`w-12 h-6 rounded-full transition-colors relative ${nuevoAtiende ? "bg-zinc-950" : "bg-muted"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${nuevoAtiende ? "left-7" : "left-1"}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => { setModalAgregar(false); setNuevoNombre(""); setNuevoEmail(""); }}>Cancelar</Button>
                <Button className="flex-1 font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={agregarBarbero} disabled={guardando || !nuevoNombre.trim()}>
                  {guardando ? "Guardando..." : "Agregar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mi Equipo</h1>
          <p className="text-muted-foreground mt-1">{barberosActivos.length}/{LIMITE_BARBEROS_PRO} barberos activos</p>
        </div>
        <span className="bg-zinc-950 text-white text-xs font-black px-3 py-1 rounded-full">BOSS</span>
      </div>

      {/* ✅ Código de barbería */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">Código de tu barbería</p>
            <p className="text-xs text-muted-foreground mt-0.5">Comparte este código con tus barberos para que puedan unirse.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-2xl tracking-widest">{codigoBarberia}</span>
            <Button variant="outline" size="sm" className="font-bold h-9" onClick={copiarCodigo}>
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Solicitudes pendientes */}
      {solicitudes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Solicitudes pendientes
              <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {solicitudes.length}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Estos barberos quieren unirse a tu equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {solicitudes.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200">
                <div>
                  <p className="font-bold text-sm">{s.user_name}</p>
                  <p className="text-xs text-muted-foreground">{s.user_email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-9 px-4 font-bold bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => aprobarSolicitud(s)}
                    disabled={procesando === s.id}
                  >
                    {procesando === s.id ? "..." : "Aprobar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-4 font-bold text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => rechazarSolicitud(s)}
                    disabled={procesando === s.id}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats del equipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Barberos activos", value: barberosActivos.length },
          { label: "Turnos hoy", value: equipo.reduce((s, m) => s + m.turnosHoy, 0) },
          { label: "Turnos este mes", value: equipo.reduce((s, m) => s + m.turnosMes, 0) },
          { label: "Ingresos este mes", value: `$${equipo.reduce((s, m) => s + m.ingresosMes, 0)}` },
        ].map((m, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-2xl font-black">{loadingEquipo ? "..." : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista del equipo */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Barberos</CardTitle>
            <CardDescription className="text-xs mt-0.5">Toca un barbero para editar sus datos.</CardDescription>
          </div>
          {puedeAgregarMas && (
            <Button size="sm" className="font-bold h-9 bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => setModalAgregar(true)}>
              + Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingEquipo ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">Cargando equipo...</div>
          ) : equipo.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
              No hay barberos todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {equipo.map((miembro) => (
                <div key={miembro.id} className={`border rounded-xl overflow-hidden transition-colors ${!miembro.activo ? "opacity-50" : ""}`}>
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 active:bg-muted/30 transition-colors"
                    onClick={() => editandoId === miembro.id ? setEditandoId(null) : abrirEdicion(miembro)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: miembro.color || "#18181b" }} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{miembro.name}</p>
                          {miembro.rol === "owner" && (
                            <span className="text-xs bg-zinc-950 text-white px-2 py-0.5 rounded-full font-bold">Dueño</span>
                          )}
                          {!miembro.activo && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">Inactivo</span>
                          )}
                          {!miembro.atiende_clientes && (
                            <span className="text-xs border border-border/50 text-muted-foreground px-2 py-0.5 rounded-full font-bold">Solo admin</span>
                          )}
                        </div>
                        {miembro.email && <p className="text-xs text-muted-foreground mt-0.5">{miembro.email}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-lg">${miembro.ingresosMes}</p>
                      <p className="text-xs text-muted-foreground">{miembro.turnosMes} turnos / mes</p>
                    </div>
                  </div>

                  {editandoId === miembro.id && (
                    <div className="border-t border-border/50 p-4 bg-muted/10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Nombre</Label>
                          <Input className="h-11 text-base bg-muted/30" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Color en agenda</Label>
                          <div className="flex gap-2 flex-wrap pt-1">
                            {COLORES_DISPONIBLES.map((color) => (
                              <button key={color} onClick={() => setEditColor(color)} className={`w-8 h-8 rounded-full border-2 transition-all ${editColor === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {miembro.rol !== "owner" && (
                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                          <div>
                            <p className="font-bold text-sm">Atiende clientes</p>
                            <p className="text-xs text-muted-foreground">Aparece como opción al agendar</p>
                          </div>
                          <button onClick={() => setEditAtiende(!editAtiende)} className={`w-12 h-6 rounded-full transition-colors relative ${editAtiende ? "bg-zinc-950" : "bg-muted"}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editAtiende ? "left-7" : "left-1"}`} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button className="font-bold h-10 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={guardarEdicion} disabled={guardandoEdicion}>
                          {guardandoEdicion ? "Guardando..." : "Guardar cambios"}
                        </Button>
                        <Button variant="outline" className="font-bold h-10" onClick={() => setEditandoId(null)}>Cancelar</Button>
                        {miembro.rol !== "owner" && (
                          <Button
                            variant="outline"
                            className={`font-bold h-10 ml-auto ${miembro.activo ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                            onClick={() => toggleActivo(miembro)}
                          >
                            {miembro.activo ? "Desactivar" : "Reactivar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!puedeAgregarMas && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <p className="font-bold text-amber-800">Límite de barberos alcanzado</p>
          <p className="text-amber-700 mt-0.5">El plan BOSS permite hasta {LIMITE_BARBEROS_PRO} barberos activos. Desactivá uno para agregar otro.</p>
        </div>
      )}
    </div>
  );
}