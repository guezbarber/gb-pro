"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";

function getHoyStr() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
}

export default function KioscoPage({ params }) {
  const { id: barberId } = use(params);

  const [paso, setPaso] = useState(1); // 1=servicio, 2=nombre, 3=confirmado
  const [config, setConfig] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [servicioElegido, setServicioElegido] = useState(null);
  const [nombre, setNombre] = useState("");
  const [tiempoEspera, setTiempoEspera] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);

  // Auto-reset a pantalla inicial después de 12 segundos en paso 3
  useEffect(() => {
    if (paso === 3) {
      const timer = setTimeout(() => {
        setPaso(1);
        setServicioElegido(null);
        setNombre("");
        setTiempoEspera(0);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [paso]);

  useEffect(() => {
    if (barberId) cargarDatos();
  }, [barberId]);

  const cargarDatos = async () => {
    const { data: cfg, error } = await supabase
      .from("barber_settings")
      .select("barber_name, plan, open_time, close_time")
      .eq("barber_id", barberId)
      .single();

    if (error || !cfg) {
      setErrorCarga("No se encontró esta barbería.");
      return;
    }
    setConfig(cfg);

    const { data: svcs } = await supabase
      .from("services")
      .select("*")
      .eq("barber_id", barberId)
      .order("price", { ascending: true });
    if (svcs) setServicios(svcs);
  };

  const calcularTiempoEspera = async () => {
    // Contar turnos pendientes desde ahora
    const ahora = new Date();
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const { data: turnosPendientes } = await supabase
      .from("appointments")
      .select("services(duration_minutes)")
      .eq("barber_id", barberId)
      .eq("status", "pendiente")
      .gte("start_time", ahora.toISOString())
      .lte("start_time", finDia.toISOString());

    if (!turnosPendientes || turnosPendientes.length === 0) return 0;

    const totalMinutos = turnosPendientes.reduce(
      (sum, t) => sum + (t.services?.duration_minutes || 30),
      0
    );
    return totalMinutos;
  };

  const confirmarWalkIn = async () => {
    if (!nombre.trim() || !servicioElegido) return;
    setGuardando(true);

    // Calcular tiempo de espera antes de insertar
    const espera = await calcularTiempoEspera();
    setTiempoEspera(espera);

    // Insertar como turno ahora mismo
    const ahora = new Date();
    // Si hay espera, el turno empieza al final de la cola
    const startTime = new Date(ahora.getTime() + espera * 60000).toISOString();

    const { error } = await supabase.from("appointments").insert([{
      barber_id: barberId,
      service_id: servicioElegido.id,
      client_name: nombre.trim(),
      client_phone: null,
      start_time: startTime,
      status: "pendiente",
    }]);

    if (!error) {
      setPaso(3);
    } else {
      alert("Error al registrar: " + error.message);
    }
    setGuardando(false);
  };

  if (errorCarga) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <p className="text-red-400 font-bold text-lg">{errorCarga}</p>
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <p className="text-white font-black text-2xl animate-pulse tracking-tighter">GB PRO</p>
    </div>
  );

  const nombreBarberia = config.plan === "PRO" || config.plan === "BOSS"
    ? config.barber_name
    : "GB PRO";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col select-none">

      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{nombreBarberia}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Bienvenido — regístrate para tu turno</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest">Powered by</p>
          <p className="text-white font-black tracking-tighter">GB PRO</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">

        {/* PASO 1 — Elegir servicio */}
        {paso === 1 && (
          <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white tracking-tight">¿Qué servicio quieres?</h2>
              <p className="text-zinc-400 mt-2 text-lg">Toca para seleccionar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {servicios.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setServicioElegido(svc); setPaso(2); }}
                  className="group flex flex-col items-start p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white hover:border-white transition-all active:scale-[0.97] text-left"
                >
                  <p className="font-black text-2xl text-white group-hover:text-zinc-950 transition-colors">
                    {svc.name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-zinc-400 group-hover:text-zinc-600 text-sm transition-colors">
                      {svc.duration_minutes} min
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="font-black text-xl text-white group-hover:text-zinc-950 transition-colors">
                      ${svc.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2 — Nombre */}
        {paso === 2 && (
          <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="text-center">
              <h2 className="text-4xl font-black text-white tracking-tight">¿Cómo te llamas?</h2>
              <p className="text-zinc-400 mt-2 text-lg">Escribe tu nombre para registrarte</p>
            </div>

            {/* Resumen del servicio elegido */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-white font-bold">{servicioElegido?.name}</p>
                <p className="text-zinc-400 text-sm">{servicioElegido?.duration_minutes} min</p>
              </div>
              <p className="text-white font-black text-xl">${servicioElegido?.price}</p>
            </div>

            {/* Input de nombre — grande para tablet */}
            <input
              type="text"
              placeholder="Tu nombre..."
              autoFocus
              className="w-full h-20 text-3xl font-bold bg-white/10 border border-white/20 rounded-2xl px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && nombre.trim()) confirmarWalkIn(); }}
            />

            <div className="flex gap-4">
              <button
                onClick={() => { setPaso(1); setServicioElegido(null); setNombre(""); }}
                className="flex-1 h-16 rounded-2xl border border-white/20 text-zinc-400 font-bold text-lg hover:bg-white/5 transition-all active:scale-[0.97]"
              >
                Volver
              </button>
              <button
                onClick={confirmarWalkIn}
                disabled={!nombre.trim() || guardando}
                className="flex-1 h-16 rounded-2xl bg-white text-zinc-950 font-black text-xl hover:bg-zinc-100 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {guardando ? "Registrando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Confirmado */}
        {paso === 3 && (
          <div className="w-full max-w-lg text-center space-y-8 animate-in zoom-in-95">
            {/* Check */}
            <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <div>
              <h2 className="text-5xl font-black text-white tracking-tight">¡Listo, {nombre.trim()}!</h2>
              <p className="text-zinc-400 mt-3 text-xl">
                {servicioElegido?.name} — ${servicioElegido?.price}
              </p>
            </div>

            {/* Tiempo de espera */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              {tiempoEspera === 0 ? (
                <>
                  <p className="text-5xl font-black text-white">Ahora</p>
                  <p className="text-zinc-400 mt-2">Puedes pasar directamente</p>
                </>
              ) : (
                <>
                  <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Tiempo de espera</p>
                  <p className="text-6xl font-black text-white">~{tiempoEspera} min</p>
                  <p className="text-zinc-400 mt-2">Te llamamos cuando sea tu turno</p>
                </>
              )}
            </div>

            {/* Barra de progreso para el auto-reset */}
            <div className="space-y-2">
              <p className="text-zinc-600 text-sm">Esta pantalla se reinicia automáticamente</p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-1 bg-white/40 rounded-full animate-[shrink_12s_linear_forwards]"
                  style={{ animationName: "shrink", width: "100%" }} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CSS para la animación de la barra */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}