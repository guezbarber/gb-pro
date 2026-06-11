"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

export default function ServiciosPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoadingData(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("services").select("*").eq("barber_id", user.id).order("name", { ascending: true });
    if (data) setServices(data);
    setLoadingData(false);
  };

  const handleStartEdit = (svc) => {
    setEditingId(svc.id);
    setName(svc.name);
    setPrice(String(svc.price));
    setDuration(String(svc.duration_minutes));
  };

  const handleCancelEdit = () => {
    setEditingId(null); setName(""); setPrice(""); setDuration("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (editingId) {
      const { error } = await supabase.from("services").update({
        name, price: parseFloat(price), duration_minutes: parseInt(duration, 10)
      }).eq("id", editingId);
      if (error) alert("Error: " + error.message);
      else { handleCancelEdit(); loadData(); }
    } else {
      const { error } = await supabase.from("services").insert([{
        barber_id: user.id, name, price: parseFloat(price), duration_minutes: parseInt(duration, 10)
      }]);
      if (error) alert("Error: " + error.message);
      else { setName(""); setPrice(""); setDuration(""); loadData(); }
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Borrar este servicio?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else {
      if (editingId === id) handleCancelEdit();
      setServices(services.filter(s => s.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Servicios</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu catálogo de servicios y precios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Formulario */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{editingId ? "Editar servicio" : "Nuevo servicio"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input required placeholder="Ej: Corte Clásico" className="h-11" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Precio ($)</Label>
                  <Input type="number" step="any" min="0" required placeholder="400" className="h-11" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duración (min)</Label>
                  <Input type="number" min="1" required placeholder="30" className="h-11" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full font-bold h-11 mt-1" disabled={loading}>
                {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar servicio"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" className="w-full font-bold h-10" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Servicios registrados</CardTitle>
            {services.length > 0 && (
              <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                {services.length} {services.length === 1 ? "servicio" : "servicios"}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-10 text-muted-foreground text-sm animate-pulse">Cargando...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                No hay servicios. Agrega tu primer servicio.
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className={`group flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-xl border gap-3 transition-all ${
                      editingId === svc.id ? "border-zinc-900 bg-zinc-50" : "border-border/50 bg-muted/20 hover:border-border"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-base">{svc.name}</p>
                      <p className="text-sm text-muted-foreground">{svc.duration_minutes} min</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-lg">${svc.price}</p>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => handleStartEdit(svc)}>
                        <Pencil size={13} strokeWidth={2} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(svc.id)}>
                        <Trash2 size={13} strokeWidth={2} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}