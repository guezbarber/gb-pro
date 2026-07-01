"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, Link2, Bell, Mail, Smartphone, Info, Clock3, MessageSquarePlus, AlertCircle, Lightbulb, Settings2, CalendarClock, Megaphone, Star, Globe, Sun } from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";

export default function ConfiguracionPage() {
  const searchParams = useSearchParams();
  const [tabActiva, setTabActiva] = useState("general");

  const [barberName, setBarberName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [instagram, setInstagram] = useState("");
  const [porcentajeSena, setPorcentajeSena] = useState(0);
  const [recordatorioCierre, setRecordatorioCierre] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [antelacionMinutos, setAntelacionMinutos] = useState(30);
  const [fidelidadActiva, setFidelidadActiva] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("basico");
  const [tooltipPush, setTooltipPush] = useState(false);
  const [tooltipEmail, setTooltipEmail] = useState(false);
  const [tema, setTema] = useState("auto");

  const { idioma, t, cambiarIdioma } = useIdioma();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [calendarConectado, setCalendarConectado] = useState(false);
  const [conectandoCalendar, setConectandoCalendar] = useState(false);

  const [tipoFeedback, setTipoFeedback] = useState("sugerencia");
  const [mensajeFeedback, setMensajeFeedback] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);
  const [misFeedbacks, setMisFeedbacks] = useState([]);
  const [cargandoFeedbacks, setCargandoFeedbacks] = useState(true);

  const TABS = [
    { id: "general", label: t("config.tabGeneral"), icon: Settings2 },
    { id: "reservas", label: t("config.tabReservas"), icon: CalendarClock },
    { id: "notificaciones", label: t("config.tabNotificaciones"), icon: Bell },
    { id: "feedback", label: t("config.tabSugerencias"), icon: MessageSquarePlus },
  ];

  const OPCIONES_ANTELACION = [
    { valor: 0, label: t("config.antelacion0") },
    { valor: 30, label: t("config.antelacion30") },
    { valor: 60, label: t("config.antelacion60") },
    { valor: 120, label: t("config.antelacion120") },
    { valor: 180, label: t("config.antelacion180") },
    { valor: 1440, label: t("config.antelacion1440") },
  ];

  const ESTADOS_FEEDBACK = {
    recibido: { label: t("config.estadoRecibido"), color: "bg-zinc-100 text-zinc-700" },
    en_revision: { label: t("config.estadoEnRevision"), color: "bg-amber-100 text-amber-700" },
    solucionado: { label: t("config.estadoSolucionado"), color: "bg-green-100 text-green-700" },
    no_aplica: { label: t("config.estadoNoAplica"), color: "bg-muted text-muted-foreground" },
  };

  useEffect(() => {
    const tabUrl = searchParams.get("tab");
    if (tabUrl && TABS.some(tab => tab.id === tabUrl)) {
      setTabActiva(tabUrl);
    }
  }, [searchParams]);

  useEffect(() => { cargarConfiguracion(); }, []);

  useEffect(() => {
    const temaGuardado = localStorage.getItem("gbpro_tema");
    if (temaGuardado) { setTema(temaGuardado); aplicarClaseTema(temaGuardado); }
  }, []);

  const aplicarClaseTema = (valor) => {
    const html = document.documentElement;
    if (valor === "claro") { html.classList.remove("dark"); html.classList.add("light"); }
    else if (valor === "oscuro") { html.classList.remove("light"); html.classList.add("dark"); }
    else { html.classList.remove("light", "dark"); }
  };

  const cambiarTema = (valor) => {
    setTema(valor);
    localStorage.setItem("gbpro_tema", valor);
    aplicarClaseTema(valor);
  };

  const cargarConfiguracion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email || "");

    const { data } = await supabase.from('barber_settings').select('*').eq('barber_id', user.id).single();
    if (data) {
      setBarberName(data.barber_name || "");
      setWhatsapp(data.whatsapp_number || "");
      setOpenTime(data.open_time || "");
      setCloseTime(data.close_time || "");
      setInstagram(data.instagram || "");
      setPlan(data.plan || "basico");
      setPorcentajeSena(data.porcentaje_sena || 0);
      setRecordatorioCierre(data.recordatorio_cierre || false);
      setNotifPush(data.notif_push !== false);
      setNotifEmail(data.notif_email !== false);
      setAntelacionMinutos(data.antelacion_minutos ?? 30);
      setFidelidadActiva(data.fidelidad_activa || false);
    }

    try {
      const res = await fetch(`/api/calendar?barber_id=${user.id}`);
      const calData = await res.json();
      setCalendarConectado(calData.conectado);
    } catch { setCalendarConectado(false); }

    cargarFeedbacks(user.id);
    setLoading(false);
  };

  const cargarFeedbacks = async (uid) => {
    setCargandoFeedbacks(true);
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("barber_id", uid)
      .order("created_at", { ascending: false });
    if (data) setMisFeedbacks(data);
    setCargandoFeedbacks(false);
  };

  const enviarFeedback = async (e) => {
    e.preventDefault();
    if (!mensajeFeedback.trim()) return;
    setEnviandoFeedback(true);

    const { error } = await supabase.from("feedback").insert([{
      barber_id: userId,
      barber_name: barberName || null,
      barber_email: userEmail,
      tipo: tipoFeedback,
      mensaje: mensajeFeedback.trim(),
      estado: "recibido",
    }]);

    if (!error) {
      setMensajeFeedback("");
      setFeedbackEnviado(true);
      setTimeout(() => setFeedbackEnviado(false), 3000);
      cargarFeedbacks(userId);
    } else {
      alert("Error al enviar: " + error.message);
    }
    setEnviandoFeedback(false);
  };

  const guardarConfiguracion = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: existe } = await supabase.from('barber_settings').select('id').eq('barber_id', user.id).single();

    const payload = {
      barber_name: barberName,
      whatsapp_number: whatsapp,
      open_time: openTime,
      close_time: closeTime,
      instagram: plan === "PRO" || plan === "BOSS" ? instagram : null,
      porcentaje_sena: porcentajeSena,
      recordatorio_cierre: recordatorioCierre,
      notif_push: notifPush,
      notif_email: notifEmail,
      antelacion_minutos: antelacionMinutos,
      fidelidad_activa: fidelidadActiva,
    };

    let errorGuardado;
    if (existe) {
      const { error } = await supabase.from('barber_settings').update(payload).eq('barber_id', user.id);
      errorGuardado = error;
    } else {
      const { error } = await supabase.from('barber_settings').insert([{ barber_id: user.id, ...payload }]);
      errorGuardado = error;
    }

    await supabase.from('barbershops').update({ porcentaje_sena: porcentajeSena }).eq('owner_id', user.id);

    if (errorGuardado) {
      alert("Error al guardar: " + errorGuardado.message);
    } else {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    }
    setSaving(false);
  };

  const conectarGoogleCalendar = async () => {
    setConectandoCalendar(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar",
        redirectTo: `${window.location.origin}/dashboard/configuracion/calendar-callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { alert("Error: " + error.message); setConectandoCalendar(false); }
  };

  const desconectarCalendar = async () => {
    if (!window.confirm(t("config.calendarDesconectarConfirm"))) return;
    await supabase.from("google_calendar_tokens").delete().eq("barber_id", userId);
    setCalendarConectado(false);
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(`https://gbpro.app/reserva/${userId}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground animate-pulse">{t("config.cargando")}</p>
    </div>
  );

  const senasActivas = plan === "PRO" || plan === "BOSS";
  const fidelidadDisponible = plan === "PRO" || plan === "BOSS";
  const pendientesFeedback = misFeedbacks.filter(f => f.estado === "recibido" || f.estado === "en_revision").length;

  const Toggle = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${value ? "bg-zinc-950" : "bg-muted"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-7" : "left-1"}`} />
    </button>
  );

  const SaveButton = () => (
    <Button onClick={guardarConfiguracion} className={`h-11 px-8 font-bold transition-all ${guardado ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} disabled={saving}>
      {saving ? t("config.guardando") : guardado ? t("config.guardado") : t("config.guardarCambios")}
    </Button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("config.titulo")}</h1>
        <p className="text-muted-foreground mt-1">{t("config.subtitulo")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const activa = tabActiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 relative ${
                activa ? "bg-zinc-950 text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {tab.label}
              {tab.id === "feedback" && pendientesFeedback > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center absolute -top-1 -right-1">
                  {pendientesFeedback}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB: GENERAL ── */}
      {tabActiva === "general" && (
        <div className="space-y-6 animate-in fade-in">

          {/* Enlace de reservas */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Link2 size={15} strokeWidth={1.8} /> {t("config.enlaceTitulo")}
              </CardTitle>
              <CardDescription>{t("config.enlaceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm font-mono text-muted-foreground truncate flex-1">
                  https://gbpro.app/reserva/{userId}
                </p>
                <Button variant="outline" size="sm" className="font-bold shrink-0" onClick={copiarEnlace}>
                  {copiado ? t("config.copiado") : t("config.copiar")}
                </Button>
              </div>
              {plan === "basico" && (
                <div className="flex items-center justify-between p-4 bg-zinc-950 text-white rounded-xl">
                  <div>
                    <p className="font-bold text-sm">{t("config.enlaceBasicoAviso")}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{t("config.enlaceBasicoDesc")}</p>
                  </div>
                  <a href="/dashboard/suscripcion">
                    <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold shrink-0 ml-4">{t("config.verPlanes")}</Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Idioma */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe size={15} strokeWidth={1.8} /> {t("config.idiomaTitulo")}
              </CardTitle>
              <CardDescription>{t("config.idiomaDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[{ valor: "es", label: "Español" }, { valor: "en", label: "English" }, { valor: "pt", label: "Português" }].map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => cambiarIdioma(op.valor)}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                      idioma === op.valor ? "bg-zinc-950 text-white border-zinc-950" : "bg-transparent border-border/50 hover:bg-muted/40"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sun size={15} strokeWidth={1.8} /> {t("config.aparienciaTitulo")}
              </CardTitle>
              <CardDescription>{t("config.aparienciaDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[
                  { valor: "claro", label: t("config.temaClaro") },
                  { valor: "oscuro", label: t("config.temaOscuro") },
                  { valor: "auto", label: t("config.temaAuto") },
                ].map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => cambiarTema(op.valor)}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                      tema === op.valor ? "bg-zinc-950 text-white border-zinc-950" : "bg-transparent border-border/50 hover:bg-muted/40"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calendar size={15} strokeWidth={1.8} /> Google Calendar
              </CardTitle>
              <CardDescription>{t("config.calendarDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {calendarConectado ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Check size={16} className="text-green-600" />
                    <div>
                      <p className="font-bold text-sm text-green-800">{t("config.calendarConectadoLabel")}</p>
                      <p className="text-xs text-green-600 mt-0.5">{t("config.calendarSincroniza")}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="font-bold text-red-500 border-red-200 hover:bg-red-50" onClick={desconectarCalendar}>
                    {t("config.calendarDesconectar")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm">{t("config.calendarConectarTitulo")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("config.calendarConectarDesc")}</p>
                  </div>
                  <Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 shrink-0 ml-4 flex items-center gap-2" onClick={conectarGoogleCalendar} disabled={conectandoCalendar}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {conectandoCalendar ? t("config.calendarConectando") : t("config.calendarConectarBtn")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Perfil del local */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{t("config.perfilTitulo")}</CardTitle>
              <CardDescription>{t("config.perfilDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={guardarConfiguracion} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("config.nombreNegocio")}</Label>
                    <Input required placeholder={t("config.nombreNegocio")} className="h-11 text-base" value={barberName} onChange={(e) => setBarberName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("config.whatsapp")}</Label>
                    <Input required type="tel" placeholder="WhatsApp" className="h-11 text-base" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-sm">Instagram</h3>
                    {!senasActivas && <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
                  </div>
                  {senasActivas ? (
                    <div className="space-y-1.5">
                      <Label>{t("config.instagramLabel")}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-bold">@</span>
                        <Input placeholder="tuusuario" className="h-11 text-base" value={instagram.replace("@", "")} onChange={(e) => setInstagram(e.target.value.replace("@", ""))} />
                      </div>
                      <p className="text-xs text-muted-foreground">{t("config.instagramDesc")}</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                      <p className="text-sm text-muted-foreground">{t("config.soloProDesc")}</p>
                      <a href="/dashboard/suscripcion">
                        <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">{t("config.verPlanes")}</Button>
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/50 pt-5">
                  <h3 className="font-bold text-sm mb-3">{t("config.horariosTitulo")}</h3>
                  <div className="space-y-4 max-w-xs">
                    <div className="space-y-1.5">
                      <Label>{t("config.apertura")}</Label>
                      <Input type="time" required className="h-11 text-base w-full" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("config.cierre")}</Label>
                      <Input type="time" required className="h-11 text-base w-full" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button type="submit" className={`h-12 px-10 font-bold text-base transition-all ${guardado ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} disabled={saving}>
                    {saving ? t("config.guardando") : guardado ? t("config.guardado") : t("config.guardarCambios")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: RESERVAS ── */}
      {tabActiva === "reservas" && (
        <div className="space-y-6 animate-in fade-in">

          {/* Sistema de puntos */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Star size={15} strokeWidth={1.8} /> {t("config.puntosTitulo")}
                {!fidelidadDisponible && <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
              </CardTitle>
              <CardDescription>{t("config.puntosDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {fidelidadDisponible ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                    <div>
                      <p className="font-bold text-sm">
                        {fidelidadActiva ? t("config.puntosActivo") : t("config.puntosDesactivado")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fidelidadActiva ? t("config.puntosActivoDesc") : t("config.puntosDesactivadoDesc")}
                      </p>
                    </div>
                    <Toggle value={fidelidadActiva} onChange={setFidelidadActiva} />
                  </div>
                  {fidelidadActiva && (
                    <div className="p-4 bg-zinc-950 text-white rounded-xl text-sm space-y-2">
                      <p className="font-bold">{t("config.puntosPasos")}</p>
                      <p className="text-zinc-300 text-xs">{t("config.puntosPaso1")}</p>
                      <p className="text-zinc-300 text-xs">{t("config.puntosPaso2")}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-border/50">
                    <SaveButton />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground">{t("config.soloProDesc")}</p>
                  <a href="/dashboard/suscripcion">
                    <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">{t("config.verPlanes")}</Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Antelación de reserva */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock3 size={15} strokeWidth={1.8} /> {t("config.antelacionTitulo")}
              </CardTitle>
              <CardDescription>{t("config.antelacionDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {OPCIONES_ANTELACION.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setAntelacionMinutos(op.valor)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all text-left ${
                      antelacionMinutos === op.valor
                        ? "bg-zinc-950 text-white border-zinc-950"
                        : "bg-muted/20 border-border/50 hover:bg-muted/40"
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {antelacionMinutos === 0
                  ? t("config.antelacionTexto0")
                  : antelacionMinutos === 1440
                    ? t("config.antelacionTexto1440")
                    : `${t("config.antelacionTextoPre")} ${antelacionMinutos} ${t("config.antelacionTextoPost")}`}
              </p>
              <div className="pt-4 mt-4 border-t border-border/50">
                <SaveButton />
              </div>
            </CardContent>
          </Card>

          {/* Recordatorio de cierre */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell size={15} strokeWidth={1.8} /> {t("config.recordatorioTitulo")}
              </CardTitle>
              <CardDescription>{t("config.recordatorioDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <p className="font-bold text-sm">
                    {recordatorioCierre
                      ? closeTime ? `${t("config.recordatorioHoraPre")} ${closeTime}` : t("config.recordatorioActivoSinHora")
                      : t("config.recordatorioDesactivado")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {recordatorioCierre ? t("config.recordatorioActivoDesc") : t("config.recordatorioDesactivadoDesc")}
                  </p>
                </div>
                <Toggle value={recordatorioCierre} onChange={(v) => { setRecordatorioCierre(v); }} />
              </div>
              <div className="pt-4 mt-4 border-t border-border/50">
                <SaveButton />
              </div>
            </CardContent>
          </Card>

          {/* Señas */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {t("config.senaTitulo")}
                {!senasActivas && <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
              </CardTitle>
              <CardDescription>{t("config.senaDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {senasActivas ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                    <div>
                      <p className="font-bold text-sm">{t("config.senasActivas")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {porcentajeSena === 0
                          ? t("config.senaDesactivadaDesc")
                          : `${t("config.senaPorcentajeDescPre")} ${porcentajeSena}${t("config.senaPorcentajeDescPost")}`}
                      </p>
                    </div>
                    <Toggle value={porcentajeSena > 0} onChange={(v) => setPorcentajeSena(v ? 50 : 0)} />
                  </div>
                  {porcentajeSena > 0 && (
                    <div className="space-y-2">
                      <Label>{t("config.senaPorcentajeLabel")}</Label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={10} max={100} step={10} value={porcentajeSena} onChange={(e) => setPorcentajeSena(Number(e.target.value))} className="flex-1 h-2 accent-zinc-900" />
                        <span className="font-black text-xl w-16 text-right">{porcentajeSena}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                        {[10, 25, 50, 75, 100].map(v => (
                          <button key={v} type="button" onClick={() => setPorcentajeSena(v)} className={`px-2 py-1 rounded font-bold transition-all ${porcentajeSena === v ? "bg-zinc-900 text-white" : "hover:bg-muted"}`}>{v}%</button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">
                        {t("config.senaEjemploPre")} <strong>${Math.round(600 * porcentajeSena / 100)}</strong> {t("config.senaEjemploPost")}
                      </p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-border/50">
                    <SaveButton />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground">{t("config.soloProDesc")}</p>
                  <a href="/dashboard/suscripcion">
                    <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">{t("config.verPlanes")}</Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: NOTIFICACIONES ── */}
      {tabActiva === "notificaciones" && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bell size={15} strokeWidth={1.8} /> {t("config.notifTitulo")}
              </CardTitle>
              <CardDescription>{t("config.notifDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Smartphone size={16} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{t("config.notifPushTitulo")}</p>
                      <button type="button" onClick={() => { setTooltipPush(!tooltipPush); setTooltipEmail(false); }} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("config.notifPushDesc")}</p>
                    {tooltipPush && (
                      <div className="mt-2 p-3 bg-zinc-950 text-white rounded-xl text-xs space-y-1.5">
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifPush1")}</span></div>
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifPush2")}</span></div>
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifPush3")}</span></div>
                        <div className="flex items-start gap-2"><X size={14} className="text-red-400 shrink-0 mt-0.5" /><span>{t("config.notifPush4")}</span></div>
                        <p className="text-zinc-400 pt-1">{t("config.notifPushIphone")}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Toggle value={notifPush} onChange={setNotifPush} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Mail size={16} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm">{t("config.notifEmailTitulo")}</p>
                      <button type="button" onClick={() => { setTooltipEmail(!tooltipEmail); setTooltipPush(false); }} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("config.notifEmailDesc")}</p>
                    {tooltipEmail && (
                      <div className="mt-2 p-3 bg-zinc-950 text-white rounded-xl text-xs space-y-1.5">
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifEmail1")}</span></div>
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifEmail2")}</span></div>
                        <div className="flex items-start gap-2"><Check size={14} className="text-green-400 shrink-0 mt-0.5" /><span>{t("config.notifEmail3")}</span></div>
                        <p className="text-zinc-400 pt-1">{t("config.notifEmailDominio")}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Toggle value={notifEmail} onChange={setNotifEmail} />
              </div>

              <p className="text-xs text-muted-foreground px-1">{t("config.notifRecomendacion")}</p>

              <div className="pt-4 border-t border-border/50">
                <SaveButton />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB: SUGERENCIAS Y ERRORES ── */}
      {tabActiva === "feedback" && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquarePlus size={15} strokeWidth={1.8} /> {t("config.feedbackTitulo")}
              </CardTitle>
              <CardDescription>{t("config.feedbackDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={enviarFeedback} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setTipoFeedback("sugerencia")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                      tipoFeedback === "sugerencia" ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"
                    }`}
                  >
                    <Lightbulb size={14} /> {t("config.feedbackSugerencia")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFeedback("error")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                      tipoFeedback === "error" ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"
                    }`}
                  >
                    <AlertCircle size={14} /> {t("config.feedbackError")}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {tipoFeedback === "error" ? t("config.feedbackLabelError") : t("config.feedbackLabelSugerencia")}
                  </Label>
                  <textarea
                    required
                    value={mensajeFeedback}
                    onChange={(e) => setMensajeFeedback(e.target.value)}
                    placeholder={tipoFeedback === "error" ? t("config.feedbackPlaceholderError") : t("config.feedbackPlaceholderSugerencia")}
                    className="flex w-full min-h-[100px] rounded-md border border-input bg-muted/30 px-3 py-2 text-base resize-none"
                  />
                </div>
                <Button type="submit" className={`font-bold h-11 transition-all ${feedbackEnviado ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} disabled={enviandoFeedback || !mensajeFeedback.trim()}>
                  {enviandoFeedback ? t("config.feedbackEnviando") : feedbackEnviado ? t("config.feedbackEnviado") : t("config.feedbackEnviar")}
                </Button>
              </form>

              {misFeedbacks.length > 0 && (
                <div className="border-t border-border/50 pt-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("config.feedbackEnviaste")}</p>
                  {cargandoFeedbacks ? (
                    <p className="text-sm text-muted-foreground animate-pulse">{t("config.cargando")}</p>
                  ) : (
                    misFeedbacks.map((f) => {
                      const estado = ESTADOS_FEEDBACK[f.estado] || ESTADOS_FEEDBACK.recibido;
                      return (
                        <div key={f.id} className="p-3 rounded-xl border border-border/50 bg-muted/10">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {f.tipo === "error" ? <AlertCircle size={13} className="text-red-500 shrink-0" /> : <Lightbulb size={13} className="text-amber-500 shrink-0" />}
                              <span className="text-xs font-bold text-muted-foreground">{f.tipo === "error" ? t("config.feedbackError") : t("config.feedbackSugerencia")}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${estado.color}`}>{estado.label}</span>
                          </div>
                          <p className="text-sm mt-2">{f.mensaje}</p>
                          {f.respuesta_admin && (
                            <div className="mt-2 p-2 bg-zinc-950 text-white rounded-lg text-xs">
                              <p className="font-bold mb-0.5">{t("config.feedbackRespuesta")}</p>
                              <p className="text-zinc-300">{f.respuesta_admin}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(f.created_at).toLocaleDateString(idioma, { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
