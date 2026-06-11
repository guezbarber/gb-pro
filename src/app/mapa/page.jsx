"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MessageSquare, Scissors } from "lucide-react";

export default function MapaPublicoPage() {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { cargarBarberos(); }, []);

  const cargarBarberos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("barber_settings")
      .select("barber_id, barber_name, ciudad, direccion, lat, lng, whatsapp_number")
      .eq("visible_en_mapa", true)
      .eq("plan", "PRO");
    if (data) setBarberos(data);
    setLoading(false);
  };

  const barberosFiltrados = barberos.filter(b =>
    b.barber_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="border-b border-border/40 py-4 px-6 flex items-center justify-between">
        <a href="/" className="font-black text-xl tracking-tighter">GB PRO</a>
        <a href="/login">
          <Button variant="outline" size="sm" className="font-bold">Soy barbero</Button>
        </a>
      </div>

      {/* Hero */}
      <div className="bg-zinc-950 text-white py-16 px-6 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Encuentra tu barbero<br />en cualquier ciudad
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Busca, elige y agenda tu turno en segundos. Sin llamadas, sin esperas.
        </p>
        <div className="max-w-md mx-auto flex gap-2">
          <Input
            placeholder="Buscar por ciudad o barbería..."
            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 text-base"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Button className="h-12 px-6 font-bold bg-white text-black hover:bg-zinc-200 shrink-0">
            Buscar
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <h2 className="text-xl font-extrabold">
          {loading ? "Buscando barberos..." : `${barberosFiltrados.length} barbería${barberosFiltrados.length !== 1 ? "s" : ""} encontrada${barberosFiltrados.length !== 1 ? "s" : ""}`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />)}
          </div>
        ) : barberosFiltrados.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/30 rounded-full flex items-center justify-center">
              <Scissors size={24} className="text-muted-foreground" />
            </div>
            <p className="font-bold text-xl">No hay barberías en esta zona todavía</p>
            <p className="text-muted-foreground">Estamos creciendo. Pronto habrá barberos cerca tuyo.</p>
            <a href="/register">
              <Button className="mt-4 font-bold bg-zinc-950 text-white hover:bg-zinc-800">
                ¿Eres barbero? Únete gratis
              </Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barberosFiltrados.map((b, i) => (
              <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="bg-zinc-950 text-white p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 text-2xl font-black">
                    {b.barber_name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-black text-lg">{b.barber_name}</h3>
                  <p className="text-zinc-400 text-sm mt-1">{b.ciudad || "Sin ciudad"}</p>
                </div>
                <CardContent className="p-4 space-y-3">
                  {b.direccion && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin size={13} strokeWidth={1.5} className="shrink-0" />
                      {b.direccion}
                    </p>
                  )}
                  {b.lat && b.lng && (
                    <div className="rounded-lg overflow-hidden border border-border/40">
                      <iframe
                        title={`mapa-${b.barber_id}`}
                        width="100%"
                        height="120"
                        frameBorder="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(b.lng)-0.005},${parseFloat(b.lat)-0.005},${parseFloat(b.lng)+0.005},${parseFloat(b.lat)+0.005}&layer=mapnik&marker=${b.lat},${b.lng}`}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a href={`/reserva/${b.barber_id}`}>
                      <Button className="w-full font-bold bg-zinc-950 text-white hover:bg-zinc-800 h-10">Reservar</Button>
                    </a>
                    {b.whatsapp_number && (
                      <a href={`https://wa.me/${b.whatsapp_number.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full font-bold h-10 border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-1.5">
                          <MessageSquare size={13} /> WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-16 border-2 border-dashed border-border/50 rounded-2xl p-10 text-center space-y-4">
          <p className="text-2xl font-black">¿Eres barbero?</p>
          <p className="text-muted-foreground max-w-sm mx-auto">Únete a GB PRO y aparece en este mapa. Tus clientes te van a encontrar solos.</p>
          <a href="/register">
            <Button className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8">Crear cuenta gratis</Button>
          </a>
        </div>
      </div>

      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 GB PRO — El sistema operativo de la barbería</p>
      </div>
    </div>
  );
}