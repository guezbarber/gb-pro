"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CATEGORIAS = ["Insumos","Alquiler","Sueldos","Servicios","Equipamiento","Otros"];
const COLORES = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function FinanzasPage() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [ingresosMes, setIngresosMes] = useState(0);
  const [gastosMes, setGastosMes] = useState(0);
  const [turnosMes, setTurnosMes] = useState(0);
  const [ticketPromedio, setTicketPromedio] = useState(0);
  const [dataGrafica, setDataGrafica] = useState([]);
  const [dataServicios, setDataServicios] = useState([]);
  const [dataSemana, setDataSemana] = useState([]);
  const [gastos, setGastos] = useState([]);

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Otros");
  const [fechaGasto, setFechaGasto] = useState(() => new Date().toISOString().split("T")[0]);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [mostrarFormGasto, setMostrarFormGasto] = useState(false);

  useEffect(() => { cargarFinanzas(); }, [periodo]);

  const cargarFinanzas = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ahora = new Date();
    let inicio, etiquetas = [];

    if (periodo === "mes") {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const diasEnMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= diasEnMes; i++) etiquetas.push({ key: String(i).padStart(2,"0"), label: `${i}` });
    } else {
      inicio = new Date(ahora.getFullYear(), 0, 1);
      for (let i = 0; i < 12; i++) etiquetas.push({ key: String(i).padStart(2,"00"), label: MESES[i] });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 6);

    const [{ data: turnos }, { data: gastosData }, { data: turnos7 }] = await Promise.all([
      supabase
        .from("appointments")
        .select("start_time, status, services(name, price)")
        .eq("barber_id", user.id)
        .gte("start_time", inicio.toISOString())
        .order("start_time", { ascending: true }),
      supabase
        .from("gastos")
        .select("*")
        .eq("barber_id", user.id)
        .gte("fecha", inicio.toISOString().split("T")[0])
        .order("fecha", { ascending: false }),
      supabase
        .from("appointments")
        .select("start_time, services(price)")
        .eq("barber_id", user.id)
        .gte("start_time", hace7.toISOString())
        .order("start_time", { ascending: true }),
    ]);

    if (gastosData) setGastos(gastosData);
    const totalGastos = (gastosData || []).reduce((s, g) => s + (g.monto || 0), 0);
    setGastosMes(totalGastos);

    if (turnos) {
      const validos = turnos.filter(t => t.status !== "falto");
      const totalIngresos = validos.reduce((s, t) => s + (t.services?.price || 0), 0);
      setIngresosMes(totalIngresos);
      setTurnosMes(validos.length);
      setTicketPromedio(validos.length > 0 ? Math.round(totalIngresos / validos.length) : 0);

      const mapaIngresos = {};
      etiquetas.forEach(e => { mapaIngresos[e.key] = { label: e.label, ingresos: 0, gastos: 0 }; });

      validos.forEach(t => {
        const d = new Date(t.start_time);
        const key = periodo === "mes" ? String(d.getDate()).padStart(2,"0") : String(d.getMonth()).padStart(2,"00");
        if (mapaIngresos[key]) mapaIngresos[key].ingresos += t.services?.price || 0;
      });

      (gastosData || []).forEach(g => {
        const d = new Date(g.fecha);
        const key = periodo === "mes" ? String(d.getDate()).padStart(2,"0") : String(d.getMonth()).padStart(2,"00");
        if (mapaIngresos[key]) mapaIngresos[key].gastos += g.monto || 0;
      });

      setDataGrafica(Object.values(mapaIngresos));

      const mapaServicios = {};
      validos.forEach(t => {
        const nombre = t.services?.name || "Otros";
        const precio = t.services?.price || 0;
        if (!mapaServicios[nombre]) mapaServicios[nombre] = { name: nombre, ingresos: 0, turnos: 0 };
        mapaServicios[nombre].ingresos += precio;
        mapaServicios[nombre].turnos += 1;
      });
      setDataServicios(Object.values(mapaServicios).sort((a, b) => b.ingresos - a.ingresos));
    }

    if (turnos7) {
      const mapaIngresosDia = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        mapaIngresosDia[key] = { dia: DIAS[d.getDay()], ingresos: 0 };
      }
      turnos7.forEach(t => {
        const key = new Date(t.start_time).toISOString().split("T")[0];
        if (mapaIngresosDia[key]) mapaIngresosDia[key].ingresos += t.services?.price || 0;
      });
      setDataSemana(Object.values(mapaIngresosDia));
    }

    setLoading(false);
  };

  const agregarGasto = async (e) => {
    e.preventDefault();
    setGuardandoGasto(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("gastos").insert([{
      barber_id: user.id, descripcion, monto: parseFloat(monto), categoria, fecha: fechaGasto,
    }]);
    if (!error) {
      setDescripcion(""); setMonto(""); setCategoria("Otros");
      setFechaGasto(new Date().toISOString().split("T")[0]);
      setMostrarFormGasto(false);
      cargarFinanzas();
    } else alert("Error: " + error.message);
    setGuardandoGasto(false);
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    const { error } = await supabase.from("gastos").delete().eq("id", id);
    if (!error) setGastos(prev => prev.filter(g => g.id !== id));
  };

  const gananciaNeta = ingresosMes - gastosMes;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground mt-1">Ingresos, gastos y ganancia real.</p>
        </div>
        <div className="bg-muted/60 p-1 rounded-full inline-flex border border-border/50 w-full sm:w-auto">
          <button onClick={() => setPeriodo("mes")} className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-bold transition-all ${periodo === "mes" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
            Este mes
          </button>
          <button onClick={() => setPeriodo("año")} className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-bold transition-all ${periodo === "año" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
            Este año
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Ingresos", value: `$${ingresosMes}`, color: "" },
          { label: "Gastos", value: `$${gastosMes}`, color: "text-foreground" },
          { label: "Ganancia neta", value: `$${gananciaNeta}`, color: gananciaNeta < 0 ? "text-muted-foreground" : "text-foreground" },
          { label: "Ticket promedio", value: `$${ticketPromedio}`, color: "" },
        ].map((m, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-4 md:p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-3xl md:text-4xl font-light tracking-tight ${m.color}`}>{loading ? "..." : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Ingresos vs Gastos — {periodo === "mes" ? "este mes" : "este año"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
          ) : dataGrafica.every(d => d.ingresos === 0 && d.gastos === 0) ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay datos en este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dataGrafica} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [`$${value}`, name === "ingresos" ? "Ingresos" : "Gastos"]} contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                <Area type="monotone" dataKey="ingresos" stroke="#18181b" strokeWidth={2} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="url(#colorGastos)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Ingresos últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
            ) : dataSemana.every(d => d.ingresos === 0) ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Aún no hay ingresos esta semana</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataSemana} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${value}`, "Ingresos"]} contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                  <Bar dataKey="ingresos" fill="#09090b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Servicios más pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
            ) : dataServicios.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Aún no hay turnos en este período</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dataServicios} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="turnos">
                    {dataServicios.map((_, index) => (
                      <Cell key={index} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value + " turnos", name]} contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">Gastos del período</CardTitle>
          <Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 h-9 px-4" onClick={() => setMostrarFormGasto(!mostrarFormGasto)}>
            {mostrarFormGasto ? "Cancelar" : "+ Agregar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {mostrarFormGasto && (
            <form onSubmit={agregarGasto} className="p-4 bg-muted/20 rounded-xl border border-border/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Descripción</Label>
                  <Input required placeholder="Descripción" className="h-11" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Monto ($)</Label>
                  <Input required type="number" min="0" step="any" placeholder="Monto" className="h-11" value={monto} onChange={(e) => setMonto(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <select className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" className="h-11" value={fechaGasto} onChange={(e) => setFechaGasto(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold h-11" disabled={guardandoGasto}>
                {guardandoGasto ? "Guardando..." : "Guardar gasto"}
              </Button>
            </form>
          )}

          {gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay gastos en este período.</div>
          ) : (
            <div className="space-y-2">
              {gastos.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/40 group">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-bold text-sm truncate">{g.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{g.categoria} · {g.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-light text-base text-foreground">-${g.monto}</p>
                    <button onClick={() => eliminarGasto(g.id)} className="text-muted-foreground hover:text-red-500 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Servicios más rentables</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
          ) : dataServicios.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay datos en este período</div>
          ) : (
            <div className="space-y-2">
              {dataServicios.map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                  <div>
                    <p className="font-bold text-sm">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.turnos} {svc.turnos === 1 ? "turno" : "turnos"}</p>
                  </div>
                  <p className="font-light text-base">${svc.ingresos}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
