"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Map } from "lucide-react";

export default function MapaPage() {
  const [plan, setPlan] = useState("basico");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [visible, setVisible] = useState(false);
  const [mapaKey, setMapaKey] = useState(0);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("barber_settings").select("plan, direccion, ciudad, lat, lng, visible_en_mapa").eq("barber_id", user.id).single();
    if (data) {
      setPlan(data.plan || "basico");
      setDireccion(data.direccion || "");
      setCiudad(data.ciudad || "");
      setLat(data.lat ? String(data.lat) : "");
      setLng(data.lng ? String(data.lng) : "");
      setVisible(data.visible_en_mapa || false);
    }
    setLoading(false);
  };

  const detectarUbicacion = () => {
    if (!navigator.geolocation) { alert("Tu navegador no soporta geolocalización."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setMapaKey(prev => prev + 1); },
      () => alert("No se pudo obtener tu ubicación. Activa el GPS.")
    );
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("barber_settings").update({ direccion, ciudad, lat: parseFloat(lat) || null, lng: parseFloat(lng) || null, visible_en_mapa: visible }).eq("barber_id", user.id);
    if (error) alert("Error: " + error.message);
    else { setGuardado(true); setMapaKey(prev => prev + 1); setTimeout(() => setGuardado(false), 3000); }
    setGuardando(false);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );

  if (plan !== "PRO" && plan !== "BOSS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mapa VIP</h1>
          <p className="text-muted-foreground mt-1">Aparece en el mapa donde los clientes buscan profesionales cerca.</p>
        </div>
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
              <Map size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">Hazte visible en tu ciudad</h2>
              <p className="text-zinc-400 mt-3 text-base max-w-md mx-auto">Con el plan PRO apareces en el mapa público de GB PRO donde los clientes buscan negocios cerca.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
              {[
                { title: "Visible en el mapa", desc: "Clientes te encuentran por ubicación" },
                { title: "Perfil destacado", desc: "Tu negocio aparece primero" },
                { title: "Reservas directas", desc: "Los clientes agendan desde el mapa" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-zinc-400 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <a href="/dashboard/suscripcion">
              <Button className="bg-white text-black hover:bg-zinc-200 font-black text-base h-12 px-10 mt-4">Ver planes</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mapa VIP</h1>
          <p className="text-muted-foreground mt-1">Configura tu ubicación para aparecer en el mapa público.</p>
        </div>
        <span className="bg-zinc-950 text-white text-xs font-black px-3 py-1 rounded-full">PRO</span>
      </div>

      {lat && lng ? (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tu ubicación</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              key={mapaKey}
              title="mapa"
              width="100%"
              height="250"
              frameBorder="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng)-0.01},${parseFloat(lat)-0.01},${parseFloat(lng)+0.01},${parseFloat(lat)+0.01}&layer=mapnik&marker=${lat},${lng}`}
              className="rounded-b-xl"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
          <MapPin size={20} className="opacity-40" />
          Agrega tu ubicación para ver el mapa
        </div>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Configurar ubicación</CardTitle>
          <CardDescription>Esta información aparece en el mapa público de GB PRO.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input placeholder="Ej: Av. 18 de Julio 1234" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input placeholder="Ej: Montevideo" value={ciudad} onChange={(e) => setCiudad(e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Latitud</Label>
                <Input placeholder="-34.906" value={lat} onChange={(e) => { setLat(e.target.value); setMapaKey(prev => prev + 1); }} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Longitud</Label>
                <Input placeholder="-56.187" value={lng} onChange={(e) => { setLng(e.target.value); setMapaKey(prev => prev + 1); }} className="h-11" />
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 font-bold flex items-center gap-2" onClick={detectarUbicacion}>
              <MapPin size={15} strokeWidth={1.8} />
              Detectar mi ubicación automáticamente
            </Button>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
              <div>
                <p className="font-bold text-sm">Visible en el mapa público</p>
                <p className="text-xs text-muted-foreground">Los clientes podrán encontrarte y reservar.</p>
              </div>
              <button type="button" onClick={() => setVisible(!visible)} className={`relative w-12 h-6 rounded-full transition-colors ${visible ? "bg-zinc-950" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${visible ? "left-7" : "left-1"}`} />
              </button>
            </div>

            <Button type="submit" className={`w-full h-12 font-bold transition-all ${guardado ? "bg-green-600 hover:bg-green-700 text-white" : ""}`} disabled={guardando}>
              {guardando ? "Guardando..." : guardado ? "Guardado" : "Guardar ubicación"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}