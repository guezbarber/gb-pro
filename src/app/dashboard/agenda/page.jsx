"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WelcomeModal from "@/components/WelcomeModal";
import DatePickerIOS from "@/components/DatePickerIOS";
import { CalendarOff, Pencil, Check, X, RotateCcw, Trash2, ShoppingBag, Calendar } from "lucide-react";

function esHoyLocal(fechaISO) {
  const fecha = new Date(fechaISO);
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
}

function getHoyStr() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

const LIMITE_BASICO = 50;

export default function AgendaPage() {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(getHoyStr());
  const [time, setTime] = useState("");

  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("basico");
  const [turnosMes, setTurnosMes] = useState(0);
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [calendarConectado, setCalendarConectado] = useState(false);
  const [barberIdState, setBarberIdState] = useState(null);
  const [barberoEmail, setBarberoEmail] = useState("");
  const [barberoNombre, setBarberoNombre] = useState("");
  const barberoEmailRef = useRef("");
  const barberoNombreRef = useRef("");
  const busquedaTimeout = useRef(null);

  const [modalVenta, setModalVenta] = useState(false);
  const [turnoCompletado, setTurnoCompletado] = useState(null);
  const [vendiendo, setVendiendo] = useState(false);

  const [modalBloqueo, setModalBloqueo] = useState(false);
  const [bloqueoFecha, setBloqueoFecha] = useState(getHoyStr());
  const [bloqueoInicio, setBloqueoInicio] = useState("09:00");
  const [bloqueoFin, setBloqueoFin] = useState("10:00");
  const [bloqueoMotivo, setBloqueoMotivo] = useState("");
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false);

  const [modalEditar, setModalEditar] = useState(false);
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [editFecha, setEditFecha] = useState(getHoyStr());
  const [editHora, setEditHora] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const setearHoraActual = () => {
    const ahora = new Date();
    setTime(`${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`);
  };

  useEffect(() => { loadData(); setearHoraActual(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberIdState(user.id);
    setBarberoEmail(user.email || "");
    barberoEmailRef.current = user.email || "";

    const { data: settings } = await supabase.from('barber_settings').select('plan, barber_name').eq('barber_id', user.id).single();
    if (settings) {
      setPlan(settings.plan || "basico");
      setBarberoNombre(settings.barber_name || "");
      barberoNombreRef.current = settings.barber_name || "";
    }

    const { data: servicesData } = await supabase.from('services').select('*').eq('barber_id', user.id);
    if (servicesData) setServices(servicesData);

    const { data: productosData } = await supabase.from('productos').select('*').eq('barber_id', user.id).gt('stock', 0).order('nombre', { ascending: true });
    if (productosData) setProductos(productosData);

    const { data: apptsData } = await supabase.from('appointments').select('*, services(name, price, duration_minutes)').eq('barber_id', user.id).order('start_time', { ascending: true });
    if (apptsData) {
      setAppointments(apptsData);
      const ahora = new Date();
      setTurnosMes(apptsData.filter(a => { const d = new Date(a.start_time); return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth(); }).length);
    }

    try {
      const res = await fetch(`/api/calendar?barber_id=${user.id}`);
      const json = await res.json();
      setCalendarConectado(json.conectado || false);
    } catch { setCalendarConectado(false); }
  };

  const crearEventoCalendar = async (appointment_id, client_name, servicio, start_time, duration_minutes) => {
    if (!calendarConectado || !barberIdState) return;
    try { await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barber_id: barberIdState, appointment_id, client_name, servicio, start_time, duration_minutes: duration_minutes || 30 }) }); } catch { }
  };

  const borrarEventoCalendar = async (appointment_id) => {
    if (!calendarConectado || !barberIdState) return;
    try { await fetch("/api/calendar", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barber_id: barberIdState, appointment_id }) }); } catch { }
  };

  const enviarEmail = async (tipo, datos) => {
    try {
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, ...datos }),
      });
    } catch {}
  };

  const handlePhoneChange = (e) => {
    const phone = e.target.value;
    setClientPhone(phone);
    setClienteEncontrado(false);
    if (busquedaTimeout.current) clearTimeout(busquedaTimeout.current);
    if (phone.length >= 6) {
      busquedaTimeout.current = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase.from('appointments').select('client_name, client_phone').eq('barber_id', user.id).eq('client_phone', phone).order('start_time', { ascending: false }).limit(1);
        if (data && data.length > 0) { setClientName(data[0].client_name || ""); setClienteEncontrado(true); }
      }, 500);
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const startTime = new Date(`${date}T${time}`).toISOString();
    const servicioSeleccionado = services.find(s => s.id === serviceId);

    const { data: insertedData, error } = await supabase.from('appointments').insert([{
      barber_id: user.id, service_id: serviceId, client_name: clientName,
      client_phone: clientPhone, start_time: startTime, status: 'pendiente',
    }]).select().single();

    if (!error && insertedData) {
      setClientName(""); setClientPhone(""); setServiceId(""); setClienteEncontrado(false);
      setearHoraActual(); loadData();
      crearEventoCalendar(insertedData.id, clientName, servicioSeleccionado?.name || "Turno", startTime, servicioSeleccionado?.duration_minutes || 30);

      // ✅ Email al barbero — usa ref para garantizar que el valor esté disponible
      const emailDestino = barberoEmailRef.current || user.email;
      const nombreDestino = barberoNombreRef.current || "";
      if (emailDestino) {
        const fechaFormateada = new Date(startTime).toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long" });
        const horaFormateada = new Date(startTime).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
        await enviarEmail("nuevo_turno_barbero", {
          barberoEmail: emailDestino,
          barberoNombre: nombreDestino,
          clienteNombre: clientName,
          servicio: servicioSeleccionado?.name || "Turno",
          fecha: fechaFormateada,
          hora: horaFormateada,
        });
      }
    } else if (error) { alert("Error al agendar: " + error.message); }
    setLoading(false);
  };

  const abrirModalEditar = (appt) => {
    const fecha = new Date(appt.start_time);
    setTurnoEditando(appt);
    setEditFecha(`${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`);
    setEditHora(`${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')}`);
    setEditServiceId(appt.service_id || "");
    setModalEditar(true);
  };

  const guardarEdicion = async () => {
    if (!editFecha || !editHora || !turnoEditando) return;
    setGuardandoEdicion(true);
    const newStartTime = new Date(`${editFecha}T${editHora}`).toISOString();
    const servicioSeleccionado = services.find(s => s.id === editServiceId);
    const { error } = await supabase.from('appointments').update({ start_time: newStartTime, service_id: editServiceId || turnoEditando.service_id }).eq('id', turnoEditando.id);
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === turnoEditando.id ? {
        ...a, start_time: newStartTime, service_id: editServiceId || a.service_id,
        services: servicioSeleccionado ? { name: servicioSeleccionado.name, price: servicioSeleccionado.price, duration_minutes: servicioSeleccionado.duration_minutes } : a.services,
      } : a).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      if (calendarConectado && turnoEditando.google_event_id) {
        await borrarEventoCalendar(turnoEditando.id);
        await crearEventoCalendar(turnoEditando.id, turnoEditando.client_name, servicioSeleccionado?.name || turnoEditando.services?.name || "Turno", newStartTime, servicioSeleccionado?.duration_minutes || turnoEditando.services?.duration_minutes || 30);
      }
      setModalEditar(false); setTurnoEditando(null);
    } else { alert("Error al editar: " + error.message); }
    setGuardandoEdicion(false);
  };

  const handleCompletar = (appt) => {
    setTurnoCompletado(appt);
    handleCambiarStatus(appt.id, 'completado');
    if (productos.length > 0) setModalVenta(true);
  };

  const handleCambiarStatus = async (id, nuevoStatus) => {
    const { error } = await supabase.from('appointments').update({ status: nuevoStatus }).eq('id', id);
    if (!error) setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: nuevoStatus } : a));
    else alert("Error: " + error.message);
  };

  const registrarVentaProducto = async (producto) => {
    setVendiendo(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("ventas_productos").insert([{ barber_id: user.id, producto_id: producto.id, producto_nombre: producto.nombre, precio: producto.precio, appointment_id: turnoCompletado?.id || null }]);
    if (!error) {
      await supabase.from("productos").update({ stock: producto.stock - 1 }).eq("id", producto.id);
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: p.stock - 1 } : p).filter(p => p.stock > 0));
    } else alert("Error: " + error.message);
    setVendiendo(false);
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("¿Borrar este turno?")) return;
    const appt = appointments.find(a => a.id === id);
    await borrarEventoCalendar(id);
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    setAppointments(appointments.filter(a => a.id !== id));
    setTurnosMes(prev => Math.max(0, prev - 1));
    const emailDestino = barberoEmailRef.current || barberoEmail;
    if (emailDestino && appt) {
      const fecha = new Date(appt.start_time);
      const fechaStr = fecha.toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long" });
      const horaStr = fecha.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
      await enviarEmail("turno_cancelado_barbero", {
        barberoEmail: emailDestino,
        barberoNombre: barberoNombreRef.current || barberoNombre,
        clienteNombre: appt.client_name,
        servicio: appt.services?.name || "Turno",
        fecha: fechaStr, hora: horaStr,
      });
    }
  };

  const guardarBloqueo = async () => {
    if (!bloqueoFecha || !bloqueoInicio || !bloqueoFin) return;
    if (bloqueoFin <= bloqueoInicio) { alert("La hora de fin debe ser mayor al inicio."); return; }
    setGuardandoBloqueo(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("blocked_slots").insert([{ barber_id: user.id, fecha: bloqueoFecha, hora_inicio: bloqueoInicio, hora_fin: bloqueoFin, motivo: bloqueoMotivo || null }]);
    if (!error) { setModalBloqueo(false); setBloqueoMotivo(""); }
    else alert("Error: " + error.message);
    setGuardandoBloqueo(false);
  };

  const turnosHoy = appointments.filter(appt => esHoyLocal(appt.start_time));
  const ingresosHoy = turnosHoy.filter(a => a.status !== 'falto').reduce((total, appt) => total + (appt.services?.price || 0), 0);
  const limiteAlcanzado = plan === "basico" && turnosMes >= LIMITE_BASICO;
  const turnosRestantes = Math.max(0, LIMITE_BASICO - turnosMes);

  const getStatusStyle = (status) => {
    if (status === 'completado') return { border: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700', texto: 'Completado' };
    if (status === 'falto') return { border: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-600', texto: 'Faltó' };
    return { border: 'border-border/60 bg-white', badge: '', texto: '' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative pb-20 md:pb-0">
      <WelcomeModal />

      {modalVenta && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">Corte completado</h2>
              <p className="text-zinc-400 text-sm mt-1">{turnoCompletado?.client_name} — ¿Le vendiste algún producto?</p>
            </div>
            <div className="p-6 space-y-4">
              {productos.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">No hay productos con stock disponible.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {productos.map((p) => (
                    <button key={p.id} onClick={() => registrarVentaProducto(p)} disabled={vendiendo || p.stock === 0}
                      className="flex flex-col items-center p-4 rounded-xl border border-border/50 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all text-center disabled:opacity-40 active:scale-95">
                      <ShoppingBag size={22} className="mb-2 opacity-60" />
                      <p className="font-bold text-sm">{p.nombre}</p>
                      <p className="font-black text-lg">${p.precio}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Stock: {p.stock}</p>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full font-bold h-12" onClick={() => { setModalVenta(false); setTurnoCompletado(null); }}>
                No, cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalBloqueo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">Bloquear horario</h2>
              <p className="text-zinc-400 text-sm mt-1">Este horario no estará disponible para reservas.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <DatePickerIOS value={bloqueoFecha} minDate={getHoyStr()} onChange={(fecha) => setBloqueoFecha(fecha)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={bloqueoInicio} onChange={(e) => setBloqueoInicio(e.target.value)} className="bg-muted/30 h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora fin</Label>
                  <Input type="time" value={bloqueoFin} onChange={(e) => setBloqueoFin(e.target.value)} className="bg-muted/30 h-12 text-base" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Motivo <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                <Input placeholder="Ej: Almuerzo, descanso..." value={bloqueoMotivo} onChange={(e) => setBloqueoMotivo(e.target.value)} className="bg-muted/30 h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => { setModalBloqueo(false); setBloqueoMotivo(""); }}>Cancelar</Button>
                <Button className="flex-1 font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={guardarBloqueo} disabled={guardandoBloqueo}>
                  {guardandoBloqueo ? "Guardando..." : "Bloquear"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEditar && turnoEditando && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">Editar turno</h2>
              <p className="text-zinc-400 text-sm mt-1">{turnoEditando.client_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Servicio</Label>
                <select className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base" value={editServiceId} onChange={(e) => setEditServiceId(e.target.value)}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <DatePickerIOS value={editFecha} minDate={getHoyStr()} onChange={(fecha) => setEditFecha(fecha)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={editHora} onChange={(e) => setEditHora(e.target.value)} className="bg-muted/30 h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => { setModalEditar(false); setTurnoEditando(null); }}>Cancelar</Button>
                <Button className="flex-1 font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={guardarEdicion} disabled={guardandoEdicion}>
                  {guardandoEdicion ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Agenda</h1>
        {calendarConectado && (
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={12} className="text-green-600" />
            <span className="text-xs font-medium text-green-600">Google Calendar activo</span>
          </div>
        )}
      </div>

      {plan === "basico" && (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${limiteAlcanzado ? "bg-red-50 border-red-200" : turnosRestantes <= 10 ? "bg-amber-50 border-amber-200" : "bg-muted/20 border-border/50"}`}>
          <div>
            {limiteAlcanzado ? (
              <>
                <p className="font-bold text-sm text-red-700">Límite del mes alcanzado</p>
                <p className="text-xs text-red-600 mt-0.5">Usaste los 50 turnos del plan básico.</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm">Plan Básico — {turnosMes}/{LIMITE_BASICO} este mes</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {turnosRestantes <= 10 ? `Quedan ${turnosRestantes} turnos.` : `Te quedan ${turnosRestantes} turnos.`}
                </p>
              </>
            )}
          </div>
          <a href="/dashboard/suscripcion">
            <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">Ver planes</Button>
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-zinc-900 border-none text-white">
          <CardContent className="p-4 md:p-5">
            <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">Turnos hoy</p>
            <p className="text-3xl md:text-4xl font-black">{turnosHoy.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-none text-white">
          <CardContent className="p-4 md:p-5">
            <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">Ingresos hoy</p>
            <p className="text-3xl md:text-4xl font-black">${ingresosHoy}</p>
          </CardContent>
        </Card>
        <button onClick={() => setModalBloqueo(true)} className="col-span-2 md:col-span-1 border-dashed border-2 bg-muted/20 rounded-xl flex flex-col items-center justify-center p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors">
          <CalendarOff size={20} className="mb-1.5 text-muted-foreground" />
          <p className="font-bold text-sm">Bloquear horario</p>
          <p className="text-xs text-muted-foreground">Para descansos</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Nuevo turno</CardTitle>
          </CardHeader>
          <CardContent>
            {limiteAlcanzado ? (
              <div className="text-center space-y-4 py-6">
                <p className="font-bold text-base">Límite alcanzado</p>
                <a href="/dashboard/suscripcion" className="block">
                  <Button className="w-full h-12 font-bold bg-zinc-950 text-white hover:bg-zinc-800">Ver planes</Button>
                </a>
              </div>
            ) : (
              <form onSubmit={handleAddAppointment} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone">Teléfono</Label>
                  <Input id="clientPhone" type="tel" placeholder="Número del cliente..." value={clientPhone} onChange={handlePhoneChange} className="bg-muted/30 h-11 text-base" />
                  {clienteEncontrado && <p className="text-xs text-green-600 font-medium">Cliente reconocido</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">Nombre</Label>
                  <Input id="clientName" required placeholder="Nombre del cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`bg-muted/30 h-11 text-base ${clienteEncontrado ? "border-green-300" : ""}`} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="service">Servicio</Label>
                  <select id="service" required className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                    <option value="" disabled>Selecciona un servicio</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <DatePickerIOS value={date} minDate={getHoyStr()} onChange={(fecha) => setDate(fecha)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Hora</Label>
                  <Input id="time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="bg-muted/30 h-11 text-base" />
                </div>
                <Button type="submit" className="w-full font-bold mt-2 h-12 text-base" disabled={loading || !serviceId}>
                  {loading ? "Agendando..." : "Confirmar turno"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Turnos</CardTitle>
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">{appointments.length}</span>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border-2 rounded-xl border-dashed bg-muted/10">
                La agenda está vacía. Agrega un turno.
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((appt) => {
                  const fecha = new Date(appt.start_time);
                  const esHoy = esHoyLocal(appt.start_time);
                  const precio = appt.services?.price;
                  const status = appt.status || 'pendiente';
                  const statusStyle = getStatusStyle(status);

                  return (
                    <div key={appt.id} className={`group relative flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-xl border transition-all gap-3 ${statusStyle.border}`}>
                      {esHoy && status === 'pendiente' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 rounded-l-xl" />}
                      {status === 'completado' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-xl" />}
                      {status === 'falto' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl" />}

                      <div className="pl-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base truncate">{appt.client_name}</p>
                          {status !== 'pendiente' && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle.badge}`}>{statusStyle.texto}</span>
                          )}
                          {appt.google_event_id && <Calendar size={12} className="text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {appt.services?.name}{appt.client_phone && <span className="mx-1">·</span>}{appt.client_phone}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pl-2 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-black text-lg">{fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className={`text-xs font-medium ${esHoy && status === 'pendiente' ? 'text-zinc-900' : 'text-muted-foreground'}`}>
                            {esHoy ? 'Hoy' : fecha.toLocaleDateString()}
                          </p>
                          {precio !== undefined && (
                            <p className={`text-sm font-bold ${status === 'falto' ? 'text-red-400 line-through' : 'text-zinc-700'}`}>${precio}</p>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          {status === 'pendiente' && (
                            <>
                              <Button size="sm" className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white active:scale-95" onClick={() => handleCompletar(appt)}>
                                <Check size={14} strokeWidth={2.5} />
                              </Button>
                              <Button size="sm" className="h-9 w-9 p-0 bg-red-500 hover:bg-red-600 text-white active:scale-95" onClick={() => handleCambiarStatus(appt.id, 'falto')}>
                                <X size={14} strokeWidth={2.5} />
                              </Button>
                            </>
                          )}
                          {status !== 'pendiente' && (
                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 active:scale-95" onClick={() => handleCambiarStatus(appt.id, 'pendiente')}>
                              <RotateCcw size={13} strokeWidth={2} />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-9 w-9 p-0 active:scale-95" onClick={() => abrirModalEditar(appt)}>
                            <Pencil size={13} strokeWidth={2} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 active:scale-95" onClick={() => handleDeleteAppointment(appt.id)}>
                            <Trash2 size={13} strokeWidth={2} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}