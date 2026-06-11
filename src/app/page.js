"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Users, MessageSquare, BarChart2, Map,
  Star, ShoppingBag, Users2, Bell, Check, Scissors
} from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Agenda inteligente", desc: "Tus clientes reservan solos con tu enlace. Tú solo apareces y cortas. Sin llamadas, sin mensajes." },
  { icon: Users, title: "CRM de clientes", desc: "Guarda el historial, notas y preferencias de cada cliente. Construye relaciones que duran." },
  { icon: MessageSquare, title: "Marketing por WhatsApp", desc: "Reactiva clientes que no vienen. Envía campañas masivas en segundos directamente a sus celulares." },
  { icon: BarChart2, title: "Finanzas en tiempo real", desc: "Ve cuánto ganaste hoy, esta semana, este mes. Toma decisiones con datos reales." },
  { icon: Map, title: "Mapa VIP", desc: "Aparece en el mapa donde los clientes buscan barberos. Más visibilidad, más clientes nuevos." },
  { icon: Star, title: "Sistema de fidelidad", desc: "Puntos automáticos por cada visita. Tus mejores clientes se quedan y vuelven siempre." },
  { icon: ShoppingBag, title: "Tienda Online", desc: "Vende tus productos físicos — pomadas, aceites, ceras — directamente desde la app." },
  { icon: Users2, title: "Gestión de equipo", desc: "Administra múltiples barberos desde un solo panel. Cada uno con su propio acceso." },
  { icon: Bell, title: "Reservas automáticas 24/7", desc: "Tu agenda nunca duerme. Los clientes reservan a cualquier hora." },
];

const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    precio: "$0",
    periodo: "/mes",
    descripcion: "Para probar y arrancar.",
    features: ["Agenda digital", "Enlace de reservas", "Hasta 50 turnos por mes", "CRM básico de clientes"],
    cta: "Empezar gratis",
    href: "/register",
    destacado: false,
  },
  {
    id: "pro",
    nombre: "PRO",
    precio: "$12.99",
    periodo: "USD/mes",
    descripcion: "Para el barbero independiente.",
    features: ["Turnos ilimitados sin comisiones", "Recordatorios automáticos", "CRM completo con historial", "Reportes financieros", "Marketing masivo por WhatsApp", "Mapa VIP", "Sistema de puntos y fidelidad", "Tienda Online"],
    cta: "Activar PRO",
    href: "/register",
    destacado: true,
    badge: "Más popular",
  },
  {
    id: "boss",
    nombre: "BOSS",
    precio: "$24.99",
    periodo: "USD/mes",
    descripcion: "Para barberías con equipo.",
    features: ["Todo lo del plan PRO", "Hasta 5 barberos", "Dashboard del equipo", "Estadísticas por barbero", "Acceso de empleados gratis", "Selector de barbero en reservas", "Control total del negocio"],
    cta: "Activar BOSS",
    href: "/register",
    destacado: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── HERO ── */}
      <section className="bg-zinc-950 text-white min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20 space-y-8">
        <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
          <Scissors size={12} className="text-white" />
          <span className="text-xs font-black uppercase tracking-widest">El sistema operativo de la barbería</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none max-w-4xl">
          Gestiona tu barbería.<br />
          <span className="text-zinc-400">Orden. Libertad. Progreso.</span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-xl font-medium">
          Agenda, clientes, marketing y pagos — todo en un solo lugar. Desde $0/mes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Link href="/register">
            <Button className="h-14 px-10 text-lg font-black bg-white text-black hover:bg-zinc-200 shadow-xl">
              Crear cuenta gratis
            </Button>
          </Link>
          <Link href="/mapa">
            <Button className="h-14 px-10 text-lg font-bold bg-transparent border border-white/30 text-white hover:bg-white/10">
              Ver barberías del mapa
            </Button>
          </Link>
        </div>

        <p className="text-zinc-600 text-sm">Sin tarjeta de crédito. Sin contratos.</p>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border/40 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: "∞", label: "Turnos ilimitados en PRO" },
            { number: "$0", label: "Para empezar" },
            { number: "24/7", label: "Reservas automáticas" },
            { number: "1 click", label: "Para contactar clientes" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-black">{s.number}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black tracking-tight">Todo lo que necesitas</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Construido para barberos reales que quieren enfocarse en cortar, no en administrar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center">
                      <Icon size={18} strokeWidth={1.8} className="text-white" />
                    </div>
                    <h3 className="font-black text-lg">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section className="py-20 px-6 bg-zinc-50 border-y border-border/40">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black tracking-tight">Precios simples y honestos</h2>
            <p className="text-muted-foreground text-lg">Sin comisiones por turno. Sin sorpresas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANES.map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${plan.destacado ? "bg-zinc-950 text-white border-zinc-800 shadow-2xl" : "bg-white border-border/50 shadow-sm"}`}>
                {plan.badge && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-white text-black text-xs font-black tracking-widest uppercase py-1.5 px-6 rounded-full shadow border border-border/50">{plan.badge}</span>
                  </div>
                )}
                <div className={plan.badge ? "pt-4" : ""}>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>{plan.nombre}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.precio}</span>
                    <span className={`text-sm ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>{plan.periodo}</span>
                  </div>
                  <p className={`text-sm mt-1 ${plan.destacado ? "text-zinc-400" : "text-muted-foreground"}`}>{plan.descripcion}</p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((item, i) => (
                    <li key={i} className={`flex items-center gap-2.5 text-sm ${plan.destacado ? "text-zinc-300" : "text-muted-foreground"}`}>
                      <Check size={14} strokeWidth={2.5} className={plan.destacado ? "text-white shrink-0" : "text-foreground shrink-0"} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button className={`w-full h-12 font-bold ${plan.destacado ? "bg-white text-black hover:bg-zinc-200" : "bg-transparent border border-border text-foreground hover:bg-muted"}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center p-4 bg-white rounded-xl border border-border/50 max-w-md mx-auto">
            <p className="text-sm font-bold">¿Tienes un código de descuento?</p>
            <p className="text-xs text-muted-foreground mt-1">Ingrésalo al momento de pagar en MercadoPago.</p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 text-center space-y-8 bg-zinc-950 text-white">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl mx-auto">
          Tu barbería merece trabajar como una empresa
        </h2>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Únete a los barberos que ya automatizaron su negocio y se enfocaron en lo que importa — cortar.
        </p>
        <Link href="/register">
          <Button className="h-14 px-12 text-lg font-black bg-white text-black hover:bg-zinc-200 shadow-xl">
            Crear cuenta gratis
          </Button>
        </Link>
        <p className="text-zinc-600 text-sm">Sin tarjeta. Sin contratos. Cancela cuando quieras.</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-10 px-6 text-center space-y-2">
        <p className="font-black text-xl">GB PRO</p>
        <p className="text-sm text-muted-foreground">El sistema operativo de las barberías. © 2026</p>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-2">
          <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
          <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
          <Link href="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
        </div>
      </footer>

    </div>
  );
}