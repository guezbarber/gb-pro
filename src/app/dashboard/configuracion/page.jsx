"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Calendar, Link2, Bell, Mail, Smartphone } from "lucide-react";

export default function ConfiguracionPage() {
  const [barberName, setBarberName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [instagram, setInstagram] = useState("");
  const [porcentajeSena, setPorcentajeSena] = useState(0);
  const [recordatorioCierre, setRecordatorioCierre] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [userId, setUserId] = useState(null);
  const [plan, setPlan] = useState("basico");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [calendarConectado, setCalendarConectado] = useState(false);
  const [conectandoCalendar, setConectandoCalendar] = useState(false);

  useEffect(() => { cargarConfiguracion(); }, []);

  const cargarConfiguracion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

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
    }

    try {
      const res = await fetch(`/api/calendar?barber_id=${user.id}`);
      const calData = await res.json();
      setCalendarConectado(calData.conectado);
    } catch { setCalendarConectado(false); }

    setLoading(false);
  };

  const guardarConfiguracion = async (e) => {
    e.preventDefault();
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
    if (!window.confirm("¿Desconectar Google Calendar?")) return;
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
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );

  const senasActivas = plan === "PRO" || plan === "BOSS";

  const Toggle = ({ value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${value ? "bg-zinc-950" : "bg-muted"}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? "left-7" : "left-1"}`} />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Ajustes de tu local y sistema de reservas.</p>
      </div>

      {/* Enlace de reservas */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Link2 size={15} strokeWidth={1.8} /> Tu enlace de reservas
          </CardTitle>
          <CardDescription>Compártelo en Instagram o WhatsApp para que tus clientes agenden solos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-sm font-mono text-muted-foreground truncate flex-1">
              https://gbpro.app/reserva/{userId}
            </p>
            <Button variant="outline" size="sm" className="font-bold shrink-0" onClick={copiarEnlace}>
              {copiado ? "Copiado" : "Copiar"}
            </Button>
          </div>
          {plan === "basico" && (
            <div className="flex items-center justify-between p-4 bg-zinc-950 text-white rounded-xl">
              <div>
                <p className="font-bold text-sm">En el plan básico tu enlace muestra "GB PRO"</p>
                <p className="text-xs text-zinc-400 mt-0.5">Actualiza a PRO para mostrar el nombre de tu barbería.</p>
              </div>
              <a href="/dashboard/suscripcion">
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold shrink-0 ml-4">Ver planes</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar size={15} strokeWidth={1.8} /> Google Calendar
          </CardTitle>
          <CardDescription>Sincroniza tus turnos automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          {calendarConectado ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Check size={16} className="text-green-600" />
                <div>
                  <p className="font-bold text-sm text-green-800">Google Calendar conectado</p>
                  <p className="text-xs text-green-600 mt-0.5">Los turnos se sincronizan automáticamente.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="font-bold text-red-500 border-red-200 hover:bg-red-50" onClick={desconectarCalendar}>
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
              <div>
                <p className="font-bold text-sm">Conecta tu Google Calendar</p>
                <p className="text-xs text-muted-foreground mt-0.5">Cada turno aparecerá automáticamente en tu calendario.</p>
              </div>
              <Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 shrink-0 ml-4 flex items-center gap-2" onClick={conectarGoogleCalendar} disabled={conectandoCalendar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {conectandoCalendar ? "Conectando..." : "Conectar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell size={15} strokeWidth={1.8} /> Notificaciones
          </CardTitle>
          <CardDescription>Elige cómo quieres que te avisemos cuando llega una reserva.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <Smartphone size={16} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
              <div>
                <p className="font-bold text-sm">Notificaciones push</p>
                <p className="text-xs text-muted-foreground mt-0.5">Aviso instantáneo en tu celular aunque la app esté cerrada.</p>
              </div>
            </div>
            <Toggle value={notifPush} onChange={setNotifPush} />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <Mail size={16} strokeWidth={1.8} className="text-muted-foreground shrink-0" />
              <div>
                <p className="font-bold text-sm">Notificaciones por email</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recibe un email cada vez que alguien reserve o cancele.</p>
              </div>
            </div>
            <Toggle value={notifEmail} onChange={setNotifEmail} />
          </div>
        </CardContent>
      </Card>

      {/* Formulario principal */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Perfil del local</CardTitle>
          <CardDescription>Información que ven tus clientes al reservar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardarConfiguracion} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label>Nombre de la barbería</Label>
                <Input required placeholder="Ej: Guez Barber" className="h-11 text-base" value={barberName} onChange={(e) => setBarberName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Número de WhatsApp</Label>
                <Input required type="tel" placeholder="Ej: 099123456" className="h-11 text-base" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            </div>

            {/* Instagram */}
            <div className="border-t border-border/50 pt-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-sm">Instagram</h3>
                {!senasActivas && <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
              </div>
              {senasActivas ? (
                <div className="space-y-1.5">
                  <Label>Usuario de Instagram</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-bold">@</span>
                    <Input placeholder="tuusuario" className="h-11 text-base" value={instagram.replace("@", "")} onChange={(e) => setInstagram(e.target.value.replace("@", ""))} />
                  </div>
                  <p className="text-xs text-muted-foreground">Aparece en tu página de reservas.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground">Disponible en el plan PRO.</p>
                  <a href="/dashboard/suscripcion">
                    <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">Ver planes</Button>
                  </a>
                </div>
              )}
            </div>

            {/* Horarios */}
            <div className="border-t border-border/50 pt-5">
              <h3 className="font-bold text-sm mb-3">Horarios de atención</h3>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="space-y-1.5">
                  <Label>Apertura</Label>
                  <Input type="time" required className="h-11 text-base" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cierre</Label>
                  <Input type="time" required className="h-11 text-base" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Recordatorio de cierre */}
            <div className="border-t border-border/50 pt-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={14} strokeWidth={1.8} />
                <h3 className="font-bold text-sm">Recordatorio de cierre</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Te enviamos un email al cerrar con el resumen del día para que no te olvides de anotar nada.</p>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                <div>
                  <p className="font-bold text-sm">
                    {recordatorioCierre
                      ? closeTime ? `Te llegará a las ${closeTime}` : "Activo — configura tu hora de cierre"
                      : "Desactivado"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {recordatorioCierre
                      ? "Resumen del día con turnos, ingresos y recordatorio de anotar lo que faltó."
                      : "Actívalo para recibir el resumen al cerrar tu jornada."}
                  </p>
                </div>
                <Toggle value={recordatorioCierre} onChange={setRecordatorioCierre} />
              </div>
            </div>

            {/* Señas */}
            <div className="border-t border-border/50 pt-5 max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-sm">Señas (cobro anticipado)</h3>
                {!senasActivas && <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-3">El cliente paga un % al reservar online. Reduce los no-shows.</p>
              {senasActivas ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                    <div>
                      <p className="font-bold text-sm">Señas activas</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {porcentajeSena === 0 ? "Desactivadas — los clientes reservan sin pagar" : `El cliente paga el ${porcentajeSena}% al reservar`}
                      </p>
                    </div>
                    <Toggle value={porcentajeSena > 0} onChange={(v) => setPorcentajeSena(v ? 50 : 0)} />
                  </div>
                  {porcentajeSena > 0 && (
                    <div className="space-y-2">
                      <Label>Porcentaje de la seña</Label>
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
                        Ejemplo: servicio de $600 → el cliente paga <strong>${Math.round(600 * porcentajeSena / 100)}</strong> al reservar.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                  <p className="text-sm text-muted-foreground">Disponible en el plan PRO.</p>
                  <a href="/dashboard/suscripcion">
                    <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">Ver planes</Button>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button type="submit" className={`h-12 px-10 font-bold text-base transition-all ${guardado ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} disabled={saving}>
                {saving ? "Guardando..." : guardado ? "Guardado" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}