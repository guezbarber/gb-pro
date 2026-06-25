"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Plus, X, ShoppingBag, DollarSign } from "lucide-react";
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
  const barberIdRef = useRef(null);
  const [copiado, setCopiado] = useState(false);
  const [plan, setPlan] = useState("basico");
  const [esOwner, setEsOwner] = useState(false);

  const [dataSemana, setDataSemana] = useState([]);
  const [dataServicios, setDataServicios] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(false);

  // ── Turno rápido (cliente de la calle, sin agendar) ──
  const [modalRapidoAbierto, setModalRapidoAbierto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // controla la animación de entrada/salida
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [servicioRapidoId, setServicioRapidoId] = useState(null);
  const [productoRapidoId, setProductoRapidoId] = useState(null);
  const [extraRapido, setExtraRapido] = useState("");
  const [guardandoRapido, setGuardandoRapido] = useState(false);
  const [rapidoExito, setRapidoExito] = useState(false);

  // ── Estado para deslizar el modal hacia abajo (solo desde la barrita) ──
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(null);
  const arrastrando = useRef(false);

  useEffect(() => { loadData(); }, []);

  // Cuando se abre el modal, lo montamos y en el siguiente frame
  // disparamos la animación de entrada (sube desde abajo con rebote).
  useEffect(() => {
    if (modalRapidoAbierto) {
      requestAnimationFrame(() => setModalVisible(true));
    }
  }, [modalRapidoAbierto]);

  // Bloquea el scroll del fondo mientras el modal está abierto.
  // Guarda la posición actual y la restaura al cerrar, sin saltos.
  useEffect(() => {
    if (modalRapidoAbierto) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [modalRapidoAbierto]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberId(user.id);
    barberIdRef.current = user.id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 6);

    const [
      { data: bshop },
      { data: barberRecord },
      { data: turnos7 },
      { data: todosLosTurnos },
      { data: serviciosData },
      { data: productosData },
    ] = await Promise.all([
      supabase.from("barbershops").select("id, plan").eq("owner_id", user.id).single(),
      supabase.from("barbers").select("rol").eq("user_id", user.id).single(),
      supabase.from("appointments").select("start_time, client_name, services(name, price)").eq("barber_id", user.id).gte("start_time", hace7.toISOString()).order("start_time", { ascending: true }),
      supabase.from("appointments").select("client_name").eq("barber_id", user.id),
      supabase.from("services").select("*").eq("barber_id", user.id).order("name", { ascending: true }),
      supabase.from("productos").select("*").eq("barber_id", user.id).gt("stock", 0).order("nombre", { ascending: true }),
    ]);

    if (bshop) setPlan(bshop.plan || "basico");
    const isOwner = barberRecord?.rol === "owner";
    setEsOwner(isOwner);
    if (serviciosData) setServiciosDisponibles(serviciosData);
    if (productosData) setProductosDisponibles(productosData);

    if (turnos7) {
      const turnosDeHoy = turnos7.filter(t => {
        const d = new Date(t.start_time);
        return d >= hoy && d < manana;
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
        if (mapaIngresosDia[key]) mapaIngresosDia[key].ingresos += t.services?.price || 0;
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

    if (todosLosTurnos) setTotalClientes(new Set(todosLosTurnos.map(t => t.client_name)).size);

    if (isOwner && bshop?.plan === "PRO" && bshop?.id) cargarEquipo(bshop.id);

    setLoading(false);
  };

  const cargarEquipo = async (bshopId) => {
    setLoadingEquipo(true);
    const { data: miembros } = await supabase
      .from("barbers")
      .select("id, name, rol, atiende_clientes, activo, color")
      .eq("barbershop_id", bshopId)
      .eq("activo", true)
      .order("created_at", { ascending: true });

    if (!miembros) { setLoadingEquipo(false); return; }

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const equipoConStats = await Promise.all(
      miembros.filter(m => m.atiende_clientes).map(async (miembro) => {
        const [{ data: turnosMes }, { data: turnosHoyData }] = await Promise.all([
          supabase.from("appointments").select("status, services(price)").eq("barber_member_id", miembro.id).gte("start_time", inicioMes),
          supabase.from("appointments").select("id, status").eq("barber_member_id", miembro.id).gte("start_time", hoy.toISOString()).lt("start_time", manana.toISOString()),
        ]);

        const turnosValidos = (turnosMes || []).filter(t => t.status !== "falto");
        const totalTurnos = turnosValidos.length;
        const totalIngresos = turnosValidos.reduce((s, t) => s + (t.services?.price || 0), 0);

        return { ...miembro, turnosMes: totalTurnos, ingresosMes: totalIngresos, turnosHoy: (turnosHoyData || []).length };
      })
    );

    setEquipo(equipoConStats);
    setLoadingEquipo(false);
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(`https://gbpro.app/reserva/${barberId}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Cierra el modal con animación suave hacia abajo antes de desmontarlo.
  const cerrarModalRapido = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalRapidoAbierto(false);
      setServicioRapidoId(null);
      setProductoRapidoId(null);
      setExtraRapido("");
      setDragY(0);
    }, 280);
  };

  // ── Gestos: SOLO se arrastra desde la barrita de arriba ──
  // Así el scroll del contenido nunca pelea con el cierre del modal.
  const onBarraTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    arrastrando.current = true;
  };

  const onBarraTouchMove = (e) => {
    if (!arrastrando.current || dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const onBarraTouchEnd = () => {
    if (dragY > 110) {
      cerrarModalRapido();
    } else {
      setDragY(0);
    }
    dragStartY.current = null;
    arrastrando.current = false;
  };

  // Registra un turno completado "ya mismo" sin pasar por la agenda —
  // pensado para clientes de la calle que no quieren dar nombre/teléfono.
  const registrarTurnoRapido = async () => {
    if (!servicioRapidoId || !barberIdRef.current) return;
    setGuardandoRapido(true);

    const servicio = serviciosDisponibles.find(s => s.id === servicioRapidoId);
    const ahoraISO = new Date().toISOString();

    const { data: turnoInsertado, error } = await supabase.from("appointments").insert([{
      barber_id: barberIdRef.current,
      service_id: servicioRapidoId,
      client_name: "Cliente sin registrar",
      client_phone: null,
      start_time: ahoraISO,
      status: "completado",
    }]).select().single();

    if (error) {
      alert("Error: " + error.message);
      setGuardandoRapido(false);
      return;
    }

    // Producto vendido junto al corte, si eligió uno
    if (productoRapidoId) {
      const producto = productosDisponibles.find(p => p.id === productoRapidoId);
      if (producto) {
        await supabase.from("ventas_productos").insert([{
          barber_id: barberIdRef.current,
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          precio: producto.precio,
          appointment_id: turnoInsertado?.id || null,
        }]);
        await supabase.from("productos").update({ stock: producto.stock - 1 }).eq("id", producto.id);
      }
    }

    // Extra / propina — se guarda como gasto-ingreso suelto en finanzas
    const extraNum = parseFloat(extraRapido);
    if (extraNum > 0) {
      await supabase.from("ingresos_extra").insert([{
        barber_id: barberIdRef.current,
        monto: extraNum,
        motivo: "Extra / propina",
        appointment_id: turnoInsertado?.id || null,
      }]).then(({ error: errExtra }) => {
        // Si la tabla ingresos_extra no existe todavía no rompemos el flujo
        if (errExtra) console.warn("No se pudo registrar el extra:", errExtra.message);
      });
    }

    setGuardandoRapido(false);
    setRapidoExito(true);
    setTimeout(() => {
      setRapidoExito(false);
      cerrarModalRapido();
      loadData();
    }, 900);
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Panel</h1>
          <p className="text-muted-foreground mt-1">Resumen de tu barbería.</p>
        </div>

        {/* Enlace de reservas — limpio y directo */}
        {barberId && (
          <div className="flex items-center gap-3 p-4 bg-zinc-950 text-white rounded-2xl">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Tu enlace de reservas</p>
              <p className="text-zinc-400 text-xs truncate mt-0.5">gbpro.app/reserva/{barberId}</p>
            </div>
            <button
              onClick={copiarEnlace}
              className="flex items-center gap-2 bg-white text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0 hover:bg-zinc-100 transition-colors active:scale-95"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}

        {/* Métricas del día */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Turnos hoy", value: loading ? "..." : turnosHoy },
            { label: "Ingresos hoy", value: loading ? "..." : `$${ingresosHoy}` },
            { label: "Clientes hoy", value: loading ? "..." : clientesHoy },
            { label: "Clientes totales", value: loading ? "..." : totalClientes },
          ].map((m, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4 md:p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-3xl font-black">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Equipo — solo owners PRO */}
        {esOwner && plan === "PRO" && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Mi Equipo</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Rendimiento del mes actual</p>
              </div>
              <a href="/dashboard/equipo">
                <Button variant="outline" size="sm" className="font-bold h-9">Gestionar</Button>
              </a>
            </CardHeader>
            <CardContent>
              {loadingEquipo ? (
                <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Cargando equipo...</div>
              ) : equipo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl space-y-3">
                  <p className="font-bold">Aún no tienes barberos en el equipo</p>
                  <a href="/dashboard/equipo"><Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800">Agregar barbero</Button></a>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipo.map((miembro) => (
                    <div key={miembro.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: miembro.color || "#18181b" }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{miembro.name}</p>
                            {miembro.rol === "owner" && <span className="text-xs bg-zinc-950 text-white px-2 py-0.5 rounded-full font-bold">Dueño</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Hoy: {miembro.turnosHoy} {miembro.turnosHoy === 1 ? "turno" : "turnos"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">${miembro.ingresosMes}</p>
                        <p className="text-xs text-muted-foreground">{miembro.turnosMes} turnos este mes</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 text-white mt-2">
                    <p className="font-bold text-sm">Total del equipo este mes</p>
                    <div className="text-right">
                      <p className="font-black text-xl">${equipo.reduce((s, m) => s + m.ingresosMes, 0)}</p>
                      <p className="text-xs text-zinc-400">{equipo.reduce((s, m) => s + m.turnosMes, 0)} turnos</p>
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
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">Aún no hay turnos esta semana</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dataServicios} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
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

        {/* Accesos rápidos */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Accesos rápidos</CardTitle>
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
                  <Button variant="outline" className="w-full h-12 font-semibold text-sm">{item.label}</Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── BURBUJA FLOTANTE — turno rápido ── */}
      <button
        onClick={() => setModalRapidoAbierto(true)}
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-full bg-zinc-950 text-white shadow-xl flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800 hover:scale-105"
        aria-label="Registrar turno rápido"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ── MODAL — turno rápido (bottom sheet estilo iPhone) ── */}
      {modalRapidoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{
            backgroundColor: modalVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            backdropFilter: modalVisible ? "blur(6px)" : "blur(0px)",
            WebkitBackdropFilter: modalVisible ? "blur(6px)" : "blur(0px)",
            transition: "background-color 0.3s ease, backdrop-filter 0.3s ease",
          }}
          onClick={cerrarModalRapido}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm flex flex-col sm:mb-0"
            style={{
              maxHeight: "75vh",
              marginBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
              transform: modalVisible
                ? `translateY(${dragY}px)`
                : "translateY(120%)",
              transition: arrastrando.current
                ? "none"
                : "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Barrita superior para arrastrar (estilo iPhone) — SOLO aquí se arrastra */}
            <div
              className="sm:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
              onTouchStart={onBarraTouchStart}
              onTouchMove={onBarraTouchMove}
              onTouchEnd={onBarraTouchEnd}
              style={{ touchAction: "none" }}
            >
              <div className="w-10 h-1.5 rounded-full bg-zinc-300" />
            </div>

            {/* Encabezado fijo */}
            <div className="bg-zinc-950 px-6 py-5 text-white flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black">Registro rápido</h2>
                <p className="text-zinc-400 text-sm mt-1">Para clientes de la calle — sin agendar.</p>
              </div>
              <button onClick={cerrarModalRapido} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
                <X size={20} />
              </button>
            </div>

            {rapidoExito ? (
              <div className="p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-[ping_0.5s_ease-out_1]">
                  <Check size={26} className="text-green-600" strokeWidth={2.5} />
                </div>
                <p className="font-bold text-lg">¡Registrado!</p>
                <p className="text-sm text-muted-foreground">Ya quedó sumado a tus ingresos de hoy.</p>
              </div>
            ) : (
              <>
                {/* Contenido scrolleable — rebota dentro de la burbuja (overscroll contain) */}
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
                  {/* Servicio */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Servicio</p>
                    {serviciosDisponibles.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg text-center">
                        Todavía no tienes servicios creados.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {serviciosDisponibles.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setServicioRapidoId(s.id)}
                            className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                              servicioRapidoId === s.id ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"
                            }`}
                          >
                            <p className="font-bold text-sm leading-tight">{s.name}</p>
                            <p className={`text-xs mt-0.5 ${servicioRapidoId === s.id ? "text-zinc-300" : "text-muted-foreground"}`}>${s.price}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Producto vendido (opcional) */}
                  {productosDisponibles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag size={12} /> Producto vendido <span className="font-normal">(opcional)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setProductoRapidoId(null)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all active:scale-95 ${
                            productoRapidoId === null ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"
                          }`}
                        >
                          Ninguno
                        </button>
                        {productosDisponibles.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setProductoRapidoId(p.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                              productoRapidoId === p.id ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"
                            }`}
                          >
                            <p className="font-bold text-xs leading-tight truncate">{p.nombre}</p>
                            <p className={`text-xs ${productoRapidoId === p.id ? "text-zinc-300" : "text-muted-foreground"}`}>${p.precio}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra / propina */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={12} /> Extra / propina <span className="font-normal">(opcional)</span>
                    </p>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={extraRapido}
                      onChange={(e) => setExtraRapido(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-muted/30 px-4 text-base font-bold"
                    />
                  </div>
                </div>

                {/* Botón FIJO abajo — siempre visible, nunca tapado */}
                <div className="px-6 py-4 border-t border-border/50 bg-white shrink-0">
                  <Button
                    className="w-full h-12 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 transition-transform"
                    disabled={!servicioRapidoId || guardandoRapido}
                    onClick={registrarTurnoRapido}
                  >
                    {guardandoRapido ? "Guardando..." : "Registrar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}