"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePickerIOS from "@/components/DatePickerIOS";
import { Star, Gift, Check } from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";

const INTERVALO = 15;

const BANDERAS = { es: "🇪🇸", en: "🇺🇸", pt: "🇧🇷" };
const NOMBRES_IDIOMA = { es: "ES", en: "EN", pt: "PT" };

function getHoyStr() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
}

export default function ReservaPublicaPage({ params }) {
  const { id: barberId } = use(params);
  const { idioma, t, cambiarIdioma, listo } = useIdioma();
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  const [paso, setPaso] = useState(1);
  const [config, setConfig] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [horasLibres, setHorasLibres] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [barberoElegido, setBarberoElegido] = useState(null);
  const [tieneEquipo, setTieneEquipo] = useState(false);
  const [servicioElegido, setServicioElegido] = useState(null);
  const [fechaElegida, setFechaElegida] = useState(getHoyStr());
  const [horaElegida, setHoraElegida] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [barberoEmail, setBarberoEmail] = useState("");
  const [barbershopId, setBarbershopId] = useState(null);

  const [porcentajeSena, setPorcentajeSena] = useState(0);
  const [montoSena, setMontoSena] = useState(0);
  const [pagandoSena, setPagandoSena] = useState(false);

  const [loading, setLoading] = useState(false);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  // -- Sistema de puntos (cliente) --
  const [fidelidadActiva, setFidelidadActiva] = useState(false);
  const [recompensas, setRecompensas] = useState([]);
  const [telefonoPuntos, setTelefonoPuntos] = useState("");
  const [buscandoPuntos, setBuscandoPuntos] = useState(false);
  const [clientePuntos, setClientePuntos] = useState(null);
  const [puntosNoEncontrado, setPuntosNoEncontrado] = useState(false);
  const [canjeando, setCanjeando] = useState(null);
  const [recompensaCanjeada, setRecompensaCanjeada] = useState(null);

  useEffect(() => {
    if (barberId) cargarDatosBarberia();
  }, [barberId]);

  useEffect(() => {
    if (paso === 3 && servicioElegido && fechaElegida) {
      calcularHorariosLibres(fechaElegida);
    }
  }, [fechaElegida, paso]);

  useEffect(() => {
    if (servicioElegido && porcentajeSena > 0) {
      setMontoSena(Math.round(servicioElegido.price * porcentajeSena / 100));
    } else {
      setMontoSena(0);
    }
  }, [servicioElegido, porcentajeSena]);

  const cargarDatosBarberia = async () => {
    const { data: cfg, error } = await supabase
      .from("barber_settings")
      .select("*")
      .eq("barber_id", barberId)
      .single();

    if (error || !cfg) {
      setErrorCarga(t("reserva.barberiaNoEncontrada"));
      return;
    }
    setConfig(cfg);
    setPorcentajeSena(cfg.porcentaje_sena || 0);
    setFidelidadActiva(cfg.fidelidad_activa || false);

    try {
      const res = await fetch(`/api/barber-email?barber_id=${barberId}`);
      const json = await res.json();
      if (json.email) setBarberoEmail(json.email);
    } catch {}

    const { data: svcs } = await supabase
      .from("services")
      .select("*")
      .eq("barber_id", barberId)
      .order("name", { ascending: true });
    if (svcs) setServicios(svcs);

    if (cfg.fidelidad_activa) {
      const { data: recs } = await supabase
        .from("recompensas")
        .select("*")
        .eq("barber_id", barberId)
        .eq("activa", true)
        .order("costo_puntos", { ascending: true });
      if (recs) setRecompensas(recs);
    }

    const { data: bshop } = await supabase
      .from("barbershops")
      .select("id, porcentaje_sena")
      .eq("owner_id", barberId)
      .single();

    if (bshop) {
      setBarbershopId(bshop.id);
      if (bshop.porcentaje_sena > 0) setPorcentajeSena(bshop.porcentaje_sena);

      const { data: equipo } = await supabase
        .from("barbers")
        .select("id, name, color")
        .eq("barbershop_id", bshop.id)
        .eq("atiende_clientes", true)
        .eq("activo", true)
        .order("created_at", { ascending: true });

      if (equipo && equipo.length > 1) {
        setBarberos(equipo);
        setTieneEquipo(true);
      } else if (equipo && equipo.length === 1) {
        setBarberoElegido(equipo[0]);
        setTieneEquipo(false);
      }
    }
  };

  const calcularHorariosLibres = async (fecha) => {
    if (!config || !servicioElegido) return;
    setHoraElegida("");
    setCargandoHoras(true);

    const inicioDia = new Date(`${fecha}T00:00:00`).toISOString();
    const finDia = new Date(`${fecha}T23:59:59`).toISOString();

    let query = supabase
      .from("appointments")
      .select("start_time, services(duration_minutes)")
      .eq("barber_id", barberId)
      .gte("start_time", inicioDia)
      .lte("start_time", finDia);

    if (barberoElegido) query = query.eq("barber_member_id", barberoElegido.id);

    const { data: turnosOcupados } = await query;
    const { data: bloqueos } = await supabase
      .from("blocked_slots")
      .select("hora_inicio, hora_fin")
      .eq("barber_id", barberId)
      .eq("fecha", fecha);

    const minutosBloqueados = new Set();

    (turnosOcupados || []).forEach((t) => {
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

    const duracionNuevo = servicioElegido.duration_minutes || 30;
    const horariosCalculados = [];
    let horaActual = new Date(`2000-01-01T${config.open_time}`);
    const horaCierre = new Date(`2000-01-01T${config.close_time}`);

    const antelacionMinutos = config.antelacion_minutos ?? 30;
    const ahora = new Date();
    const limiteReserva = new Date(ahora.getTime() + antelacionMinutos * 60000);

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

      const [hSlot, mSlot] = horaStr.split(":").map(Number);
      const slotDatetime = new Date(`${fecha}T00:00:00`);
      slotDatetime.setHours(hSlot, mSlot, 0, 0);

      if (slotDatetime < limiteReserva) disponible = false;

      if (disponible) horariosCalculados.push(horaStr);
      horaActual.setMinutes(horaActual.getMinutes() + INTERVALO);
    }

    setHorasLibres(horariosCalculados);
    setCargandoHoras(false);
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

  const enviarPush = async (titulo, cuerpo) => {
    try {
      await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barber_id: barberId,
          title: titulo,
          body: cuerpo,
          url: "/dashboard/agenda",
        }),
      });
    } catch {}
  };

  const buscarPuntos = async () => {
    const tel = telefonoPuntos.trim();
    if (tel.length < 6) return;
    setBuscandoPuntos(true);
    setPuntosNoEncontrado(false);
    setClientePuntos(null);

    const { data: puntosData } = await supabase
      .from("client_points")
      .select("client_key, client_name, puntos")
      .eq("barber_id", barberId)
      .eq("client_key", tel)
      .single();

    if (puntosData) {
      setClientePuntos({ key: puntosData.client_key, nombre: puntosData.client_name, puntos: puntosData.puntos });
    } else {
      const { data: turnoData } = await supabase
        .from("appointments")
        .select("client_name, client_email")
        .eq("barber_id", barberId)
        .eq("client_phone", tel)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (turnoData) {
        setClientePuntos({ key: tel, nombre: turnoData.client_name, puntos: 0, email: turnoData.client_email });
      } else {
        setPuntosNoEncontrado(true);
      }
    }
    setBuscandoPuntos(false);
  };

  const canjearRecompensa = async (recompensa) => {
    if (!clientePuntos || clientePuntos.puntos < recompensa.costo_puntos) return;
    setCanjeando(recompensa.id);

    const nuevosPuntos = clientePuntos.puntos - recompensa.costo_puntos;

    const { error: errPuntos } = await supabase.from("client_points").upsert(
      { barber_id: barberId, client_key: clientePuntos.key, client_name: clientePuntos.nombre, puntos: nuevosPuntos },
      { onConflict: "barber_id,client_key" }
    );

    if (errPuntos) { alert("Error: " + errPuntos.message); setCanjeando(null); return; }

    await supabase.from("canjes").insert([{
      barber_id: barberId,
      client_key: clientePuntos.key,
      client_name: clientePuntos.nombre,
      recompensa_id: recompensa.id,
      recompensa_nombre: recompensa.nombre,
      costo_puntos: recompensa.costo_puntos,
      entregado: false,
    }]);

    let emailCliente = clientePuntos.email;
    if (!emailCliente) {
      const { data: turnoData } = await supabase
        .from("appointments")
        .select("client_email")
        .eq("barber_id", barberId)
        .eq("client_phone", clientePuntos.key)
        .not("client_email", "is", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();
      if (turnoData?.client_email) emailCliente = turnoData.client_email;
    }

    const barberoNombre = config.barber_name || "GB PRO";

    if (emailCliente) {
      await enviarEmail("recompensa_canjeada", {
        clienteEmail: emailCliente,
        clienteNombre: clientePuntos.nombre,
        barberoNombre,
        recompensa: recompensa.nombre,
        puntos: recompensa.costo_puntos,
        puntosRestantes: nuevosPuntos,
      });
    }

    if (barberoEmail) {
      await enviarEmail("recompensa_canjeada_barbero", {
        barberoEmail,
        barberoNombre,
        clienteNombre: clientePuntos.nombre,
        recompensa: recompensa.nombre,
        puntos: recompensa.costo_puntos,
      });
    }
    await enviarPush(
      `Canje - ${clientePuntos.nombre}`,
      `Canjeó: ${recompensa.nombre} (${recompensa.costo_puntos} pts)`
    );

    setClientePuntos(prev => ({ ...prev, puntos: nuevosPuntos }));
    setRecompensaCanjeada(recompensa.nombre);
    setCanjeando(null);
    setTimeout(() => setRecompensaCanjeada(null), 5000);
  };

  const confirmarReserva = async (e) => {
    e.preventDefault();
    setLoading(true);

    const startTime = new Date(`${fechaElegida}T${horaElegida}`).toISOString();
    const externalRef = `sena_${barberId}_${Date.now()}`;
    const requiereSena = porcentajeSena > 0 && montoSena > 0;

    const { data: insertedData, error } = await supabase.from("appointments").insert([{
      barber_id: barberId,
      barbershop_id: barbershopId,
      service_id: servicioElegido.id,
      client_name: nombre,
      client_phone: telefono,
      client_email: email || null,
      start_time: startTime,
      barber_member_id: barberoElegido?.id || null,
      sena_requerida: requiereSena,
      sena_pagada: false,
      mp_external_reference: requiereSena ? externalRef : null,
    }]).select().single();

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
      return;
    }

    const barberoNombre = config.barber_name || "GB PRO";
    const fechaFormateada = new Date(`${fechaElegida}T${horaElegida}`).toLocaleDateString(idioma, { weekday: "long", day: "2-digit", month: "long" });

    if (!requiereSena) {
      if (email) {
        await enviarEmail("confirmacion_turno", {
          clienteEmail: email,
          clienteNombre: nombre,
          barberoNombre,
          servicio: servicioElegido.name,
          fecha: fechaFormateada,
          hora: horaElegida,
        });
      }
      if (barberoEmail) {
        await enviarEmail("nuevo_turno_barbero", {
          barberoEmail,
          barberoNombre,
          clienteNombre: nombre,
          servicio: servicioElegido.name,
          fecha: fechaFormateada,
          hora: horaElegida,
        });
      }

      await enviarPush(
        `Nueva reserva - ${nombre}`,
        `${servicioElegido.name} el ${fechaElegida} a las ${horaElegida}`
      );

      setLoading(false);
      setPaso(6);
      return;
    }

    setPagandoSena(true);
    try {
      const res = await fetch("/api/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barber_id: barberId,
          service_name: servicioElegido.name,
          service_price: servicioElegido.price,
          porcentaje_sena: porcentajeSena,
          client_name: nombre,
          client_email: email || undefined,
          fecha: fechaElegida,
          hora: horaElegida,
          appointment_temp_id: externalRef,
        }),
      });

      const data = await res.json();

      if (data.sandbox_init_point || data.init_point) {
        const urlPago = process.env.NODE_ENV === "production" ? data.init_point : data.sandbox_init_point;
        window.location.href = urlPago;
      } else {
        alert("Error: " + (data.error || "Error desconocido"));
        setLoading(false);
        setPagandoSena(false);
      }
    } catch (err) {
      alert(t("reserva.errorConexion"));
      setLoading(false);
      setPagandoSena(false);
    }
  };

  const SelectorIdioma = () => (
    <div className="relative">
      <button
        onClick={() => setSelectorAbierto(!selectorAbierto)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
      >
        {BANDERAS[idioma]} {NOMBRES_IDIOMA[idioma]}
      </button>
      {selectorAbierto && (
        <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden z-50 min-w-[100px]">
          {Object.keys(BANDERAS).map((cod) => (
            <button
              key={cod}
              onClick={() => { cambiarIdioma(cod); setSelectorAbierto(false); }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-bold text-left hover:bg-muted/30 transition-colors ${idioma === cod ? "bg-muted/20" : ""}`}
            >
              {BANDERAS[cod]} {NOMBRES_IDIOMA[cod]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (!listo) return null;

  if (errorCarga) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center bg-muted/20">
      <p className="text-destructive font-bold text-lg">{errorCarga}</p>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="flex flex-col items-center gap-4">
        <p className="font-black text-2xl text-primary animate-pulse tracking-tighter">GB PRO</p>
        <p className="text-muted-foreground text-sm">{t("reserva.cargandoBarberia")}</p>
      </div>
    </div>
  );

  const requiereSena = porcentajeSena > 0 && montoSena > 0;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">

      <div className="w-full bg-background border-b border-border/40 py-3 px-4 flex justify-between items-center">
        <span className="font-black tracking-tighter text-lg text-primary">GB PRO</span>
      </div>

      <div className="flex-1 p-4 md:p-8 flex justify-center items-start">
        <Card className="w-full max-w-lg border-border/50 shadow-xl mt-4 sm:mt-10 overflow-hidden">

          <div className="bg-zinc-950 p-6 md:p-8 text-center relative">
            <div className="absolute top-4 right-4">
              <SelectorIdioma />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {config.plan === 'PRO' || config.plan === 'BOSS' ? config.barber_name : 'GB PRO'}
            </h1>
            <p className="text-zinc-400 mt-2 text-sm font-medium">{t("reserva.reservaTurnoOnline")}</p>
            {(config.plan === 'PRO' || config.plan === 'BOSS') && config.instagram && (
              <a href={`https://instagram.com/${config.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                @{config.instagram.replace("@","")}
              </a>
            )}
          </div>

          <CardContent className="p-6 md:p-8">

            {paso === 1 && tieneEquipo && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold mb-4">{t("reserva.elegirBarbero")}</h2>
                <div className="grid gap-3">
                  {barberos.map((b) => (
                    <button key={b.id} onClick={() => { setBarberoElegido(b); setPaso(2); }}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-background hover:border-zinc-400 hover:bg-muted/20 active:scale-[0.98] transition-all text-left shadow-sm">
                      <div className="w-4 h-10 rounded-full shrink-0" style={{ backgroundColor: b.color || "#18181b" }} />
                      <p className="font-bold text-lg">{b.name}</p>
                    </button>
                  ))}
                  <button onClick={() => { setBarberoElegido(null); setPaso(2); }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border/50 bg-background hover:bg-muted/20 active:scale-[0.98] transition-all text-left">
                    <p className="text-muted-foreground font-medium text-sm">{t("reserva.sinPreferencia")}</p>
                  </button>
                </div>
              </div>
            )}

            {paso === 1 && !tieneEquipo && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold mb-4">{t("reserva.elegirServicio")}</h2>
                <div className="grid gap-3">
                  {servicios.map((svc) => (
                    <button key={svc.id} onClick={() => { setServicioElegido(svc); setPaso(3); }}
                      className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background hover:border-zinc-400 hover:bg-muted/20 active:scale-[0.98] transition-all text-left shadow-sm">
                      <div>
                        <p className="font-bold text-lg">{svc.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{svc.duration_minutes} {t("reserva.min")}</p>
                      </div>
                      <p className="font-extrabold text-xl">${svc.price}</p>
                    </button>
                  ))}
                </div>

                {fidelidadActiva && (
                  <div className="pt-4 mt-2 border-t border-border/50">
                    {!clientePuntos ? (
                      <div className="bg-zinc-950 text-white rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Star size={18} className="text-amber-400" />
                          <p className="font-black text-base">{t("reserva.misPuntos")}</p>
                        </div>
                        <p className="text-zinc-400 text-sm">{t("reserva.ingresaTelefono")}</p>
                        <div className="flex gap-2">
                          <Input
                            type="tel"
                            placeholder={t("reserva.tuTelefono")}
                            className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-zinc-500"
                            value={telefonoPuntos}
                            onChange={(e) => { setTelefonoPuntos(e.target.value); setPuntosNoEncontrado(false); }}
                          />
                          <Button
                            className="h-12 px-5 font-bold bg-white text-black hover:bg-zinc-200 shrink-0"
                            onClick={buscarPuntos}
                            disabled={buscandoPuntos || telefonoPuntos.trim().length < 6}
                          >
                            {buscandoPuntos ? "..." : t("reserva.ver")}
                          </Button>
                        </div>
                        {puntosNoEncontrado && (
                          <p className="text-zinc-400 text-xs">{t("reserva.puntosNoEncontrado")}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-zinc-950 text-white rounded-2xl p-5 text-center">
                          <p className="text-zinc-400 text-sm">{t("reserva.hola")}{clientePuntos.nombre}</p>
                          <p className="text-5xl font-black mt-1">{clientePuntos.puntos}</p>
                          <p className="text-zinc-400 text-sm">{t("reserva.puntosDisponibles")}</p>
                          <button onClick={() => { setClientePuntos(null); setTelefonoPuntos(""); }} className="text-zinc-500 text-xs mt-3 hover:text-white transition-colors">
                            {t("reserva.cambiarTelefono")}
                          </button>
                        </div>

                        {recompensaCanjeada && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <Check size={18} className="text-green-600" strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-green-800">{t("reserva.canjeastePre")}{recompensaCanjeada}!</p>
                              <p className="text-xs text-green-700">{t("reserva.muestraCanje")}</p>
                            </div>
                          </div>
                        )}

                        {recompensas.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-muted-foreground">{t("reserva.recompensasDisponibles")}</p>
                            {recompensas.map((r) => {
                              const alcanza = clientePuntos.puntos >= r.costo_puntos;
                              return (
                                <div key={r.id} className={`flex items-center justify-between p-4 rounded-xl border ${alcanza ? "border-border/50 bg-background" : "border-border/30 bg-muted/20 opacity-60"}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                      <Gift size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm">{r.nombre}</p>
                                      <p className="text-xs text-muted-foreground">{r.costo_puntos} {t("reserva.puntos")}</p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="font-bold h-10 bg-zinc-950 text-white hover:bg-zinc-800 shrink-0 disabled:opacity-40"
                                    disabled={!alcanza || canjeando === r.id}
                                    onClick={() => canjearRecompensa(r)}
                                  >
                                    {canjeando === r.id ? "..." : alcanza ? t("reserva.canjear") : t("reserva.faltanPts")}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-xl">
                            {t("reserva.sinRecompensas")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {paso === 2 && tieneEquipo && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">{t("reserva.elegirServicio2")}</h2>
                  <button onClick={() => setPaso(1)} className="text-sm text-muted-foreground hover:text-foreground font-medium">{t("reserva.volver")}</button>
                </div>
                {barberoElegido && (
                  <div className="bg-muted/20 px-4 py-2 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: barberoElegido.color || "#18181b" }} />
                    <span>{t("reserva.barbero")}: <strong className="text-foreground">{barberoElegido.name}</strong></span>
                  </div>
                )}
                <div className="grid gap-3">
                  {servicios.map((svc) => (
                    <button key={svc.id} onClick={() => { setServicioElegido(svc); setPaso(3); }}
                      className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background hover:border-zinc-400 hover:bg-muted/20 active:scale-[0.98] transition-all text-left shadow-sm">
                      <div>
                        <p className="font-bold text-lg">{svc.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{svc.duration_minutes} {t("reserva.min")}</p>
                      </div>
                      <p className="font-extrabold text-xl">${svc.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{tieneEquipo ? "3." : "2."} {t("reserva.cuandoVienes")}</h2>
                  <button onClick={() => setPaso(tieneEquipo ? 2 : 1)} className="text-sm text-muted-foreground hover:text-foreground font-medium">{t("reserva.volver")}</button>
                </div>
                <div className="bg-muted/20 px-4 py-2 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                  <span><strong>{servicioElegido?.name}</strong> — {servicioElegido?.duration_minutes} {t("reserva.min")}</span>
                </div>
                {barberoElegido && tieneEquipo && (
                  <div className="bg-muted/20 px-4 py-2 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: barberoElegido.color || "#18181b" }} />
                    <span>{t("reserva.barbero")}: <strong className="text-foreground">{barberoElegido.name}</strong></span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-base">{t("reserva.seleccionaDia")}</Label>
                  <DatePickerIOS value={fechaElegida} minDate={getHoyStr()} onChange={(fecha) => setFechaElegida(fecha)} />
                </div>
                <div className="space-y-3 pt-2">
                  <Label className="text-base">{t("reserva.horariosDisponibles")}</Label>
                  {cargandoHoras ? (
                    <p className="text-sm text-muted-foreground text-center py-6 animate-pulse">{t("reserva.buscandoHorarios")}</p>
                  ) : horasLibres.length === 0 ? (
                    <p className="text-sm text-destructive font-medium p-4 bg-destructive/10 rounded-lg text-center border border-destructive/20">
                      {t("reserva.agendaLlena")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {horasLibres.map((hora) => (
                        <button key={hora} onClick={() => setHoraElegida(hora)}
                          className={`p-3 rounded-lg border text-center font-bold transition-all text-sm active:scale-95 ${
                            horaElegida === hora ? "bg-zinc-950 text-white border-zinc-950 shadow-md scale-[1.02]" : "bg-background hover:border-zinc-400 hover:bg-muted/20"
                          }`}>
                          {hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button className="w-full h-14 text-lg font-bold mt-4 bg-zinc-950 hover:bg-zinc-800" disabled={!horaElegida} onClick={() => setPaso(4)}>
                  {t("reserva.continuar")}
                </Button>
              </div>
            )}

            {paso === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{tieneEquipo ? "4." : "3."} {t("reserva.tusDatos")}</h2>
                  <button onClick={() => setPaso(3)} className="text-sm text-muted-foreground hover:text-foreground font-medium">{t("reserva.volver")}</button>
                </div>
                <div className="bg-muted/20 p-5 rounded-xl border border-border/50 text-sm space-y-2">
                  {barberoElegido && tieneEquipo && (
                    <p className="flex justify-between"><span className="text-muted-foreground">{t("reserva.barbero")}:</span><span className="font-bold">{barberoElegido.name}</span></p>
                  )}
                  <p className="flex justify-between"><span className="text-muted-foreground">{t("reserva.servicio")}:</span><span className="font-bold">{servicioElegido?.name}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">{t("reserva.total")}:</span><span className="font-black text-lg">${servicioElegido?.price}</span></p>
                  {requiereSena && (
                    <p className="flex justify-between text-amber-700 font-bold border-t border-border/50 pt-2 mt-2">
                      <span>{t("reserva.senaAPagar")} ({porcentajeSena}%):</span>
                      <span>${montoSena}</span>
                    </p>
                  )}
                  <div className="border-t border-border/50 pt-2 mt-2" />
                  <p className="flex justify-between"><span className="text-muted-foreground">{t("reserva.dia")}:</span><span className="font-bold">{fechaElegida}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">{t("reserva.hora")}:</span><span className="font-bold">{horaElegida}</span></p>
                </div>
                <form onSubmit={confirmarReserva} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-base">{t("reserva.tuNombre")}</Label>
                    <Input required placeholder={t("reserva.placeholderNombre")} className="h-14 text-lg" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">{t("reserva.telefono")}</Label>
                    <Input required type="tel" placeholder={t("reserva.placeholderTelefono")} className="h-14 text-lg" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">
                      {t("reserva.email")}{" "}
                      {requiereSena
                        ? <span className="text-amber-600 text-sm font-bold">{t("reserva.emailRequerido")}</span>
                        : <span className="text-muted-foreground text-sm font-normal">{t("reserva.emailOpcional")}</span>
                      }
                    </Label>
                    <Input
                      type="email"
                      required={requiereSena}
                      placeholder={t("reserva.placeholderEmail")}
                      className="h-14 text-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold mt-4 bg-zinc-950 hover:bg-zinc-800" disabled={loading || pagandoSena}>
                    {pagandoSena ? t("reserva.redirigiendoPago") : loading ? t("reserva.confirmando") : requiereSena ? `${t("reserva.pagarSenaY")} $${montoSena} ${t("reserva.yConfirmar")}` : t("reserva.confirmarTurno")}
                  </Button>
                  {requiereSena && (
                    <p className="text-xs text-center text-muted-foreground">{t("reserva.senaDescuenta")} ${montoSena} {t("reserva.seDescuentaDelTotal")}</p>
                  )}
                </form>
              </div>
            )}

            {paso === 5 && (
              <div className="text-center space-y-6 py-8 animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">{t("reserva.pagoPendiente")}</h2>
                  <p className="text-muted-foreground mt-2 text-sm">{t("reserva.pagoPendienteDesc")}</p>
                </div>
                <Button className="w-full h-12 font-bold bg-zinc-950 hover:bg-zinc-800" onClick={() => setPaso(4)}>{t("reserva.reintentarPago")}</Button>
              </div>
            )}

            {paso === 6 && (
              <div className="text-center space-y-6 py-8 animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">{t("reserva.turnoConfirmado")}</h2>
                  <p className="text-muted-foreground mt-2">{t("reserva.teEsperamos")} <strong>{fechaElegida}</strong> {t("reserva.alasHoras")} <strong>{horaElegida}</strong>.</p>
                  {barberoElegido && tieneEquipo && <p className="text-sm text-muted-foreground mt-1">{t("reserva.barbero")}: <strong>{barberoElegido.name}</strong></p>}
                  {email && <p className="text-sm text-muted-foreground mt-2">{t("reserva.confirmacionEnviada")} <strong>{email}</strong></p>}
                </div>
                <div className="flex flex-col gap-3 pt-4 max-w-xs mx-auto">
                  <a
                    href={`https://wa.me/${config.whatsapp_number}?text=¡Hola! Acabo de agendar un turno.%0A%0A📋 *Servicio:* ${servicioElegido?.name}%0A📅 *Día:* ${fechaElegida}%0A⏰ *Hora:* ${horaElegida}%0A👤 *Nombre:* ${nombre}${barberoElegido && tieneEquipo ? `%0A👤 *Profesional:* ${barberoElegido.name}` : ""}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-14 rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t("reserva.avisarWhatsapp")}
                  </a>
                  {(config.plan === 'PRO' || config.plan === 'BOSS') && config.instagram && (
                    <a href={`https://instagram.com/${config.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold h-14 rounded-xl shadow-md transition-all active:scale-[0.98]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      {t("reserva.verInstagram")}
                    </a>
                  )}
                  <Button onClick={() => window.location.reload()} variant="ghost" className="w-full h-12 text-muted-foreground">
                    {t("reserva.hacerOtraReserva")}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>

          <div className="bg-muted/30 py-4 text-center border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {t("reserva.poweredBy")} <span className="font-black text-primary">GB PRO</span>
            </p>
          </div>
        </Card>
      </div>
      <div className="py-8"></div>
    </div>
  );
}