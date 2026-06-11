"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const pathname = usePathname(); 

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const getLinkClasses = (path) => {
    const isActive = pathname === path;
    return isActive
      ? "px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-bold flex items-center gap-3 transition-colors" 
      : "px-4 py-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground font-medium flex items-center gap-3 transition-colors"; 
  };

  return (
    // Agregamos overflow-y-auto para que se pueda scrollear si hay muchos botones
    <aside className="w-64 border-r border-border/40 bg-muted/20 min-h-[calc(100vh-130px)] hidden md:flex flex-col justify-between overflow-y-auto relative">
      
      <div className="p-6 space-y-8">
        
        {/* 1. SECCIÓN DE GESTIÓN (El día a día) */}
        <div>
          <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Gestión Diaria
          </h2>
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard" className={getLinkClasses("/dashboard")}>
              <span className="text-lg">📊</span> Panel General
            </Link>
            <Link href="/dashboard/agenda" className={getLinkClasses("/dashboard/agenda")}>
              <span className="text-lg">📅</span> Agenda
            </Link>
            <Link href="/dashboard/clientes" className={getLinkClasses("/dashboard/clientes")}>
              <span className="text-lg">👥</span> Directorio CRM
            </Link>
            <Link href="/dashboard/services" className={getLinkClasses("/dashboard/services")}>
              <span className="text-lg">✂️</span> Servicios
            </Link>
          </nav>
        </div>

        {/* 2. SECCIÓN DE CRECIMIENTO (Aquí es donde ven el valor del plan PRO) */}
        <div>
          <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
            Crecimiento <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm">PRO</span>
          </h2>
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard/mapa" className={getLinkClasses("/dashboard/mapa")}>
              <span className="text-lg">🗺️</span> Mapa VIP
            </Link>
            <Link href="/dashboard/marketing" className={getLinkClasses("/dashboard/marketing")}>
              <span className="text-lg">🚀</span> Marketing WhatsApp
            </Link>
            <Link href="/dashboard/tienda" className={getLinkClasses("/dashboard/tienda")}>
              <span className="text-lg">🛒</span> Tienda Online
            </Link>
            <Link href="/dashboard/fidelidad" className={getLinkClasses("/dashboard/fidelidad")}>
              <span className="text-lg">⭐</span> Puntos y Fidelidad
            </Link>
          </nav>
        </div>

        {/* 3. SECCIÓN ADMINISTRATIVA Y NEGOCIO */}
        <div>
          <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Administración
          </h2>
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard/finanzas" className={getLinkClasses("/dashboard/finanzas")}>
              <span className="text-lg">💰</span> Finanzas e Ingresos
            </Link>
            <Link href="/dashboard/operaciones" className={getLinkClasses("/dashboard/operaciones")}>
              <span className="text-lg">⚙️</span> Operaciones
            </Link>
            <Link href="/dashboard/suscripcion" className={getLinkClasses("/dashboard/suscripcion")}>
              <span className="text-lg">💎</span> Mi Suscripción
            </Link>
          </nav>
        </div>

      </div>

      {/* BOTÓN DE SALIDA (Fijo abajo) */}
      <div className="p-6 border-t border-border/40 sticky bottom-0 bg-muted/20 backdrop-blur-md">
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive font-medium flex items-center gap-3 transition-colors text-left"
        >
          <span className="text-lg">🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}