"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, Users, Scissors, DollarSign,
  Users2, Map, Megaphone, ShoppingBag, Star, MessageSquare,
  Settings, CreditCard, Link2, LogOut, Menu, X
} from "lucide-react";
import { useIdioma } from "@/hooks/useIdioma";
import { IdiomaProvider } from "@/lib/IdiomaContext";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const BANDERAS = { es: "🇪🇸", en: "🇺🇸", pt: "🇧🇷" };
const NOMBRES_IDIOMA = { es: "ES", en: "EN", pt: "PT" };

export default function DashboardLayout({ children }) {
  return (
    <IdiomaProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </IdiomaProvider>
  );
}

function DashboardLayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [barberId, setBarberId] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { idioma, t, cambiarIdioma, listo } = useIdioma();
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setBarberId(user.id);
        registrarPush(user.id);
      }
    };
    checkUser();
  }, [router]);

  const registrarPush = async (userId) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const { data: settings } = await supabase
        .from("barber_settings")
        .select("notif_push")
        .eq("barber_id", userId)
        .single();

      if (settings?.notif_push === false) return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subExistente = await reg.pushManager.getSubscription();
      if (subExistente) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barber_id: userId, subscription: sub }),
      });
    } catch (err) {
      console.error("Error registrando push:", err);
    }
  };

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Cierra el selector de idioma al cambiar de página
  useEffect(() => {
    setSelectorAbierto(false);
  }, [pathname]);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const menuDiario = [
    { name: t("menu.panel"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("menu.agenda"), href: "/dashboard/agenda", icon: Calendar },
    { name: t("menu.clientes"), href: "/dashboard/clientes", icon: Users },
    { name: t("menu.servicios"), href: "/dashboard/services", icon: Scissors },
    { name: t("menu.finanzas"), href: "/dashboard/finanzas", icon: DollarSign },
  ];

  const menuHerramientas = [
    { name: t("menu.miEquipo"), href: "/dashboard/equipo", icon: Users2 },
    { name: t("menu.mapaVip"), href: "/dashboard/mapa", icon: Map },
    { name: t("menu.marketing"), href: "/dashboard/marketing", icon: Megaphone },
    { name: t("menu.tienda"), href: "/dashboard/tienda", icon: ShoppingBag },
    { name: t("menu.fidelidad"), href: "/dashboard/fidelidad", icon: Star },
    { name: t("menu.resenas"), href: "/dashboard/resenas", icon: MessageSquare },
  ];

  const navMovilPrincipal = [
    { name: t("menu.panel"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("menu.agenda"), href: "/dashboard/agenda", icon: Calendar },
    { name: t("menu.clientes"), href: "/dashboard/clientes", icon: Users },
    { name: t("menu.finanzas"), href: "/dashboard/finanzas", icon: DollarSign },
  ];

  const navMovilMas = [
    { name: t("menu.servicios"), href: "/dashboard/services", icon: Scissors },
    { name: t("menu.miEquipo"), href: "/dashboard/equipo", icon: Users2 },
    { name: t("menu.mapaVip"), href: "/dashboard/mapa", icon: Map },
    { name: t("menu.marketing"), href: "/dashboard/marketing", icon: Megaphone },
    { name: t("menu.tienda"), href: "/dashboard/tienda", icon: ShoppingBag },
    { name: t("menu.fidelidad"), href: "/dashboard/fidelidad", icon: Star },
    { name: t("menu.resenas"), href: "/dashboard/resenas", icon: MessageSquare },
    { name: t("menu.configuracion"), href: "/dashboard/configuracion", icon: Settings },
    { name: t("menu.suscripcion"), href: "/dashboard/suscripcion", icon: CreditCard },
  ];

  const renderLinks = (items) => {
    return items.map((item) => {
      const isActive = pathname === item.href;
      const Icon = item.icon;
      return (
        <Link key={item.name} href={item.href}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium mb-0.5 ${
            isActive
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
            <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
            {item.name}
          </div>
        </Link>
      );
    });
  };

  // Selector de idioma compacto — disponible en sidebar desktop y header móvil.
  // En móvil (compacto) el menú se abre HACIA ABAJO, pegado al botón.
  // En desktop (sidebar) se abre HACIA ARRIBA porque el botón está al fondo.
  const SelectorIdioma = ({ compacto }) => (
    <div className="relative">
      <button
        onClick={() => setSelectorAbierto(!selectorAbierto)}
        className={compacto
          ? "flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:bg-muted transition-all"
          : "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        }
      >
        {BANDERAS[idioma]} {NOMBRES_IDIOMA[idioma]}
      </button>
      {selectorAbierto && (
        <>
          {/* Capa invisible para cerrar al tocar fuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSelectorAbierto(false)}
          />
          <div className={`absolute z-50 min-w-[110px] bg-white rounded-xl shadow-xl border border-border/50 overflow-hidden ${
            compacto
              ? "right-0 top-full mt-1"
              : "left-0 bottom-full mb-1"
          }`}>
            {Object.keys(BANDERAS).map((cod) => (
              <button
                key={cod}
                onClick={() => { cambiarIdioma(cod); setSelectorAbierto(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-bold text-left hover:bg-muted/30 transition-colors ${idioma === cod ? "bg-muted/20" : ""}`}
              >
                {BANDERAS[cod]} {NOMBRES_IDIOMA[cod]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (!listo) return null;

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col md:flex-row">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex flex-col w-52 bg-card border-r border-border/50 h-screen sticky top-0">
        <div className="px-5 py-4 border-b border-border/50 shrink-0">
          <span className="font-black tracking-tighter text-xl block">GB PRO</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t("menu.diario")}</p>
            {renderLinks(menuDiario)}
          </div>

          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t("menu.herramientas")}</p>
              <span className="bg-zinc-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide">PRO</span>
            </div>
            {renderLinks(menuHerramientas)}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-border/50 space-y-0.5 shrink-0">
          {[
            { name: t("menu.configuracion"), href: "/dashboard/configuracion", icon: Settings },
            { name: t("menu.suscripcion"), href: "/dashboard/suscripcion", icon: CreditCard },
          ].map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={name} href={href}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium mb-0.5 ${
                  isActive
                    ? "bg-foreground text-background"
                    : href === "/dashboard/suscripcion"
                      ? "text-blue-600 hover:bg-blue-50"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
                  {name}
                </div>
              </Link>
            );
          })}

          {barberId && (
            <a href={`/reserva/${barberId}`} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <Link2 size={15} strokeWidth={1.8} />
                {t("menu.miEnlace")}
              </div>
            </a>
          )}

          <SelectorIdioma compacto={false} />

          <button
            onClick={handleCerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut size={15} strokeWidth={1.8} />
            {t("menu.salir")}
          </button>
        </div>
      </aside>

      {/* ── HEADER MÓVIL ── */}
      <header className="md:hidden bg-card border-b border-border/50 px-4 py-3 sticky top-0 z-40 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/90">
        <span className="font-black tracking-tighter text-lg">GB PRO</span>
        <div className="flex items-center gap-2">
          <SelectorIdioma compacto={true} />
          {barberId && (
            <a href={`/reserva/${barberId}`} target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-bold text-muted-foreground hover:bg-muted transition-all">
                <Link2 size={12} />
                {t("menu.miLink")}
              </div>
            </a>
          )}
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={12} />
            {t("menu.salir")}
          </button>
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ── NAV MÓVIL ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch">
          {navMovilPrincipal.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex-1">
                <div className="flex flex-col items-center justify-center py-2.5 px-1 transition-all">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={isActive ? "text-foreground" : "text-muted-foreground"}
                  />
                  <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}

          <button
            className="flex-1 flex flex-col items-center justify-center py-2.5 px-1"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto
              ? <X size={20} strokeWidth={2} className="text-foreground" />
              : <Menu size={20} strokeWidth={1.5} className="text-muted-foreground" />
            }
            <span className={`text-[10px] font-semibold mt-0.5 ${menuAbierto ? "text-foreground" : "text-muted-foreground"}`}>
              {t("menu.mas")}
            </span>
          </button>
        </div>

        {menuAbierto && (
          <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border/50 shadow-[0_-8px_24px_rgba(0,0,0,0.1)] rounded-t-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-1 p-3">
              {navMovilMas.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                      isActive ? "bg-foreground text-background" : "hover:bg-muted"
                    }`}>
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        className={isActive ? "text-background" : "text-muted-foreground"}
                      />
                      <span className={`text-[10px] font-semibold text-center mt-1 leading-tight ${
                        isActive ? "text-background" : "text-muted-foreground"
                      }`}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

    </div>
  );
}