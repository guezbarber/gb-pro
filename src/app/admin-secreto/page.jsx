"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function AdminSecretoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberShops, setBarberShops] = useState([]);
  const [dataCrecimiento, setDataCrecimiento] = useState([]);
  const [dataTurnos, setDataTurnos] = useState([]);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== "guezbarber@gmail.com") {
      router.push("/dashboard");
      return;
    }

    const { data } = await supabase
      .from("barber_settings")
      .select("barber_name, whatsapp_number, plan, recordatorio_cierre, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      setBarberShops(data);
      calcularCrecimiento(data);
    }

    // Turnos totales por mes (últimos 6 meses)
    const hace6 = new Date();
    hace6.setMonth(hace6.getMonth() - 5);
    hace6.setDate(1);
    hace6.setHours(0, 0, 0, 0);

    const { data: turnos } = await supabase
      .from("appointments")
      .select("start_time")
      .gte("start_time", hace6.toISOString());

    if (turnos) calcularTurnos(turnos);

    setLoading(false);
  };

  const calcularCrecimiento = (data) => {
    const ahora = new Date();
    const mapa = {};

    // Últimos 6 meses
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

    // Acumulado
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-950 text-white border-none">
          <CardContent className="p-5">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total barberías</p>
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
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Crecimiento acumulado */}
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

        {/* Nuevos por mes */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Registros por mes</CardTitle>
            <p className="text-xs text-muted-foreground">Nuevas barberías en los últimos 6 meses</p>
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

        {/* Turnos totales por mes */}
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
                  <th className="text-left py-3 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Barbería</th>
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