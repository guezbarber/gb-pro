"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { AlertCircle, Lightbulb, MessageSquarePlus, Mail, Send } from "lucide-react";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const ESTADOS_FEEDBACK = [
  { valor: "recibido", label: "Recibido", color: "bg-zinc-100 text-zinc-700" },
  { valor: "en_revision", label: "En revisión", color: "bg-amber-100 text-amber-700" },
  { valor: "solucionado", label: "Solucionado", color: "bg-green-100 text-green-700" },
  { valor: "no_aplica", label: "No aplica", color: "bg-muted text-muted-foreground" },
];

export default function AdminSecretoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberShops, setBarberShops] = useState([]);
  const [dataCrecimiento, setDataCrecimiento] = useState([]);
  const [dataTurnos, setDataTurnos] = useState([]);

  const [feedbacks, setFeedbacks] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [respuestas, setRespuestas] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);

  // -- Email masivo --
  const [adminEmail, setAdminEmail] = useState("");
  const [tituloEmail, setTituloEmail] = useState("");
  const [mensajeEmail, setMensajeEmail] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "guezbarber@gmail.com") {
      router.push("/dashboard");
      return;
    }
    setAdminEmail(user.email);

    const { data } = await supabase
      .from("barber_settings")
      .select("barber_name, whatsapp_number, plan, recordatorio_cierre, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      setBarberShops(data);
      calcularCrecimiento(data);
    }

    const hace6 = new Date();
    hace6.setMonth(hace6.getMonth() - 5);
    hace6.setDate(1);
    hace6.setHours(0, 0, 0, 0);

    const { data: turnos } = await supabase
      .from("appointments")
      .select("start_time")
      .gte("start_time", hace6.toISOString());

    if (turnos) calcularTurnos(turnos);

    await cargarFeedbacks();

    setLoading(false);
  };

  const cargarFeedbacks = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setFeedbacks(data);
  };

  const actualizarFeedback = async (id, cambios) => {
    setGuardandoId(id);
    const { error } = await supabase
      .from("feedback")
      .update({ ...cambios, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...cambios } : f));
    } else {
      alert("Error: " + error.message);
    }
    setGuardandoId(null);
  };

  const guardarRespuesta = async (id) => {
    const texto = respuestas[id];
    if (texto === undefined) return;
    await actualizarFeedback(id, { respuesta_admin: texto });
  };

  const enviarEmailMasivo = async () => {
    if (!tituloEmail.trim() || !mensajeEmail.trim()) {
      alert("Escribe un título y un mensaje.");
      return;
    }
    const confirmar = window.confirm(`¿Enviar este correo a TODOS los barberos suscritos?\n\nTítulo: ${tituloEmail}`);
    if (!confirmar) return;

    setEnviandoEmail(true);
    setResultadoEnvio(null);

    try {
      const res = await fetch("/api/email-masivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: tituloEmail,
          mensaje: mensajeEmail,
          adminEmail,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setResultadoEnvio({ ok: true, ...data });
        setTituloEmail("");
        setMensajeEmail("");
      } else {
        setResultadoEnvio({ ok: false, error: data.error || "Error desconocido" });
      }
    } catch (err) {
      setResultadoEnvio({ ok: false, error: err.message });
    }
    setEnviandoEmail(false);
  };

  const calcularCrecimiento = (data) => {
    const ahora = new Date();
    const mapa = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      mapa[key] = { mes: MESES[d.getMonth()], total: 0, pro: 0 };
    }

    data.forEach(b => {
      if (!b.created_at) return;
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (mapa[key]) {
        mapa[key].total++;
        if (b.plan === "PRO" || b.plan === "BOSS") mapa[key].pro++;
      }
    });

    let acumulado = 0;
    let acumuladoPro = 0;
    const resultado = Object.values(mapa).map(m => {
      acumulado += m.total;
      acumuladoPro += m.pro;
      return { ...m, acumulado, acumuladoPro };
    });

    setDataCrecimiento(resultado);
  };

  const calcularTurnos = (turnos) => {
    const ahora = new Date();
    const mapa = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      mapa[key] = { mes: MESES[d.getMonth()], turnos: 0 };
    }

    turnos.forEach(t => {
      const d = new Date(t.start_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (mapa[key]) mapa[key].turnos++;
    });

    setDataTurnos(Object.values(mapa));
  };

  const totalBarberias = barberShops.length;
  const totalPro = barberShops.filter(b => b.plan === "PRO" || b.plan === "BOSS").length;
  const totalBasico = totalBarberias - totalPro;
  const porcentajePro = totalBarberias > 0 ? Math.round((totalPro / totalBarberias) * 100) : 0;
  const nuevosEsteMes = dataCrecimiento.length > 0 ? dataCrecimiento[dataCrecimiento.length - 1]?.total || 0 : 0;

  const feedbacksFiltrados = feedbacks.filter(f => {
    if (filtroEstado !== "todos" && f.estado !== filtroEstado) return false;
    if (filtroTipo !== "todos" && f.tipo !== filtroTipo) return false;
    return true;
  });

  const pendientes = feedbacks.filter(f => f.estado === "recibido" || f.estado === "en_revision").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Panel Admin</h1>
        <p className="text-muted-foreground mt-1">Solo visible para guezbarber@gmail.com</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-950 text-white border-none">
          <CardContent className="p-5">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total negocios</p>
            <p className="text-4xl font-black">{totalBarberias}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Plan PRO / BOSS</p>
            <p className="text-4xl font-black">{totalPro}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Conversión PRO</p>
            <p className="text-4xl font-black">{porcentajePro}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Nuevos este mes</p>
            <p className="text-4xl font-black">{nuevosEsteMes}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-amber-50">
          <CardContent className="p-5">
            <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider mb-1">Feedback pendiente</p>
            <p className="text-4xl font-black text-amber-700">{pendientes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Email masivo a todos los usuarios */}
      <Card className="border-border/50 bg-zinc-950 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail size={16} strokeWidth={1.8} /> Enviar consejo / novedad a todos
          </CardTitle>
          <p className="text-xs text-zinc-400">Se envía a todos los barberos suscritos, paguen o no. Cada correo lleva un link para darse de baja.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Título del correo</label>
            <input
              type="text"
              placeholder="Ej: Consejo de la semana"
              value={tituloEmail}
              onChange={(e) => setTituloEmail(e.target.value)}
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 px-3 text-sm text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Mensaje</label>
            <textarea
              placeholder="Escribe aquí tu mensaje. Puedes usar saltos de línea para separar párrafos."
              value={mensajeEmail}
              onChange={(e) => setMensajeEmail(e.target.value)}
              rows={6}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 resize-y"
            />
          </div>

          {resultadoEnvio && (
            <div className={`rounded-lg p-3 text-sm ${resultadoEnvio.ok ? "bg-green-500/15 text-green-300 border border-green-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"}`}>
              {resultadoEnvio.ok
                ? `Enviados: ${resultadoEnvio.enviados} de ${resultadoEnvio.total}.${resultadoEnvio.fallidos ? ` Fallaron: ${resultadoEnvio.fallidos}.` : ""}`
                : `Error: ${resultadoEnvio.error}`
              }
            </div>
          )}

          <Button
            onClick={enviarEmailMasivo}
            disabled={enviandoEmail || !tituloEmail.trim() || !mensajeEmail.trim()}
            className="w-full h-12 font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-40"
          >
            {enviandoEmail ? "Enviando..." : <span className="flex items-center gap-2"><Send size={16} /> Enviar a todos</span>}
          </Button>
        </CardContent>
      </Card>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Crecimiento de usuarios</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses — acumulado</p>
          </CardHeader>
          <CardContent>
            {dataCrecimiento.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dataCrecimiento} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="acumulado" stroke="#09090b" strokeWidth={2.5} dot={{ r: 4 }} name="Total" />
                  <Line type="monotone" dataKey="acumuladoPro" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="PRO" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Registros por mes</CardTitle>
            <p className="text-xs text-muted-foreground">Nuevos negocios en los últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            {dataCrecimiento.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataCrecimiento} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="total" fill="#09090b" radius={[6, 6, 0, 0]} name="Total" />
                  <Bar dataKey="pro" fill="#6366f1" radius={[6, 6, 0, 0]} name="PRO" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Turnos en la plataforma</CardTitle>
            <p className="text-xs text-muted-foreground">Total de turnos agendados por todos los barberos</p>
          </CardHeader>
          <CardContent>
            {dataTurnos.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dataTurnos} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [value + " turnos", "Turnos"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Bar dataKey="turnos" fill="#09090b" radius={[6, 6, 0, 0]} name="Turnos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Distribución de planes */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Distribución de planes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md">
            {[
              { label: "Básico (gratis)", cantidad: totalBasico, color: "bg-muted" },
              { label: "PRO", cantidad: barberShops.filter(b => b.plan === "PRO").length, color: "bg-zinc-900" },
              { label: "BOSS", cantidad: barberShops.filter(b => b.plan === "BOSS").length, color: "bg-black" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm font-bold w-28 shrink-0">{item.label}</span>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${item.color} transition-all`}
                    style={{ width: totalBarberias > 0 ? `${(item.cantidad / totalBarberias) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-sm font-black w-8 text-right">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback de usuarios */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MessageSquarePlus size={15} strokeWidth={1.8} /> Sugerencias y errores reportados
          </CardTitle>
          <p className="text-xs text-muted-foreground">{feedbacks.length} en total — {pendientes} pendientes</p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1.5">
              {["todos", "recibido", "en_revision", "solucionado", "no_aplica"].map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    filtroEstado === est ? "bg-zinc-950 text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {est === "todos" ? "Todos" : ESTADOS_FEEDBACK.find(e => e.valor === est)?.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 ml-auto">
              {["todos", "error", "sugerencia"].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setFiltroTipo(tip)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    filtroTipo === tip ? "bg-zinc-950 text-white" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {tip === "todos" ? "Todos los tipos" : tip === "error" ? "Errores" : "Sugerencias"}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {feedbacksFiltrados.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No hay feedback con estos filtros.</p>
          ) : (
            <div className="space-y-3">
              {feedbacksFiltrados.map((f) => {
                const estadoActual = ESTADOS_FEEDBACK.find(e => e.valor === f.estado) || ESTADOS_FEEDBACK[0];
                return (
                  <div key={f.id} className="p-4 rounded-xl border border-border/50 bg-muted/10">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {f.tipo === "error" ? <AlertCircle size={15} className="text-red-500 shrink-0" /> : <Lightbulb size={15} className="text-amber-500 shrink-0" />}
                        <div>
                          <p className="font-bold text-sm">{f.barber_name || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground">{f.barber_email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(f.created_at).toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </div>

                    <p className="text-sm mt-3 p-3 bg-background rounded-lg border border-border/30">{f.mensaje}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {ESTADOS_FEEDBACK.map((est) => (
                        <button
                          key={est.valor}
                          onClick={() => actualizarFeedback(f.id, { estado: est.valor })}
                          disabled={guardandoId === f.id}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all ${
                            f.estado === est.valor ? est.color + " ring-2 ring-offset-1 ring-zinc-300" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {est.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Responder al barbero (opcional)..."
                        defaultValue={f.respuesta_admin || ""}
                        onChange={(e) => setRespuestas(prev => ({ ...prev, [f.id]: e.target.value }))}
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <Button
                        size="sm"
                        className="h-9 font-bold bg-zinc-950 text-white hover:bg-zinc-800"
                        onClick={() => guardarRespuesta(f.id)}
                        disabled={guardandoId === f.id || respuestas[f.id] === undefined}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla usuarios */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Todos los usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Negocio</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">WhatsApp</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Recordatorio</th>
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Registro</th>
                </tr>
              </thead>
              <tbody>
                {barberShops.map((b, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-2 font-bold">{b.barber_name || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{b.whatsapp_number || "—"}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-black px-2 py-1 rounded-full ${
                        b.plan === "PRO" ? "bg-zinc-900 text-white" :
                        b.plan === "BOSS" ? "bg-black text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {b.plan || "BÁSICO"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-bold ${b.recordatorio_cierre ? "text-green-600" : "text-muted-foreground"}`}>
                        {b.recordatorio_cierre ? "Activo" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground text-xs">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("es-UY") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {barberShops.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">No hay usuarios aún.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}