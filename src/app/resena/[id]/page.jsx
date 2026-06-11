"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Check } from "lucide-react";

const ETIQUETAS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export default function ResenaPublicaPage({ params }) {
  const { id: barberId } = use(params);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");

  useEffect(() => { cargarBarberia(); }, [barberId]);

  const cargarBarberia = async () => {
    const { data: cfg, error } = await supabase.from("barber_settings").select("barber_name, plan, instagram").eq("barber_id", barberId).single();
    if (error || !cfg) { setErrorCarga("No se encontró esta barbería."); return; }
    setConfig(cfg);
    setLoading(false);
  };

  const enviarResena = async () => {
    if (calificacion === 0) return;
    setEnviando(true);
    const { error } = await supabase.from("resenas").insert([{
      barber_id: barberId, client_name: "Anónimo", client_phone: null,
      calificacion, comentario: comentario.trim() || null,
    }]);
    if (!error) setEnviado(true);
    else alert("Error al enviar reseña: " + error.message);
    setEnviando(false);
  };

  if (errorCarga) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <p className="text-destructive font-bold">{errorCarga}</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <p className="text-muted-foreground animate-pulse font-black text-2xl tracking-tighter">GB PRO</p>
    </div>
  );

  const nombreBarberia = (config.plan === "PRO" || config.plan === "BOSS") ? config.barber_name : "GB PRO";

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="bg-zinc-950 rounded-t-2xl p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{nombreBarberia}</h1>
          <p className="text-zinc-400 mt-2 text-sm">¿Cómo fue tu experiencia?</p>
        </div>

        <Card className="rounded-t-none border-t-0 shadow-xl rounded-b-2xl">
          <CardContent className="p-6 md:p-8">

            {enviado ? (
              <div className="text-center space-y-6 py-8 animate-in zoom-in-95">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={32} strokeWidth={2.5} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold">¡Gracias por tu reseña!</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Tu opinión ayuda a mejorar el servicio.</p>
                </div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={24} strokeWidth={0} fill={i < calificacion ? "#fbbf24" : "#e4e4e7"} />
                  ))}
                </div>
                {(config.plan === "PRO" || config.plan === "BOSS") && config.instagram && (
                  <a
                    href={`https://instagram.com/${config.instagram.replace("@","")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold h-14 rounded-xl transition-all active:scale-[0.98]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Ver trabajos en Instagram
                  </a>
                )}
                <p className="text-xs text-muted-foreground">Powered by <strong>GB PRO</strong></p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <p className="font-bold text-base">Toca para calificar</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setCalificacion(star)}
                        className="transition-transform active:scale-110 select-none"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <Star
                          size={44}
                          strokeWidth={star <= calificacion ? 0 : 1.5}
                          fill={star <= calificacion ? "#fbbf24" : "transparent"}
                          className={star <= calificacion ? "text-amber-400 scale-110" : "text-zinc-300"}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="h-5">
                    {calificacion > 0 && (
                      <p className="text-sm font-bold text-muted-foreground animate-in fade-in">{ETIQUETAS[calificacion]}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">
                    Comentario <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <textarea
                    placeholder="Contanos tu experiencia..."
                    rows={4}
                    className="w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <Button
                  className={`w-full h-14 text-lg font-bold transition-all ${
                    calificacion === 0
                      ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-950 hover:bg-zinc-800 text-white active:scale-[0.98]"
                  }`}
                  onClick={enviarResena}
                  disabled={enviando || calificacion === 0}
                >
                  {enviando ? "Enviando..." : calificacion === 0 ? "Elige una calificación" : "Enviar reseña"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <strong>GB PRO</strong>
        </p>
      </div>
    </div>
  );
}