"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WelcomeModal from "@/components/WelcomeModal";
import DatePickerIOS from "@/components/DatePickerIOS";
import { CalendarOff, Pencil, Check, X, RotateCcw, Trash2, ShoppingBag, Calendar, Star } from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";

const INTERVALO = 15;

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
  const { t } = useIdioma();

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
  const [calendarError, setCalendarError] = useState(false);
  const [barberIdState, setBarberIdState] = useState(null);
  const [barberoEmail, setBarberoEmail] = useState("");
  const [barberoNombre, setBarberoNombre] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [fidelidadActiva, setFidelidadActiva] = useState(false);
  const [horasLibres, setHorasLibres] = useState([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const barberoEmailRef = useRef("");
  const barberoNombreRef = useRef("");
  const barberIdRef = useRef("");
  const notifEmailRef = useRef(true);
  const notifPushRef = useRef(true);
  const fidelidadActivaRef = useRef(false);
  const busquedaTimeout = useRef(null);

  const [modalVenta, setModalVenta] = useState(false);
  const [turnoCompletado, setTurnoCompletado] = useState(null);
  const [vendiendo, setVendiendo] = useState(false);
  const [puntosOtorgadosAviso, setPuntosOtorgadosAviso] = useState(null);

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
  const [horasLibresEditar, setHorasLibresEditar] = useState([]);
  const [cargandoHorasEditar, setCargandoHorasEditar] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (serviceId && date) calcularHorariosLibres(date, serviceId, setHorasLibres, setCargandoHoras, null);
  }, [date, serviceId]);

  useEffect(() => {
    if (modalEditar && editServiceId && editFecha) {
      calcularHorariosLibres(editFecha, editServiceId, setHorasLibresEditar, setCargandoHorasEditar, turnoEditando?.id);
    }
  }, [editFecha, editServiceId, modalEditar]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberIdState(user.id);
    barberIdRef.current = user.id;
    setBarberoEmail(user.email || "");
    barberoEmailRef.current = user.email || "";

    const { data: settings } = await supabase.from('barber_settings').select('plan, barber_name, notif_email, notif_push, open_time, close_time, fidelidad_activa').eq('barber_id', user.id).single();
    if (settings) {
      setPlan(settings.plan || "basico");
      setBarberoNombre(settings.barber_name || "");
      barberoNombreRef.current = settings.barber_name || "";
      setNotifEmail(settings.notif_email !== false);
      setNotifPush(settings.notif_push !== false);
      notifEmailRef.current = settings.notif_email !== false;
      notifPushRef.current = settings.notif_push !== false;
      setOpenTime(settings.open_time || "09:00");
      setCloseTime(settings.close_time || "20:00");
      setFidelidadActiva(settings.fidelidad_activa || false);
      fidelidadActivaRef.current = settings.fidelidad_activa || false;
    }

    const { data: servicesData } = await supabase.from('services').select('*').eq('barber_id', user.id);
    if (servicesData) setServices(servicesData);

    const { data: productosData } = await supabase.from('productos').select('*').eq('barber_id', user.id).gt('stock', 0).order('nombre', { ascending: true });
    if (productosData) setProductos(productosData);

    const { data: apptsData } = await supabase.from('appointments').select('*, services(name, price, duration_minutes, puntos)').eq('barber_id', user.id).order('start_time', { ascending: true });
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

  const calcularHorariosLibres = async (fecha, servicioId, setHoras, setCargando, excluirAppointmentId) => {
    const servicio = services.find(s => s.id === servicioId);
    if (!fecha || !servicio || !barberIdRef.current) { setHoras([]); return; }
    setCargando(true);

    const inicioDia = new Date(`${fecha}T00:00:00`).toISOString();
    const finDia = new Date(`${fecha}T23:59:59`).toISOString();

    const { data: turnosOcupados } = await supabase
      .from("appointments")
      .select("id, start_time, services(duration_minutes)")
      .eq("barber_id", barberIdRef.current)
      .gte("start_time", inicioDia)
      .lte("start_time", finDia);

    const { data: bloqueos } = await supabase
      .from("blocked_slots")
      .select("hora_inicio, hora_fin")
      .eq("barber_id", barberIdRef.current)
      .eq("fecha", fecha);

    const minutosBloqueados = new Set();

    (turnosOcupados || [])
      .filter(t => t.id !== excluirAppointmentId)
      .forEach((t) => {
        const inicio = new Date(t.start_time);
        const duracion = t.services?.duration_minutes || 30;
        for (let m = 0; m < duracion; m += INTERVALO) {
          const slot = new Date(inicio.getTime() + m * 60000);
          minutosBloqueados.add(`${String(slot.getHours()).padStart(2,"0")}:${String(slot.getMinutes()).padStart(2,"0")}`);
        }
      });

    (bloqueos || []).forEach((b) => {
      const [hIni, mIni] = b.hora_inicio.split(":").map(Number);
      const [hFin, mFin] = b.hora_fin.split(":").map(Number);
      const inicioMin = hIni * 60 + mIni;
      const finMin = hFin * 60 + mFin;
      for (let m = inicioMin; m < finMin; m += INTERVALO) {
        minutosBloqueados.add(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`);
      }
    });

    const duracionNuevo = servicio.duration_minutes || 30;
    const horariosCalculados = [];
    let horaActual = new Date(`2000-01-01T${openTime}`);
    const horaCierre = new Date(`2000-01-01T${closeTime}`);

    while (horaActual < horaCierre) {
      const horaStr = `${String(horaActual.getHours()).padStart(2,"0")}:${String(horaActual.getMinutes()).padStart(2,"0")}`;
      let disponible = true;
      for (let m = 0; m < duracionNuevo; m += INTERVALO) {
        const s = new Date(horaActual.getTime() + m * 60000);
        const sStr = `${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`;
        if (minutosBloqueados.has(sStr)) { disponible = false; break; }
      }
      const fin = new Date(horaActual.getTime() + duracionNuevo * 60000);
      if (fin > horaCierre) disponible = false;

      if (disponible) horariosCalculados.push(horaStr);
      horaActual.setMinutes(horaActual.getMinutes() + INTERVALO);
    }

    setHoras(horariosCalculados);
    setCargando(false);
  };

  const crearEventoCalendar = async (appointment_id, client_name, servicio, start_time, duration_minutes) => {
    if (!calendarConectado || !barberIdState) return;
    try {
      const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barber_id: barberIdState, appointment_id, client_name, servicio, start_time, duration_minutes: duration_minutes || 30 }) });
      if (res.status === 401) { const d = await res.json(); if (d.reconectar) { setCalendarConectado(false); setCalendarError(true); } }
    } catch {}
  };

  const borrarEventoCalendar = async (appointment_id) => {
    if (!calendarConectado || !barberIdState) return;
    try {
      const res = await fetch("/api/calendar", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ barber_id: barberIdState, appointment_id }) });
      if (res.status === 401) { const d = await res.json(); if (d.reconectar) { setCalendarConectado(false); setCalendarError(true); } }
    } catch {}
  };

  const enviarEmail = async (tipo, datos) => {
    if (!notifEmailRef.current) return;
    try {
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, ...datos }),
      });
    } catch {}
  };

  const enviarPush = async (titulo, cuerpo) => {
    if (!notifPushRef.current) return;
    try {
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barber_id: barberIdRef.current,
          title: titulo,
          body: cuerpo,
          url: "/dashboard/agenda",
        }),
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
    if (!time) { alert(t("agenda.eligeHorario")); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const startTime = new Date(`${date}T${time}`).toISOString();
    const servicioSeleccionado = services.find(s => s.id === serviceId);

    const { data: insertedData, error } = await supabase.from('appointments').insert([{
      barber_id: user.id, service_id: serviceId, client_name: clientName,
      client_phone: clientPhone, start_time: startTime, status: 'pendiente',
    }]).select().single();

    if (!error && insertedData) {
      setClientName(""); setClientPhone(""); setServiceId(""); setClienteEncontrado(false); setTime("");
      loadData();
      crearEventoCalendar(insertedData.id, clientName, servicioSeleccionado?.name || "Turno", startTime, servicioSeleccionado?.duration_minutes || 30);

      const emailDestino = barberoEmailRef.current || user.email;
      const nombreDestino = barberoNombreRef.current || "";
      const fechaFormateada = new Date(startTime).toLocaleDateString("es-UY", { weekday: "long", day: "2-digit", month: "long" });
      const horaFormateada = new Date(startTime).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });

      if (emailDestino) {
        await enviarEmail("nuevo_turno_barbero", {
          barberoEmail: emailDestino,
          barberoNombre: nombreDestino,
          clienteNombre: clientName,
          servicio: servicioSeleccionado?.name || "Turno",
          fecha: fechaFormateada,
          hora: horaFormateada,
        });
      }

      await enviarPush(
        `Nuevo turno — ${clientName}`,
        `${servicioSeleccionado?.name || "Turno"} a las ${horaFormateada}`
      );

    } else if (error) { alert("Error: " + error.message); }
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
        services: servicioSeleccionado ? { name: servicioSeleccionado.name, price: servicioSeleccionado.price, duration_minutes: servicioSeleccionado.duration_minutes, puntos: servicioSeleccionado.puntos } : a.services,
      } : a).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      if (calendarConectado && turnoEditando.google_event_id) {
        await borrarEventoCalendar(turnoEditando.id);
        await crearEventoCalendar(turnoEditando.id, turnoEditando.client_name, servicioSeleccionado?.name || turnoEditando.services?.name || "Turno", newStartTime, servicioSeleccionado?.duration_minutes || turnoEditando.services?.duration_minutes || 30);
      }
      setModalEditar(false); setTurnoEditando(null);
    } else { alert("Error: " + error.message); }
    setGuardandoEdicion(false);
  };

  // Suma los puntos del servicio al cliente cuando se completa el turno.
  // Solo si la fidelidad está activa, el servicio da puntos, y no se otorgaron antes.
  const otorgarPuntosPorTurno = async (appt) => {
    if (!fidelidadActivaRef.current) return;
    if (appt.puntos_otorgados) return;
    const puntosServicio = appt.services?.puntos || 0;
    if (puntosServicio <= 0) return;

    const clientKey = appt.client_phone?.trim() || appt.client_name?.trim();
    if (!clientKey) return;

    const { data: actual } = await supabase
      .from("client_points")
      .select("puntos")
      .eq("barber_id", barberIdRef.current)
      .eq("client_key", clientKey)
      .single();

    const puntosPrevios = actual?.puntos || 0;
    const nuevosPuntos = puntosPrevios + puntosServicio;

    await supabase.from("client_points").upsert(
      { barber_id: barberIdRef.current, client_key: clientKey, client_name: appt.client_name, puntos: nuevosPuntos },
      { onConflict: "barber_id,client_key" }
    );

    await supabase.from("appointments").update({ puntos_otorgados: true }).eq("id", appt.id);

    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, puntos_otorgados: true } : a));
    setPuntosOtorgadosAviso({ nombre: appt.client_name, puntos: puntosServicio });
    setTimeout(() => setPuntosOtorgadosAviso(null), 3500);
  };

  const handleCompletar = (appt) => {
    setTurnoCompletado(appt);
    handleCambiarStatus(appt.id, 'completado');
    otorgarPuntosPorTurno(appt);
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
    if (!window.confirm(t("agenda.borrarTurnoConfirm"))) return;
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
      await enviarPush(
        `Turno cancelado — ${appt.client_name}`,
        `${appt.services?.name || "Turno"} del ${fechaStr} a las ${horaStr}`
      );
    }
  };

  const guardarBloqueo = async () => {
    if (!bloqueoFecha || !bloqueoInicio || !bloqueoFin) return;
    if (bloqueoFin <= bloqueoInicio) { alert(t("agenda.horaFinMayorInicio")); return; }
    setGuardandoBloqueo(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("blocked_slots").insert([{ barber_id: user.id, fecha: bloqueoFecha, hora_inicio: bloqueoInicio, hora_fin: bloqueoFin, motivo: bloqueoMotivo || null }]);
    if (!error) { setModalBloqueo(false); setBloqueoMotivo(""); }
    else alert("Error: " + error.message);
    setGuardandoBloqueo(false);
  };

  const limiteAlcanzado = plan === "basico" && turnosMes >= LIMITE_BASICO;
  const turnosRestantes = Math.max(0, LIMITE_BASICO - turnosMes);

  const getStatusStyle = (status) => {
    if (status === 'completado') return { border: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700', texto: t("agenda.completado") };
    if (status === 'falto') return { border: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-600', texto: t("agenda.falto") };
    return { border: 'border-border/60 bg-white', badge: '', texto: '' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative pb-20 md:pb-0">
      <WelcomeModal />

      {puntosOtorgadosAviso && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-4">
          <Star size={16} className="text-amber-400" strokeWidth={2.5} />
          <p className="text-sm font-bold">+{puntosOtorgadosAviso.puntos} {t("agenda.puntosPara")} {puntosOtorgadosAviso.nombre}</p>
        </div>
      )}

      {modalVenta && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">{t("agenda.corteCompletado")}</h2>
              <p className="text-zinc-400 text-sm mt-1">{turnoCompletado?.client_name} — {t("agenda.vendisteProducto")}</p>
            </div>
            <div className="p-6 space-y-4">
              {productos.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">{t("agenda.sinProductosStock")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {productos.map((p) => (
                    <button key={p.id} onClick={() => registrarVentaProducto(p)} disabled={vendiendo || p.stock === 0}
                      className="flex flex-col items-center p-4 rounded-xl border border-border/50 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all text-center disabled:opacity-40 active:scale-95">
                      <ShoppingBag size={22} className="mb-2 opacity-60" />
                      <p className="font-bold text-sm">{p.nombre}</p>
                      <p className="font-black text-lg">${p.precio}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("agenda.stock")}: {p.stock}</p>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full font-bold h-12" onClick={() => { setModalVenta(false); setTurnoCompletado(null); }}>
                {t("agenda.noCerrar")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalBloqueo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">{t("agenda.bloquearHorarioTitulo")}</h2>
              <p className="text-zinc-400 text-sm mt-1">{t("agenda.bloquearHorarioDesc")}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>{t("agenda.fecha")}</Label>
                <DatePickerIOS value={bloqueoFecha} minDate={getHoyStr()} onChange={(fecha) => setBloqueoFecha(fecha)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("agenda.horaInicio")}</Label>
                  <Input type="time" value={bloqueoInicio} onChange={(e) => setBloqueoInicio(e.target.value)} className="bg-muted/30 h-12 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("agenda.horaFin")}</Label>
                  <Input type="time" value={bloqueoFin} onChange={(e) => setBloqueoFin(e.target.value)} className="bg-muted/30 h-12 text-base" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("agenda.motivo")} <span className="text-muted-foreground text-xs font-normal">{t("agenda.opcional")}</span></Label>
                <Input placeholder={t("agenda.placeholderMotivo")} value={bloqueoMotivo} onChange={(e) => setBloqueoMotivo(e.target.value)} className="bg-muted/30 h-12 text-base" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => { setModalBloqueo(false); setBloqueoMotivo(""); }}>{t("agenda.cancelar")}</Button>
                <Button className="flex-1 font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={guardarBloqueo} disabled={guardandoBloqueo}>
                  {guardandoBloqueo ? t("agenda.guardando") : t("agenda.bloquear")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEditar && turnoEditando && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">{t("agenda.editarTurno")}</h2>
              <p className="text-zinc-400 text-sm mt-1">{turnoEditando.client_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>{t("agenda.servicio")}</Label>
                <select className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base" value={editServiceId} onChange={(e) => { setEditServiceId(e.target.value); setEditHora(""); }}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("agenda.fecha")}</Label>
                <DatePickerIOS value={editFecha} minDate={getHoyStr()} onChange={(fecha) => { setEditFecha(fecha); setEditHora(""); }} />
              </div>
              <div className="space-y-2">
                <Label>{t("agenda.hora")}</Label>
                {cargandoHorasEditar ? (
                  <p className="text-sm text-muted-foreground text-center py-4 animate-pulse">{t("agenda.buscandoHorarios")}</p>
                ) : horasLibresEditar.length === 0 ? (
                  <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg text-center">{t("agenda.sinHorariosLibresEseDia")}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {horasLibresEditar.map((hora) => (
                      <button key={hora} type="button" onClick={() => setEditHora(hora)}
                        className={`p-2.5 rounded-lg border text-center font-bold transition-all text-xs active:scale-95 ${
                          editHora === hora ? "bg-zinc-950 text-white border-zinc-950" : "bg-background hover:border-zinc-400 hover:bg-muted/20"
                        }`}>
                        {hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => { setModalEditar(false); setTurnoEditando(null); }}>{t("agenda.cancelar")}</Button>
                <Button className="flex-1 font-bold h-12 bg-zinc-950 hover:bg-zinc-800 text-white" onClick={guardarEdicion} disabled={guardandoEdicion || !editHora}>
                  {guardandoEdicion ? t("agenda.guardando") : t("agenda.guardar")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("agenda.titulo")}</h1>
          {calendarConectado && (
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar size={12} className="text-green-600" />
              <span className="text-xs font-medium text-green-600">{t("agenda.googleCalendarActivo")}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setModalBloqueo(true)}
          className="shrink-0 flex items-center gap-2 border-2 border-dashed rounded-xl px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted/50 active:bg-muted/70 transition-colors"
        >
          <CalendarOff size={16} />
          {t("agenda.bloquearHorario")}
        </button>
      </div>

      {calendarError && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <p className="font-medium text-amber-800">{t("agenda.calendarError")}</p>
          <a href="/dashboard/configuracion?tab=general" className="shrink-0 font-bold text-amber-900 underline underline-offset-2 hover:text-amber-700">
            {t("agenda.calendarReconectar")}
          </a>
        </div>
      )}

      {plan === "basico" && (
        <div className={`flex items-center justify-between p-4 rounded-xl border ${limiteAlcanzado ? "bg-red-50 border-red-200" : turnosRestantes <= 10 ? "bg-amber-50 border-amber-200" : "bg-muted/20 border-border/50"}`}>
          <div>
            {limiteAlcanzado ? (
              <>
                <p className="font-bold text-sm text-red-700">{t("agenda.limiteAlcanzado")}</p>
                <p className="text-xs text-red-600 mt-0.5">{t("agenda.usasteLimite")}</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm">{t("agenda.planBasico")} — {turnosMes}/{LIMITE_BASICO} {t("agenda.esteMes")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {turnosRestantes <= 10 ? `${t("agenda.quedan")} ${turnosRestantes} ${t("agenda.turnosLower")}.` : `${t("agenda.teQuedan")} ${turnosRestantes} ${t("agenda.turnosLower")}.`}
                </p>
              </>
            )}
          </div>
          <a href="/dashboard/suscripcion">
            <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">{t("agenda.verPlanes")}</Button>
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{t("agenda.nuevoTurno")}</CardTitle>
          </CardHeader>
          <CardContent>
            {limiteAlcanzado ? (
              <div className="text-center space-y-4 py-6">
                <p className="font-bold text-base">{t("agenda.limiteAlcanzadoCorto")}</p>
                <a href="/dashboard/suscripcion" className="block">
                  <Button className="w-full h-12 font-bold bg-zinc-950 text-white hover:bg-zinc-800">{t("agenda.verPlanes")}</Button>
                </a>
              </div>
            ) : (
              <form onSubmit={handleAddAppointment} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone">{t("agenda.telefono")}</Label>
                  <Input id="clientPhone" type="tel" placeholder={t("agenda.placeholderTelefono")} value={clientPhone} onChange={handlePhoneChange} className="bg-muted/30 h-11 text-base" />
                  {clienteEncontrado && <p className="text-xs text-green-600 font-medium">{t("agenda.clienteReconocido")}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">{t("agenda.nombre")}</Label>
                  <Input id="clientName" required placeholder={t("agenda.placeholderNombre")} value={clientName} onChange={(e) => setClientName(e.target.value)} className={`bg-muted/30 h-11 text-base ${clienteEncontrado ? "border-green-300" : ""}`} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="service">{t("agenda.servicio")}</Label>
                  <select id="service" required className="flex h-11 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base" value={serviceId} onChange={(e) => { setServiceId(e.target.value); setTime(""); }}>
                    <option value="" disabled>{t("agenda.seleccionaServicio")}</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${s.price}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("agenda.fecha")}</Label>
                  <DatePickerIOS value={date} minDate={getHoyStr()} onChange={(fecha) => { setDate(fecha); setTime(""); }} />
                </div>
                <div className="space-y-2">
                  <Label>{t("agenda.hora")}</Label>
                  {!serviceId ? (
                    <p className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg text-center">{t("agenda.elegiServicioPrimero")}</p>
                  ) : cargandoHoras ? (
                    <p className="text-sm text-muted-foreground text-center py-4 animate-pulse">{t("agenda.buscandoHorarios")}</p>
                  ) : horasLibres.length === 0 ? (
                    <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg text-center">{t("agenda.sinHorariosLibres")}</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {horasLibres.map((hora) => (
                        <button key={hora} type="button" onClick={() => setTime(hora)}
                          className={`p-2.5 rounded-lg border text-center font-bold transition-all text-xs active:scale-95 ${
                            time === hora ? "bg-zinc-950 text-white border-zinc-950" : "bg-background hover:border-zinc-400 hover:bg-muted/20"
                          }`}>
                          {hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full font-bold mt-2 h-12 text-base" disabled={loading || !serviceId || !time}>
                  {loading ? t("agenda.agendando") : t("agenda.confirmarTurno")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">{t("agenda.turnos")}</CardTitle>
            <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">{appointments.length}</span>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border-2 rounded-xl border-dashed bg-muted/10">
                {t("agenda.agendaVacia")}
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
                          {fidelidadActiva && appt.puntos_otorgados && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                              <Star size={10} strokeWidth={2.5} /> +{appt.services?.puntos || 0}
                            </span>
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
                            {esHoy ? t("agenda.hoy") : fecha.toLocaleDateString()}
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
