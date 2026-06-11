"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/mapa") ||
    pathname?.startsWith("/reserva") ||
    pathname?.startsWith("/resena") ||
    pathname?.startsWith("/kiosco") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/unirse") ||
    pathname?.startsWith("/empleado") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/nueva-password")
  ) return null;

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background">
      <Link href="/" className="text-xl font-black tracking-tighter">
        GB PRO
      </Link>

      <div className="flex items-center gap-2">
        {user ? (
          <Link href="/dashboard" className="px-4 py-2 bg-zinc-950 text-white font-bold rounded-lg text-sm hover:bg-zinc-800 transition-colors">
            Mi panel
          </Link>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/register" className="px-4 py-2 bg-zinc-950 text-white font-bold rounded-lg text-sm hover:bg-zinc-800 transition-colors">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}