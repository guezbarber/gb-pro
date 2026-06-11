"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Star, X } from "lucide-react";

export default function ResenasPage() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { cargarResenas(); }, []);

  const cargarResenas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBarberId(user.id);
    const { data } = await supabase.from("resenas").select("*").eq("barber_id", user.id).order("created_at", { ascending: false });
    if (data) setResenas(data);
    setLoading(false);
  };

  const eliminarResena = async (id) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    const { error } = await supabase.from("resenas").delete().eq("id", id);
    if (!error) setResenas(prev => prev.filter(r => r.id !== id));
  };

  const copiarEnlace = () => {
    navigator.clipboard.writeText(`https://gb-pro-blue.vercel.app/resena/${barberId}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const promedio = resenas.length > 0
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : "—";

  const distribucion = [5, 4, 3, 2, 1].map(estrella => ({
    estrella,
    cantidad: resenas.filter(r => r.calificacion === estrella).length,
    porcentaje: resenas.length > 0
      ? Math.round((resenas.filter(r => r.calificacion === estrella).length / resenas.length) * 100)
      : 0,
  }));

  const renderEstrellas = (n) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} strokeWidth={0} fill={i < n ? "#fbbf24" : "#e4e4e7"} />
  ));

  const formatearFecha = (iso) => new Date(iso).toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Reseñas</h1>
          <p className="text-muted-foreground mt-1">Lo que dicen tus clientes.</p>
        </div>
        <Button variant="outline" className="font-bold w-full sm:w-auto h-11 flex items-center gap-2" onClick={copiarEnlace}>
          <Link2 size={14} />
          {copiado ? "Copiado" : "Copiar enlace"}
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="text-center shrink-0">
              <p className="text-6xl font-black">{promedio}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {resenas.length > 0 ? renderEstrellas(Math.round(parseFloat(promedio))) : <span className="text-muted-foreground text-sm">—</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{resenas.length} reseñas</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {distribucion.map(({ estrella, cantidad, porcentaje }) => (
                <div key={estrella} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-right font-bold">{estrella}</span>
                  <Star size={10} fill="#fbbf24" strokeWidth={0} />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${porcentaje}%` }} />
                  </div>
                  <span className="w-5 text-muted-foreground text-right">{cantidad}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total reseñas", value: resenas.length },
            { label: "Promedio", value: promedio === "—" ? "—" : `${promedio} / 5` },
            { label: "5 estrellas", value: resenas.filter(r => r.calificacion === 5).length },
            { label: "Con comentario", value: resenas.filter(r => r.comentario).length },
          ].map((m, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-2xl font-black">{loading ? "..." : m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lista */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Todas las reseñas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">Cargando reseñas...</div>
          ) : resenas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-xl space-y-3">
              <Star size={32} className="mx-auto opacity-20" />
              <p className="font-bold">Aún no tienes reseñas</p>
              <p>Comparte tu enlace con tus clientes para que te califiquen.</p>
              <Button variant="outline" size="sm" className="font-bold h-10 flex items-center gap-2 mx-auto" onClick={copiarEnlace}>
                <Link2 size={13} />
                {copiado ? "Copiado" : "Copiar enlace"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resenas.map((r) => (
                <div key={r.id} className="group p-4 rounded-xl border border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{r.client_name}</p>
                        <div className="flex gap-0.5">{renderEstrellas(r.calificacion)}</div>
                        <span className="text-xs text-muted-foreground">{formatearFecha(r.created_at)}</span>
                      </div>
                      {r.client_phone && <p className="text-xs text-muted-foreground mt-0.5">{r.client_phone}</p>}
                      {r.comentario && <p className="text-sm text-foreground mt-2 italic">"{r.comentario}"</p>}
                    </div>
                    <button
                      onClick={() => eliminarResena(r.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}