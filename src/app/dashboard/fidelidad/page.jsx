"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useIdioma } from "@/hooks/useIdioma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Mail, Gift, Trash2, Pencil, Check, AlertCircle } from "lucide-react";

export default function FidelidadPage() {
  const { idioma, t } = useIdioma();
  const [plan, setPlan] = useState("basico");
  const [fidelidadActiva, setFidelidadActiva] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [barberoNombre, setBarberoNombre] = useState("");

  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ajustando, setAjustando] = useState(null);
  const [puntosAjuste, setPuntosAjuste] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [recompensas, setRecompensas] = useState([]);
  const [nombreRecompensa, setNombreRecompensa] = useState("");
  const [costoRecompensa, setCostoRecompensa] = useState("");
  const [editandoRecompensa, setEditandoRecompensa] = useState(null);
  const [guardandoRecompensa, setGuardandoRecompensa] = useState(false);

  const [canjes, setCanjes] = useState([]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: settings } = await supabase.from("barber_settings").select("plan, barber_name, fidelidad_activa").eq("barber_id", user.id).single();
    if (settings) {
      setPlan(settings.plan || "basico");
      setBarberoNombre(settings.barber_name || "Tu negocio");
      setFidelidadActiva(settings.fidelidad_activa || false);
    }

    const { data: turnos } = await supabase.from("appointments").select("client_name, client_phone, client_email, start_time, services(price)").eq("barber_id", user.id).order("start_time", { ascending: false });
    const { data: puntosBD } = await supabase.from("client_points").select("*").eq("barber_id", user.id);

    const mapaPuntos = new Map();
    if (puntosBD) puntosBD.forEach(p => mapaPuntos.set(p.client_key, p.puntos));

    if (turnos) {
      const mapa = new Map();
      turnos.forEach(turno => {
        const key = turno.client_phone?.trim() || turno.client_name?.trim();
        if (!key) return;
        if (!mapa.has(key)) {
          mapa.set(key, { key, nombre: turno.client_name, telefono: turno.client_phone, email: turno.client_email || "", puntos: mapaPuntos.get(key) || 0 });
        } else {
          const c = mapa.get(key);
          if (!c.email && turno.client_email) c.email = turno.client_email;
        }
      });
      setClientes(Array.from(mapa.values()).sort((a, b) => b.puntos - a.puntos));
    }

    const { data: recompensasBD } = await supabase.from("recompensas").select("*").eq("barber_id", user.id).order("costo_puntos", { ascending: true });
    if (recompensasBD) setRecompensas(recompensasBD);

    const { data: canjesBD } = await supabase.from("canjes").select("*").eq("barber_id", user.id).order("created_at", { ascending: false }).limit(30);
    if (canjesBD) setCanjes(canjesBD);

    setLoading(false);
  };

  const enviarEmailPuntos = async (cliente, puntos) => {
    if (!cliente.email) return;
    try {
      await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "puntos_ganados", clienteEmail: cliente.email, clienteNombre: cliente.nombre, barberoNombre, puntos }) });
    } catch {}
  };

  const ajustarPuntos = async (cliente, operacion) => {
    const cantidad = parseInt(puntosAjuste);
    if (!cantidad || cantidad <= 0) { alert(t("fidelidad.errorCantidad")); return; }
    setGuardando(true);
    const nuevosPuntos = operacion === "sumar" ? cliente.puntos + cantidad : Math.max(0, cliente.puntos - cantidad);
    const { error } = await supabase.from("client_points").upsert({ barber_id: userId, client_key: cliente.key, client_name: cliente.nombre, puntos: nuevosPuntos }, { onConflict: "barber_id,client_key" });
    if (!error) {
      if (operacion === "sumar" && cliente.email) await enviarEmailPuntos(cliente, cantidad);
      setClientes(prev => prev.map(c => c.key === cliente.key ? { ...c, puntos: nuevosPuntos } : c).sort((a, b) => b.puntos - a.puntos));
      setAjustando(null); setPuntosAjuste("");
    } else alert("Error: " + error.message);
    setGuardando(false);
  };

  const guardarRecompensa = async (e) => {
    e.preventDefault();
    const costo = parseInt(costoRecompensa);
    if (!nombreRecompensa.trim() || !costo || costo <= 0) { alert(t("fidelidad.errorRecompensa")); return; }
    setGuardandoRecompensa(true);

    if (editandoRecompensa) {
      const { error } = await supabase.from("recompensas").update({ nombre: nombreRecompensa.trim(), costo_puntos: costo }).eq("id", editandoRecompensa);
      if (!error) {
        setRecompensas(prev => prev.map(r => r.id === editandoRecompensa ? { ...r, nombre: nombreRecompensa.trim(), costo_puntos: costo } : r).sort((a, b) => a.costo_puntos - b.costo_puntos));
        cancelarEdicionRecompensa();
      } else alert("Error: " + error.message);
    } else {
      const { data, error } = await supabase.from("recompensas").insert([{ barber_id: userId, nombre: nombreRecompensa.trim(), costo_puntos: costo, activa: true }]).select().single();
      if (!error && data) {
        setRecompensas(prev => [...prev, data].sort((a, b) => a.costo_puntos - b.costo_puntos));
        setNombreRecompensa(""); setCostoRecompensa("");
      } else alert("Error: " + error.message);
    }
    setGuardandoRecompensa(false);
  };

  const empezarEdicionRecompensa = (r) => {
    setEditandoRecompensa(r.id);
    setNombreRecompensa(r.nombre);
    setCostoRecompensa(String(r.costo_puntos));
  };

  const cancelarEdicionRecompensa = () => {
    setEditandoRecompensa(null); setNombreRecompensa(""); setCostoRecompensa("");
  };

  const borrarRecompensa = async (id) => {
    if (!window.confirm(t("fidelidad.confirmarBorrar"))) return;
    const { error } = await supabase.from("recompensas").delete().eq("id", id);
    if (!error) {
      setRecompensas(prev => prev.filter(r => r.id !== id));
      if (editandoRecompensa === id) cancelarEdicionRecompensa();
    } else alert("Error: " + error.message);
  };

  const marcarEntregado = async (canje) => {
    const { error } = await supabase.from("canjes").update({ entregado: true }).eq("id", canje.id);
    if (!error) {
      setCanjes(prev => prev.map(c => c.id === canje.id ? { ...c, entregado: true } : c));
    } else alert("Error: " + error.message);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || c.telefono?.includes(busqueda)
  );

  const canjesPendientes = canjes.filter(c => !c.entregado).length;

  const formatearFecha = (iso) => new Date(iso).toLocaleDateString(idioma, { day: "2-digit", month: "2-digit", year: "numeric" });

  if (plan !== "PRO" && plan !== "BOSS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("fidelidad.titulo")}</h1>
          <p className="text-muted-foreground mt-1">{t("fidelidad.subtituloPromo")}</p>
        </div>
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
              <Star size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">{t("fidelidad.promoTitulo")}</h2>
              <p className="text-zinc-400 mt-3 text-base max-w-md mx-auto">{t("fidelidad.promoDesc")}</p>
            </div>
            <a href="/dashboard/suscripcion">
              <Button className="bg-white text-black hover:bg-zinc-200 font-black text-base h-12 px-10 mt-4">{t("fidelidad.verPlanes")}</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("fidelidad.titulo")}</h1>
        <p className="text-muted-foreground mt-1">{t("fidelidad.subtitulo")}</p>
      </div>

      {!fidelidadActiva && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-amber-800">{t("fidelidad.avisoDesactivadoTitulo")}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t("fidelidad.avisoDesactivadoDesc")}</p>
            </div>
          </div>
          <a href="/dashboard/configuracion">
            <Button size="sm" className="font-bold shrink-0 ml-4 bg-zinc-950 text-white hover:bg-zinc-800">{t("fidelidad.activar")}</Button>
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("fidelidad.kpiConPuntos"), value: clientes.filter(c => c.puntos > 0).length },
          { label: t("fidelidad.kpiTotalPuntos"), value: clientes.reduce((s, c) => s + c.puntos, 0) },
          { label: t("fidelidad.kpiRecompensas"), value: recompensas.length },
          { label: t("fidelidad.kpiCanjesSinEntregar"), value: canjesPendientes },
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Gift size={15} strokeWidth={1.8} /> {t("fidelidad.recompensasTitulo")}
          </CardTitle>
          <CardDescription>{t("fidelidad.recompensasDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={guardarRecompensa} className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <Label>{t("fidelidad.nombreRecompensa")}</Label>
              <Input placeholder={t("fidelidad.nombreRecompensa")} className="h-11 text-base" value={nombreRecompensa} onChange={(e) => setNombreRecompensa(e.target.value)} />
            </div>
            <div className="space-y-1.5 w-full sm:w-32">
              <Label>{t("fidelidad.costoLabel")}</Label>
              <Input type="number" min="1" placeholder="100" className="h-11 text-base" value={costoRecompensa} onChange={(e) => setCostoRecompensa(e.target.value)} />
            </div>
            <Button type="submit" className="font-bold h-11 px-6 bg-zinc-950 text-white hover:bg-zinc-800 w-full sm:w-auto" disabled={guardandoRecompensa}>
              {guardandoRecompensa ? "..." : editandoRecompensa ? t("fidelidad.guardar") : t("fidelidad.crear")}
            </Button>
            {editandoRecompensa && (
              <Button type="button" variant="outline" className="font-bold h-11 px-4 w-full sm:w-auto" onClick={cancelarEdicionRecompensa}>
                {t("fidelidad.cancelar")}
              </Button>
            )}
          </form>

          {recompensas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
              {t("fidelidad.sinRecompensas")}
            </div>
          ) : (
            <div className="space-y-2">
              {recompensas.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Gift size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.nombre}</p>
                      <p className="text-xs text-muted-foreground">{r.costo_puntos} {t("fidelidad.puntos")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => empezarEdicionRecompensa(r)}>
                      <Pencil size={13} strokeWidth={2} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500" onClick={() => borrarRecompensa(r.id)}>
                      <Trash2 size={13} strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canjes.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{t("fidelidad.canjesTitulo")}</CardTitle>
            <CardDescription>{t("fidelidad.canjesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {canjes.map((c) => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border ${c.entregado ? "border-border/50 bg-muted/10" : "border-amber-200 bg-amber-50/40"}`}>
                  <div>
                    <p className="font-bold text-sm">{c.client_name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{c.recompensa_nombre} — {c.costo_puntos} {t("fidelidad.pts")} · {formatearFecha(c.created_at)}</p>
                  </div>
                  {c.entregado ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 shrink-0">
                      <Check size={13} strokeWidth={2.5} /> {t("fidelidad.entregado")}
                    </span>
                  ) : (
                    <Button size="sm" className="font-bold h-9 bg-zinc-950 text-white hover:bg-zinc-800 shrink-0" onClick={() => marcarEntregado(c)}>
                      {t("fidelidad.marcarEntregado")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col gap-3 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">{t("fidelidad.puntosClientesTitulo")}</CardTitle>
              <CardDescription className="text-xs mt-1">{t("fidelidad.puntosClientesDesc")}</CardDescription>
            </div>
            <Input placeholder={t("fidelidad.buscar")} className="w-full sm:max-w-xs h-11 text-base" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">{t("fidelidad.cargando")}</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">{t("fidelidad.sinClientes")}</div>
          ) : (
            <div className="space-y-2">
              {clientesFiltrados.map((cliente, idx) => {
                const estaAjustando = ajustando === cliente.key;
                return (
                  <div key={cliente.key} className="border border-border/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => { setAjustando(estaAjustando ? null : cliente.key); setPuntosAjuste(""); }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-muted-foreground w-6">#{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{cliente.nombre}</p>
                            {cliente.email && <Mail size={11} className="text-muted-foreground" />}
                          </div>
                          {cliente.telefono && <p className="text-xs text-muted-foreground">{cliente.telefono}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl">{cliente.puntos}</p>
                        <p className="text-xs text-muted-foreground">{t("fidelidad.puntosLabel")}</p>
                      </div>
                    </div>
                    {estaAjustando && (
                      <div className="border-t border-border/50 p-4 bg-muted/10 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground">{t("fidelidad.ajustarTitulo")} {cliente.nombre}</p>
                        <div className="flex gap-2">
                          <Input type="number" min="1" placeholder={t("fidelidad.cantidadPlaceholder")} className="h-11 text-base flex-1" value={puntosAjuste} onChange={(e) => setPuntosAjuste(e.target.value)} />
                          <Button size="sm" className="h-11 px-4 font-bold bg-zinc-950 text-white shrink-0" onClick={() => ajustarPuntos(cliente, "sumar")} disabled={guardando}>
                            {guardando ? "..." : t("fidelidad.sumar")}
                          </Button>
                          <Button size="sm" variant="outline" className="h-11 px-4 font-bold shrink-0" onClick={() => ajustarPuntos(cliente, "restar")} disabled={guardando}>
                            {t("fidelidad.restar")}
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
