"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSecretoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberShops, setBarberShops] = useState([]);

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

    if (data) setBarberShops(data);
    setLoading(false);
  };

  const totalBarberias = barberShops.length;
  const totalPro = barberShops.filter(b => b.plan === "PRO" || b.plan === "BOSS").length;

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

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-950 text-white border-none">
          <CardContent className="p-6">
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Total barberías</p>
            <p className="text-5xl font-black">{totalBarberias}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Plan PRO / BOSS</p>
            <p className="text-5xl font-black">{totalPro}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
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