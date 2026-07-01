"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Plus, X, ShoppingBag, DollarSign, Pencil, Minus, RotateCcw } from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";

export default function DashboardPage() {
  const [turnosHoy, setTurnosHoy] = useState(0);
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [turnosListaHoy, setTurnosListaHoy] = useState([]);
  const [loading, setLoading] = useState(true);

  const [barberId, setBarberId] = useState(null);
  const barberIdRef = useRef(null);
  const [copiado, setCopiado] = useState(false);
  const [plan, setPlan] = useState("basico");
  const [esOwner, setEsOwner] = useState(false);

  const [equipo, setEquipo] = useState([]);
  const [loadingEquipo, setLoadingEquipo] = useState(false);

  // ── Turno rápido ──
  const [modalRapidoAbierto, setModalRapidoAbierto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [servicioRapidoId, setServicioRapidoId] = useState(null);
  const [productoRapidoId, setProductoRapidoId] = useState(null);
  const [extraRapido, setExtraRapido] = useState("");
  const [guardandoRapido, setGuardandoRapido] = useState(false);
  const [rapidoExito, setRapidoExito] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(null);
  const arrastrando = useRef(false);

  // ── Modal venta producto (al completar turno) ──
  const [modalVenta, setModalVenta] = useState(false);
  const [turnoCompletado, setTurnoCompletado] = useState(null);
  const [vendiendo, setVendiendo] = useState(false);

  // ── Gasto rápido ──
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [modalGastoVisible, setModalGastoVisible] = useState(false);
  const [gastoDescripcion, setGastoDescripcion] = useState("");
  const [gastoMonto, setGastoMonto] = useState("");
  const [gastoCategoria, setGastoCategoria] = useState("Otros");
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [gastoExito, setGastoExito] = useState(false);
  const [dragYGasto, setDragYGasto] = useState(0);
  const dragStartYGasto = useRef(null);
  const arrastrandoGasto = useRef(false);

  const { t } = useIdioma();

  const CATEGORIAS = [
    t("panel.catInsumos"),
    t("panel.catAlquiler"),
    t("panel.catSueldos"),
    t("panel.catServicios"),
    t("panel.catEquipamiento"),
    t("panel.catOtros"),
  ];

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (modalRapidoAbierto) requestAnimationFrame(() => setModalVisible(true));
  }, [modalRapidoAbierto]);

  useEffect(() => {
    if (modalGastoAbierto) requestAnimationFrame(() => setModalGastoVisible(true));
  }, [modalGastoAbierto]);

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

  useEffect(() => {
    if (modalGastoAbierto) {
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
  }, [modalGastoAbierto]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberId(user.id);
    barberIdRef.current = user.id;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const [
      { data: bshop },
      { data: barberRecord },
      { data: turnosData },
      { data: serviciosData },
      { data: productosData },
    ] = await Promise.all([
      supabase.from("barbershops").select("id, plan").eq("owner_id", user.id).single(),
      supabase.from("barbers").select("rol").eq("user_id", user.id).single(),
      supabase.from("appointments").select("*, services(name, price, duration_minutes)").eq("barber_id", user.id).gte("start_time", hoy.toISOString()).lt("start_time", manana.toISOString()).order("start_time", { ascending: true }),
      supabase.from("services").select("*").eq("barber_id", user.id).order("name", { ascending: true }),
      supabase.from("productos").select("*").eq("barber_id", user.id).gt("stock", 0).order("nombre", { ascending: true }),
    ]);

    if (bshop) setPlan(bshop.plan || "basico");
    const isOwner = barberRecord?.rol === "owner";
    setEsOwner(isOwner);
    if (serviciosData) setServiciosDisponibles(serviciosData);
    if (productosData) setProductosDisponibles(productosData);

    if (turnosData) {
      setTurnosListaHoy(turnosData);
      setTurnosHoy(turnosData.length);
      setIngresosHoy(turnosData.filter(appt => appt.status !== "falto").reduce((s, appt) => s + (appt.services?.price || 0), 0));
    }

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
        const turnosValidos = (turnosMes || []).filter(a => a.status !== "falto");
        return {
          ...miembro,
          turnosMes: turnosValidos.length,
          ingresosMes: turnosValidos.reduce((s, a) => s + (a.services?.price || 0), 0),
          turnosHoy: (turnosHoyData || []).length,
        };
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

  // ── Handlers de estado de turno ──
  const handleCambiarStatus = async (id, nuevoStatus) => {
    const { error } = await supabase.from("appointments").update({ status: nuevoStatus }).eq("id", id);
    if (!error) {
      setTurnosListaHoy(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, status: nuevoStatus } : a);
        setIngresosHoy(updated.filter(a => a.status !== "falto").reduce((s, a) => s + (a.services?.price || 0), 0));
        return updated;
      });
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleCompletar = (appt) => {
    setTurnoCompletado(appt);
    handleCambiarStatus(appt.id, "completado");
    if (productosDisponibles.length > 0) setModalVenta(true);
  };

  const registrarVentaProducto = async (producto) => {
    setVendiendo(true);
    const { error } = await supabase.from("ventas_productos").insert([{
      barber_id: barberIdRef.current,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      precio: producto.precio,
      appointment_id: turnoCompletado?.id || null,
    }]);
    if (!error) {
      await supabase.from("productos").update({ stock: producto.stock - 1 }).eq("id", producto.id);
      setProductosDisponibles(prev => prev.map(p => p.id === producto.id ? { ...p, stock: p.stock - 1 } : p).filter(p => p.stock > 0));
    } else {
      alert("Error: " + error.message);
    }
    setVendiendo(false);
  };

  const getStatusStyle = (status) => {
    if (status === "completado") return { border: "border-green-200 bg-green-50", badge: "bg-green-100 text-green-700", texto: t("panel.completado") };
    if (status === "falto") return { border: "border-red-200 bg-red-50", badge: "bg-red-100 text-red-600", texto: t("panel.falto") };
    return { border: "border-border/60 bg-white", badge: "", texto: "" };
  };

  // ── Turno rápido ──
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
    if (dragY > 110) cerrarModalRapido();
    else setDragY(0);
    dragStartY.current = null;
    arrastrando.current = false;
  };

  const registrarTurnoRapido = async () => {
    if (!servicioRapidoId || !barberIdRef.current) return;
    setGuardandoRapido(true);

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

    const extraNum = parseFloat(extraRapido);
    if (extraNum > 0) {
      await supabase.from("ingresos_extra").insert([{
        barber_id: barberIdRef.current,
        monto: extraNum,
        motivo: "Extra / propina",
        appointment_id: turnoInsertado?.id || null,
      }]).then(({ error: errExtra }) => {
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

  // ── Gasto rápido ──
  const cerrarModalGasto = () => {
    setModalGastoVisible(false);
    setTimeout(() => {
      setModalGastoAbierto(false);
      setGastoDescripcion("");
      setGastoMonto("");
      setGastoCategoria("Otros");
      setDragYGasto(0);
    }, 280);
  };

  const onBarraTouchStartGasto = (e) => {
    dragStartYGasto.current = e.touches[0].clientY;
    arrastrandoGasto.current = true;
  };

  const onBarraTouchMoveGasto = (e) => {
    if (!arrastrandoGasto.current || dragStartYGasto.current === null) return;
    const delta = e.touches[0].clientY - dragStartYGasto.current;
    if (delta > 0) setDragYGasto(delta);
  };

  const onBarraTouchEndGasto = () => {
    if (dragYGasto > 110) cerrarModalGasto();
    else setDragYGasto(0);
    dragStartYGasto.current = null;
    arrastrandoGasto.current = false;
  };

  const guardarGasto = async () => {
    if (!gastoMonto || parseFloat(gastoMonto) <= 0) return;
    setGuardandoGasto(true);
    const { error } = await supabase.from("gastos").insert([{
      barber_id: barberIdRef.current,
      descripcion: gastoDescripcion || "Gasto rápido",
      monto: parseFloat(gastoMonto),
      categoria: gastoCategoria,
      fecha: new Date().toISOString().split("T")[0],
    }]);
    if (error) {
      alert("Error: " + error.message);
      setGuardandoGasto(false);
      return;
    }
    setGuardandoGasto(false);
    setGastoExito(true);
    setTimeout(() => {
      setGastoExito(false);
      cerrarModalGasto();
    }, 900);
  };

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t("panel.titulo")}</h1>
          <p className="text-muted-foreground mt-1">{t("panel.subtitulo")}</p>
        </div>

        {barberId && (
          <div className="flex items-center gap-3 p-4 bg-zinc-950 text-white rounded-2xl">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{t("panel.enlaceReservas")}</p>
              <p className="text-zinc-400 text-xs truncate mt-0.5">gbpro.app/reserva/{barberId}</p>
            </div>
            <button
              onClick={copiarEnlace}
              className="flex items-center gap-2 bg-white text-black font-bold text-sm px-4 py-2 rounded-xl shrink-0 hover:bg-zinc-100 transition-colors active:scale-95"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? t("panel.copiado") : t("panel.copiar")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {[
            { label: t("panel.turnosHoy"), value: loading ? "..." : turnosHoy },
            { label: t("panel.ingresosHoy"), value: loading ? "..." : `$${ingresosHoy}` },
          ].map((m, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4 md:p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-3xl font-black">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Turnos de hoy */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">{t("panel.turnosDeHoy")}</CardTitle>
            <a href="/dashboard/agenda">
              <Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 h-9 px-4 flex items-center gap-1.5">
                <Plus size={13} strokeWidth={2.5} /> {t("panel.nuevoTurno")}
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">{t("panel.cargando")}</div>
            ) : turnosListaHoy.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                {t("panel.sinTurnos")}
              </div>
            ) : (
              <div className="space-y-2">
                {turnosListaHoy.map((appt) => {
                  const fecha = new Date(appt.start_time);
                  const status = appt.status || "pendiente";
                  const s = getStatusStyle(status);
                  return (
                    <div key={appt.id} className={`group relative flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-xl border gap-3 transition-all ${s.border}`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${status === "completado" ? "bg-green-500" : status === "falto" ? "bg-red-400" : "bg-zinc-900"}`} />
                      <div className="pl-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base truncate">{appt.client_name}</p>
                          {status !== "pendiente" && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>{s.texto}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{appt.services?.name}</p>
                      </div>
                      <div className="flex items-center gap-3 pl-2 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                        <div className="text-left sm:text-right shrink-0">
                          <p className="font-black text-lg">{fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          {appt.services?.price !== undefined && (
                            <p className={`text-sm font-bold ${status === "falto" ? "text-red-400 line-through" : "text-zinc-700"}`}>${appt.services.price}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          {status === "pendiente" && (
                            <>
                              <Button size="sm" className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white active:scale-95" onClick={() => handleCompletar(appt)}>
                                <Check size={14} strokeWidth={2.5} />
                              </Button>
                              <Button size="sm" className="h-9 w-9 p-0 bg-red-500 hover:bg-red-600 text-white active:scale-95" onClick={() => handleCambiarStatus(appt.id, "falto")}>
                                <X size={14} strokeWidth={2.5} />
                              </Button>
                            </>
                          )}
                          {status !== "pendiente" && (
                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 active:scale-95" onClick={() => handleCambiarStatus(appt.id, "pendiente")}>
                              <RotateCcw size={13} strokeWidth={2} />
                            </Button>
                          )}
                          <a href="/dashboard/agenda">
                            <Button size="sm" variant="outline" className="h-9 w-9 p-0 active:scale-95">
                              <Pencil size={13} strokeWidth={2} />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipo — solo owners PRO */}
        {esOwner && plan === "PRO" && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">{t("panel.miEquipo")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{t("panel.rendimientoMes")}</p>
              </div>
              <a href="/dashboard/equipo">
                <Button variant="outline" size="sm" className="font-bold h-9">{t("panel.gestionar")}</Button>
              </a>
            </CardHeader>
            <CardContent>
              {loadingEquipo ? (
                <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">{t("panel.cargandoEquipo")}</div>
              ) : equipo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl space-y-3">
                  <p className="font-bold">{t("panel.sinProfesionales")}</p>
                  <a href="/dashboard/equipo"><Button size="sm" className="font-bold bg-zinc-950 text-white hover:bg-zinc-800">{t("panel.agregarProfesional")}</Button></a>
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
                            {miembro.rol === "owner" && <span className="text-xs bg-zinc-950 text-white px-2 py-0.5 rounded-full font-bold">{t("panel.dueno")}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{t("panel.hoy")}: {miembro.turnosHoy} {miembro.turnosHoy === 1 ? t("panel.turno") : t("panel.turnos")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">${miembro.ingresosMes}</p>
                        <p className="text-xs text-muted-foreground">{miembro.turnosMes} {t("panel.turnos")} {t("panel.esteMes")}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 text-white mt-2">
                    <p className="font-bold text-sm">{t("panel.totalEquipoEsteMes")}</p>
                    <div className="text-right">
                      <p className="font-black text-xl">${equipo.reduce((s, m) => s + m.ingresosMes, 0)}</p>
                      <p className="text-xs text-zinc-400">{equipo.reduce((s, m) => s + m.turnosMes, 0)} {t("panel.turnos")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── MODAL venta de producto ── */}
      {modalVenta && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
            <div className="bg-zinc-950 p-6 text-white">
              <h2 className="text-xl font-black">{t("panel.turnoCompletado")}</h2>
              <p className="text-zinc-400 text-sm mt-1">{turnoCompletado?.client_name} — {t("panel.vendisteProd")}</p>
            </div>
            <div className="p-6 space-y-4">
              {productosDisponibles.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">{t("panel.sinStock")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {productosDisponibles.map((p) => (
                    <button key={p.id} onClick={() => registrarVentaProducto(p)} disabled={vendiendo || p.stock === 0}
                      className="flex flex-col items-center p-4 rounded-xl border border-border/50 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all text-center disabled:opacity-40 active:scale-95">
                      <ShoppingBag size={22} className="mb-2 opacity-60" />
                      <p className="font-bold text-sm">{p.nombre}</p>
                      <p className="font-black text-lg">${p.precio}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("panel.stock")}: {p.stock}</p>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full font-bold h-12" onClick={() => { setModalVenta(false); setTurnoCompletado(null); }}>
                {t("panel.noCerrar")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTONES FLOTANTES ── */}
      <button
        onClick={() => setModalGastoAbierto(true)}
        className="fixed bottom-24 md:bottom-8 right-24 md:right-28 z-40 w-14 h-14 rounded-full bg-white border-2 border-zinc-200 text-zinc-700 shadow-xl flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-50 hover:scale-105"
        aria-label="Registrar gasto rápido"
      >
        <Minus size={22} strokeWidth={2.5} />
      </button>

      <button
        onClick={() => setModalRapidoAbierto(true)}
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-full bg-zinc-950 text-white shadow-xl flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800 hover:scale-105"
        aria-label="Registrar turno rápido"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ── MODAL turno rápido ── */}
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
              transform: modalVisible ? `translateY(${dragY}px)` : "translateY(120%)",
              transition: arrastrando.current ? "none" : "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="sm:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
              onTouchStart={onBarraTouchStart}
              onTouchMove={onBarraTouchMove}
              onTouchEnd={onBarraTouchEnd}
              style={{ touchAction: "none" }}
            >
              <div className="w-10 h-1.5 rounded-full bg-zinc-300" />
            </div>

            <div className="bg-zinc-950 px-6 py-5 text-white flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black">{t("panel.registroRapido")}</h2>
                <p className="text-zinc-400 text-sm mt-1">{t("panel.clientesCalle")}</p>
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
                <p className="font-bold text-lg">{t("panel.registrado")}</p>
                <p className="text-sm text-muted-foreground">{t("panel.ingresosActualizado")}</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("panel.servicio")}</p>
                    {serviciosDisponibles.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg text-center">{t("panel.sinServicios")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {serviciosDisponibles.map((s) => (
                          <button key={s.id} onClick={() => setServicioRapidoId(s.id)}
                            className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${servicioRapidoId === s.id ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"}`}>
                            <p className="font-bold text-sm leading-tight">{s.name}</p>
                            <p className={`text-xs mt-0.5 ${servicioRapidoId === s.id ? "text-zinc-300" : "text-muted-foreground"}`}>${s.price}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {productosDisponibles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag size={12} /> {t("panel.productoVendido")} <span className="font-normal">{t("panel.opcional")}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setProductoRapidoId(null)}
                          className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all active:scale-95 ${productoRapidoId === null ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"}`}>
                          {t("panel.ninguno")}
                        </button>
                        {productosDisponibles.map((p) => (
                          <button key={p.id} onClick={() => setProductoRapidoId(p.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${productoRapidoId === p.id ? "bg-zinc-950 text-white border-zinc-950" : "bg-muted/20 border-border/50 hover:bg-muted/40"}`}>
                            <p className="font-bold text-xs leading-tight truncate">{p.nombre}</p>
                            <p className={`text-xs ${productoRapidoId === p.id ? "text-zinc-300" : "text-muted-foreground"}`}>${p.precio}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={12} /> {t("panel.extraPropina")} <span className="font-normal">{t("panel.opcional")}</span>
                    </p>
                    <input type="number" inputMode="decimal" placeholder="0" value={extraRapido} onChange={(e) => setExtraRapido(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-muted/30 px-4 text-base font-bold" />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border/50 bg-white shrink-0">
                  <Button className="w-full h-12 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 transition-transform"
                    disabled={!servicioRapidoId || guardandoRapido} onClick={registrarTurnoRapido}>
                    {guardandoRapido ? t("panel.guardando") : t("panel.registrar")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL gasto rápido ── */}
      {modalGastoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{
            backgroundColor: modalGastoVisible ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            backdropFilter: modalGastoVisible ? "blur(6px)" : "blur(0px)",
            WebkitBackdropFilter: modalGastoVisible ? "blur(6px)" : "blur(0px)",
            transition: "background-color 0.3s ease, backdrop-filter 0.3s ease",
          }}
          onClick={cerrarModalGasto}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm flex flex-col sm:mb-0"
            style={{
              maxHeight: "75vh",
              marginBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
              transform: modalGastoVisible ? `translateY(${dragYGasto}px)` : "translateY(120%)",
              transition: arrastrandoGasto.current ? "none" : "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="sm:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
              onTouchStart={onBarraTouchStartGasto}
              onTouchMove={onBarraTouchMoveGasto}
              onTouchEnd={onBarraTouchEndGasto}
              style={{ touchAction: "none" }}
            >
              <div className="w-10 h-1.5 rounded-full bg-zinc-300" />
            </div>

            <div className="bg-zinc-950 px-6 py-5 text-white flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black">{t("panel.gastoRapido")}</h2>
                <p className="text-zinc-400 text-sm mt-1">{t("panel.gastoSubtitulo")}</p>
              </div>
              <button onClick={cerrarModalGasto} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
                <X size={20} />
              </button>
            </div>

            {gastoExito ? (
              <div className="p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center animate-[ping_0.5s_ease-out_1]">
                  <Check size={26} className="text-red-600" strokeWidth={2.5} />
                </div>
                <p className="font-bold text-lg">{t("panel.registrado")}</p>
                <p className="text-sm text-muted-foreground">{t("panel.gastoGuardado")}</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("panel.descripcion")} <span className="font-normal normal-case">{t("panel.opcional")}</span></Label>
                    <Input
                      placeholder={t("panel.descripcion")}
                      value={gastoDescripcion}
                      onChange={(e) => setGastoDescripcion(e.target.value)}
                      className="h-12 text-base bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("panel.categoria")}</Label>
                    <select
                      className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-base"
                      value={gastoCategoria}
                      onChange={(e) => setGastoCategoria(e.target.value)}
                    >
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("panel.monto")}</Label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={gastoMonto}
                      onChange={(e) => setGastoMonto(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-muted/30 px-4 text-base font-bold"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border/50 bg-white shrink-0">
                  <Button
                    className="w-full h-12 font-bold text-base bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95 transition-transform"
                    disabled={!gastoMonto || parseFloat(gastoMonto) <= 0 || guardandoGasto}
                    onClick={guardarGasto}
                  >
                    {guardandoGasto ? t("panel.guardando") : t("panel.registrarGasto")}
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
