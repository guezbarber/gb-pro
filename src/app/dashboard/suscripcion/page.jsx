"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Tag } from "lucide-react";

const MP_URLS = {
  pro: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=a29a41c5a8224f9ea26a3e18f33b37c3",
  boss: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=cbf30b554ad042f6b7005c9780f07038",
  amigo: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=2ba982ab93624f4bad6fe5d0d0155603",
  mejor: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=fe721afa5b8d468b906c54e456b8dec3",
};

const CODIGOS = {
  AMIGO: { url: MP_URLS.amigo, descuento: "50% off", plan: "pro" },
  MEJOR: { url: MP_URLS.mejor, descuento: "100% gratis", plan: "pro" },
};

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "$0",
    periodo: "/mes",
    descripcion: "Para arrancar y probar.",
    features: [
      { texto: "Agenda digital", incluido: true },
      { texto: "Enlace de reservas", incluido: true },
      { texto: "50 turnos por mes", incluido: true },
      { texto: "Turnos ilimitados", incluido: false },
      { texto: "CRM de clientes", incluido: false },
      { texto: "Marketing y fidelidad", incluido: false },
      { texto: "Tienda online", incluido: false },
      { texto: "Equipo de profesionales", incluido: false },
    ],
    cta: "Plan actual",
    ctaDisabled: true,
    mpUrl: null,
  },
  {
    id: "pro",
    nombre: "PRO",
    precio: "$12.99",
    periodo: "USD/mes",
    descripcion: "Para el profesional independiente.",
    destacado: true,
    features: [
      { texto: "Todo lo del plan Básico", incluido: true },
      { texto: "Turnos ilimitados", incluido: true },
      { texto: "CRM de clientes", incluido: true },
      { texto: "Finanzas y reportes", incluido: true },
      { texto: "Marketing y fidelidad", incluido: true },
      { texto: "Tienda online", incluido: true },
      { texto: "Mapa VIP", incluido: true },
      { texto: "Equipo de profesionales", incluido: false },
    ],
    cta: "Suscribirse con MercadoPago",
    mpUrl: MP_URLS.pro,
  },
  {
    id: "boss",
    nombre: "BOSS",
    precio: "$24.99",
    periodo: "USD/mes",
    descripcion: "Para negocios con equipo.",
    features: [
      { texto: "Todo lo del plan PRO", incluido: true },
      { texto: "Hasta 5 profesionales", incluido: true },
      { texto: "Dashboard del equipo", incluido: true },
      { texto: "Estadísticas por profesional", incluido: true },
      { texto: "Acceso de empleados gratis", incluido: true },
      { texto: "Selector de profesional en reservas", incluido: true },
      { texto: "Control total del negocio", incluido: true },
      { texto: "", incluido: null },
    ],
    cta: "Suscribirse con MercadoPago",
    mpUrl: MP_URLS.boss,
  },
];

