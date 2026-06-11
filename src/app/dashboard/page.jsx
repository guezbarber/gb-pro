"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORES = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function DashboardPage() {
  const [turnosHoy, setTurnosHoy] = useState(0);
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [clientesHoy, setClientesHoy] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);

  const [barberId, setBarberId] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [plan, setPlan] = useState("basico");
  const [esOwner, setEsOwner] = useState(false);
  const [barbershopId, setBarbershopId] = useState(null);

  const [dataSemana, setDataSemana] = useState([]);
  const [dataServicios, setDataServicios] = useState([]);

  // ✅ Multi-barbero
  const [equipo, setEquipo] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberId(user.id);

    // Obtener barbershop y plan
    const { data: bshop } = await supabase
      .from("barbershops")
      .select("id, plan")
      .eq("owner_id", user.id)
      .single();

    if (bshop) {
      setPlan(bshop.plan || "basico");
      setBarbershopId(bshop.id);
    }

    // Verificar si es owner
    const { data: barberRecord } = await supabase
      .from("barbers")
      .select("rol")
      .eq("user_id", user.id)
      .single();

    const isOwner = barberRecord?.rol === "owner";
    setEsOwner(isOwner);

    // ── Rango de hoy ──
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 6);

    const { data: turnos7 } = await supabase
      .from("appointments")
      .select("start_time, client_name, services(name, price)")
      .eq("barber_id", user.id)
      .gte("start_time", hace7.toISOString())
      .order("start_time", { ascending: true });

    if (turnos7) {
      const turnosDeHoy = turnos7.filter(t => {
        const d = new Date(t.start_time);
        return d >= hoy && d < mañana;
      });
      setTurnosHoy(turnosDeHoy.length);
      setIngresosHoy(turnosDeHoy.reduce((s, t) => s + (t.services?.price || 0), 0));
      setClientesHoy(new Set(turnosDeHoy.map(t => t.client_name)).size);

      const mapaIngresosDia = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        mapaIngresosDia[key] = { dia: DIAS[d.getDay()], ingresos: 0 };
      }
      turnos7.forEach(t => {
        const key = new Date(t.start_time).toISOString().split("T")[0];
        if (mapaIngresosDia[key]) {
          mapaIngresosDia[key].ingresos += t.services?.price || 0;
        }
      });
      setDataSemana(Object.values(mapaIngresosDia));

      const mapaServicios = {};
      turnos7.forEach(t => {
        const nombre = t.services?.name || "Otros";
        mapaServicios[nombre] = (mapaServicios[nombre] || 0) + 1;
      });
      setDataServicios(
        Object.entries(mapaServicios)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    }

    const { data: todosLosTurnos } = await supabase
      .from("appointments")
      .select("client_name")
      .eq("barber_id", user.id);
    if (todosLosTurnos) {
      setTotalClientes(new Set(todosLosTurnos.map(t => t.client_name)).size);
    }

    // ✅ Cargar datos del equipo si es owner PRO
    if (isOwner && bshop?.plan === "PRO" && bshop?.id) {
      cargarEquipo(bshop.id);
    }

    setLoading(false);
  };

  // ✅ Cargar rendimiento de cada barbero del equipo
  const cargarEquipo = async (bshopId) => {
    setLoadingEquipo(true);

    const { data: miembros } = await supabase
      .from("barbers")
      .select("id, name, rol, atiende_clientes, activo, color")
      .eq("barbershop_id", bshopId)
      .eq("activo", true)
      .order("created_at", { ascending: true });

    if (!miembros) { setLoadingEquipo(false); return; }

    // Para cada miembro que atiende clientes, traer sus turnos del mes
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

    const equipoConStats = await Promise.all(
      miembros.filter(m => m.atiende_clientes).map(async (miembro) => {
        const { data: turnosMes } = await supabase
          .from("appointments")
          .select("status, services(price)")
          .eq("barber_member_id", miembro.id)
          .gte("start_time", inicioMes);

        const turnosValidos = (turnosMes || []).filter(t => t.status !== "falto");
        const totalTurnos = turnosValidos.length;
        const totalIngresos = turnosValidos.reduce((s, t) => s + (t.services?.price || 0), 0);

        // Turnos de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const { data: turnosHoyData } = await supabase
          .from("appointments")
          .select("id, status")
          .eq("barber_member_id", miembro.id)
          .gte("start_time", hoy.toISOString())
          .lt("start_time", manana.toISOString());

        return {
          ...miembro,
          turnosMes: totalTurnos,
          ingresosMes: totalIngresos,
          turnosHoy: (turnosHoyData || []).length,
        };
      })
    );

    setEquipo(equipoConStats);
    setLoadingEquipo(false);
  };

  const copiarEnlace = () => {
    const url = `https://gb-pro-blue.vercel.app/reserva/${barberId}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg">
            Bienvenido al centro de mando de tu barbería.
          </p>
        </div>

        {/* Enlace de reservas */}
        {barberId && (
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">Tu enlace de reservas</h3>
                <p className="text-sm text-muted-foreground">
                  Pégalo en tu Instagram para que tus clientes agenden solos.
                </p>
              </div>
              <Button onClick={copiarEnlace} className="w-full sm:w-auto font-bold h-11 px-6">
                {copiado ? "¡Copiado!" : "Copiar mi enlace"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Métricas del día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Turnos Hoy", value: loading ? "..." : turnosHoy, color: "text-blue-600" },
            { label: "Ingresos Hoy", value: loading ? "..." : `$${ingresosHoy}`, color: "text-emerald-600" },
            { label: "Clientes Hoy", value: loading ? "..." : clientesHoy, color: "text-violet-600" },
            { label: "Clientes Totales", value: loading ? "..." : totalClientes, color: "text-amber-600" },
          ].map((m, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4 md:p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ✅ SECCIÓN EQUIPO — solo owners PRO */}
        {esOwner && plan === "PRO" && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Mi Equipo</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Rendimiento del mes actual</p>
              </div>
              <a href="/dashboard/equipo">
                <Button variant="outline" size="sm" className="font-bold h-9">
                  Gestionar equipo
                </Button>
              </a>
            </CardHeader>
            <CardContent>
              {loadingEquipo ? (
                <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">
                  Cargando equipo...
                </div>
              ) : equipo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl space-y-3">
                  <p className="font-bold">Aún no tienes barberos en el equipo</p>
                  <a href="/dashboard/equipo">
                    <Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800">
                      Agregar barbero
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipo.map((miembro) => (
                    <div key={miembro.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Color del barbero */}
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: miembro.color || "#18181b" }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{miembro.name}</p>
                            {miembro.rol === "owner" && (
                              <span className="text-xs bg-zinc-950 text-white px-2 py-0.5 rounded-full font-bold">Dueño</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Hoy: {miembro.turnosHoy} {miembro.turnosHoy === 1 ? "turno" : "turnos"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">${miembro.ingresosMes}</p>
                        <p className="text-xs text-muted-foreground">{miembro.turnosMes} turnos este mes</p>
                      </div>
                    </div>
                  ))}

                  {/* Total del equipo */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 text-white mt-2">
                    <p className="font-bold text-sm">Total del equipo este mes</p>
                    <div className="text-right">
                      <p className="font-black text-xl">
                        ${equipo.reduce((s, m) => s + m.ingresosMes, 0)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {equipo.reduce((s, m) => s + m.turnosMes, 0)} turnos
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Ingresos últimos 7 días</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
              ) : dataSemana.every(d => d.ingresos === 0) ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                  Aún no hay ingresos esta semana
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dataSemana} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`$${value}`, "Ingresos"]}
                      contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    />
                    <Bar dataKey="ingresos" fill="#2563eb" radius={[6, 6, 0, 0]} />
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
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                  Aún no hay turnos esta semana
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dataServicios}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dataServicios.map((_, index) => (
                        <Cell key={index} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value + " turnos", name]}
                      contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                    />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Accesos rápidos */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Agenda", href: "/dashboard/agenda" },
                { label: "Clientes", href: "/dashboard/clientes" },
                { label: "Servicios", href: "/dashboard/services" },
                { label: "Suscripción", href: "/dashboard/suscripcion" },
              ].map((item, i) => (
                <a key={i} href={item.href}>
                  <Button variant="outline" className="w-full h-12 font-semibold text-sm">
                    {item.label}
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}