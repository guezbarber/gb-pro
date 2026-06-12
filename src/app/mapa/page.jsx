"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MessageSquare, Scissors, Search, Navigation, SlidersHorizontal } from "lucide-react";

// Fórmula de Haversine para calcular distancia en km entre dos coordenadas
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const RADIOS = [1, 3, 5, 10];

export default function MapaPublicoPage() {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [detectando, setDetectando] = useState(false);
  const [radioKm, setRadioKm] = useState(null); // null = sin filtro
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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

  const detectarUbicacion = () => {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización."); return; }
    setDetectando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRadioKm(5); // radio por defecto al detectar
        setDetectando(false);
      },
      () => { alert("No se pudo obtener tu ubicación."); setDetectando(false); }
    );
  };

  const limpiarFiltroUbicacion = () => {
    setUbicacionUsuario(null);
    setRadioKm(null);
  };

  // Filtrar por búsqueda y por radio
  const barberosFiltrados = barberos
    .map(b => {
      let distancia = null;
      if (ubicacionUsuario && b.lat && b.lng) {
        distancia = calcularDistancia(ubicacionUsuario.lat, ubicacionUsuario.lng, parseFloat(b.lat), parseFloat(b.lng));
      }
      return { ...b, distancia };
    })
    .filter(b => {
      const matchBusqueda =
        b.barber_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
        b.ciudad?.toLowerCase().includes(busqueda.toLowerCase()) ||
        b.direccion?.toLowerCase().includes(busqueda.toLowerCase());

      const matchRadio = radioKm && ubicacionUsuario && b.distancia !== null
        ? b.distancia <= radioKm
        : true;

      return matchBusqueda && matchRadio;
    })
    .sort((a, b) => {
      if (a.distancia !== null && b.distancia !== null) return a.distancia - b.distancia;
      return 0;
    });

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
      <div className="bg-zinc-950 text-white py-14 px-6 text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Encuentra tu barbero<br />en cualquier ciudad
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Busca, elige y agenda tu turno en segundos. Sin llamadas, sin esperas.
        </p>

        {/* Buscador */}
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Buscar por nombre, zona o ciudad..."
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 text-base pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Button
              className="h-12 px-4 font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 shrink-0"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              <SlidersHorizontal size={16} />
            </Button>
          </div>

          {/* Filtros desplegables */}
          {mostrarFiltros && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 space-y-3 text-left animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Filtrar por distancia</p>

              {!ubicacionUsuario ? (
                <Button
                  className="w-full h-10 font-bold bg-white text-black hover:bg-zinc-200 flex items-center gap-2"
                  onClick={detectarUbicacion}
                  disabled={detectando}
                >
                  <Navigation size={14} />
                  {detectando ? "Detectando..." : "Usar mi ubicación"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                    <Navigation size={12} /> Ubicación detectada
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {RADIOS.map(r => (
                      <button
                        key={r}
                        onClick={() => setRadioKm(r)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                          radioKm === r
                            ? "bg-white text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                    <button
                      onClick={limpiarFiltroUbicacion}
                      className="px-4 py-1.5 rounded-full text-sm font-bold bg-white/5 text-zinc-400 hover:bg-white/10 transition-all"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chips activos */}
        {ubicacionUsuario && radioKm && (
          <div className="flex justify-center gap-2">
            <span className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Navigation size={11} /> {radioKm} km de radio
            </span>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <h2 className="text-xl font-extrabold">
          {loading
            ? "Buscando barberos..."
            : `${barberosFiltrados.length} barbería${barberosFiltrados.length !== 1 ? "s" : ""} encontrada${barberosFiltrados.length !== 1 ? "s" : ""}`
          }
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse" />)}
          </div>
        ) : barberosFiltrados.length === 0 ? (
          <div className="text-center py-20 space-y-5">
            <div className="w-16 h-16 mx-auto bg-zinc-950 rounded-full flex items-center justify-center">
              <Scissors size={24} className="text-white" />
            </div>
            <div>
              <p className="font-black text-2xl">Sé el primero en tu ciudad.</p>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Los barberos que entren ahora van a tener ventaja cuando esto explote. La red está creciendo.
              </p>
            </div>
            <a href="/register">
              <Button className="font-bold bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8">
                Unirme ahora — es gratis
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
                  {b.distancia !== null && (
                    <p className="text-zinc-500 text-xs mt-1">{b.distancia.toFixed(1)} km de ti</p>
                  )}
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