export default function SuscripcionPage() {
  const [planActual, setPlanActual] = useState("basico");
  const [loading, setLoading] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState(null);
  const [errorCodigo, setErrorCodigo] = useState("");

  useEffect(() => {
    const cargarPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar en barber_settings
      const { data: settings } = await supabase
        .from("barber_settings")
        .select("plan")
        .eq("barber_id", user.id)
        .single();

      // Buscar también en barbershops por si acaso
      const { data: bshop } = await supabase
        .from("barbershops")
        .select("plan")
        .eq("owner_id", user.id)
        .single();

      const plan = settings?.plan || bshop?.plan || "basico";
      setPlanActual(plan.toLowerCase());
    };
    cargarPlan();
  }, []);

  const aplicarCodigo = () => {
    const codigoUpper = codigo.trim().toUpperCase();
    if (CODIGOS[codigoUpper]) {
      setCodigoAplicado({ ...CODIGOS[codigoUpper], codigo: codigoUpper });
      setErrorCodigo("");
    } else {
      setErrorCodigo("Código inválido. Verificá con quien te lo dio.");
      setCodigoAplicado(null);
    }
  };

  const handleSubscribe = (plan) => {
    if (plan.ctaDisabled) return;
    let url = plan.mpUrl;
    if (codigoAplicado && plan.id === codigoAplicado.plan) url = codigoAplicado.url;
    if (!url) { alert("Este plan estará disponible muy pronto."); return; }
    setLoading(plan.id);
    window.location.href = url;
  };

  const esActual = (planId) => planActual === planId;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Planes</h1>
        <p className="text-muted-foreground">Sin comisiones. Sin sorpresas. Cancela cuando quieras.</p>
      </div>

      {/* Plan activo */}
      {planActual !== "basico" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <Check size={16} className="text-green-600 shrink-0" />
          <p className="text-sm font-bold text-green-800">
            Estás en el plan <span className="uppercase">{planActual}</span> — activo
          </p>
        </div>
      )}

      {/* Código de descuento */}
      <div className="p-5 rounded-xl border border-border/50 bg-muted/20 space-y-3">
        <div className="flex items-center gap-2">
          <Tag size={15} strokeWidth={1.8} className="text-muted-foreground" />
          <p className="font-bold text-sm">¿Tienes un código de descuento?</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ingresa tu código"
            className="h-11 text-base bg-background uppercase tracking-widest font-bold max-w-xs"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              setCodigoAplicado(null);
              setErrorCodigo("");
            }}
            onKeyDown={(e) => { if (e.key === "Enter") aplicarCodigo(); }}
          />
          <Button variant="outline" className="h-11 font-bold px-6" onClick={aplicarCodigo} disabled={!codigo.trim()}>
            Aplicar
          </Button>
        </div>
        {errorCodigo && <p className="text-sm text-red-500 font-medium">{errorCodigo}</p>}
        {codigoAplicado && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Check size={14} className="text-green-600 shrink-0" />
            <p className="text-sm font-bold text-green-800">
              Código aplicado — {codigoAplicado.descuento} en el plan PRO
            </p>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-6 flex flex-col gap-5 transition-all ${
              plan.destacado
                ? "bg-zinc-950 text-white border-zinc-800"
                : esActual(plan.id)
                  ? "bg-background border-zinc-900 ring-2 ring-zinc-900"
                  : "bg-background border-border/50"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-xs font-black uppercase tracking-widest ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>
                  {plan.nombre}
                </p>
                {esActual(plan.id) && plan.id !== "basico" && (
                  <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">Actual</span>
                )}
                {codigoAplicado && plan.id === codigoAplicado.plan && (
                  <span className="text-[10px] font-black bg-green-600 text-white px-2 py-0.5 rounded-full">
                    {codigoAplicado.descuento}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                {codigoAplicado && plan.id === codigoAplicado.plan ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black line-through opacity-40">{plan.precio}</span>
                    <span className="text-3xl font-black text-green-400">
                      {codigoAplicado.descuento === "100% gratis" ? "Gratis" : "50% off"}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-black">{plan.precio}</span>
                )}
                {!codigoAplicado && plan.precio !== "$0" && (
                  <span className={`text-sm ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>
                    {plan.periodo}
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>
                {plan.descripcion}
              </p>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((f, i) => {
                if (f.incluido === null) return <li key={i} className="h-5" />;
                return (
                  <li key={i} className={`flex items-center gap-2.5 text-sm ${
                    f.incluido
                      ? plan.destacado ? "text-white" : "text-foreground"
                      : plan.destacado ? "text-zinc-600" : "text-muted-foreground/40 line-through"
                  }`}>
                    {f.incluido
                      ? <Check size={14} strokeWidth={2.5} className={`shrink-0 ${plan.destacado ? "text-white" : "text-foreground"}`} />
                      : <X size={14} strokeWidth={2} className="shrink-0 opacity-40" />
                    }
                    {f.texto}
                  </li>
                );
              })}
            </ul>

            <Button
              className={`w-full h-11 font-bold ${
                plan.destacado
                  ? "bg-white text-black hover:bg-zinc-100"
                  : esActual(plan.id) && plan.id !== "basico"
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : plan.ctaDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : ""
              }`}
              variant={plan.destacado || (esActual(plan.id) && plan.id !== "basico") ? "default" : "outline"}
              onClick={() => handleSubscribe(plan)}
              disabled={plan.ctaDisabled || loading === plan.id}
            >
              {loading === plan.id
                ? "Redirigiendo..."
                : esActual(plan.id) && plan.id !== "basico"
                  ? "Plan activo"
                  : codigoAplicado && plan.id === codigoAplicado.plan
                    ? "Activar con descuento"
                    : plan.cta
              }
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground">Pago seguro procesado por MercadoPago. Cancela cuando quieras.</p>
        <p className="text-xs text-muted-foreground">
          ¿Dudas? <a href="mailto:soporte@gbpro.app" className="font-bold hover:text-foreground transition-colors">soporte@gbpro.app</a>
        </p>
      </div>

    </div>
  );
}