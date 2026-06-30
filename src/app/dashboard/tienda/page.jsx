"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Trash2, Pencil } from "lucide-react";

export default function TiendaPage() {
  const [plan, setPlan] = useState("basico");
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [vendiendo, setVendiendo] = useState(false);
  const [productoVendiendo, setProductoVendiendo] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: settings } = await supabase.from("barber_settings").select("plan").eq("barber_id", user.id).single();
    if (settings) setPlan(settings.plan || "basico");
    await cargarProductos(user.id);
    await cargarVentasHoy(user.id);
    setLoading(false);
  };

  const cargarProductos = async (userId) => {
    setLoadingProductos(true);
    const { data } = await supabase.from("productos").select("*").eq("barber_id", userId).order("created_at", { ascending: false });
    if (data) setProductos(data);
    setLoadingProductos(false);
  };

  const cargarVentasHoy = async (userId) => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const { data } = await supabase.from("ventas_productos").select("*").eq("barber_id", userId).gte("fecha", hoy.toISOString()).order("fecha", { ascending: false });
    if (data) { setVentasHoy(data); setTotalVentasHoy(data.reduce((s, v) => s + (v.precio || 0), 0)); }
  };

  const registrarVenta = async (producto) => {
    setVendiendo(true); setProductoVendiendo(producto.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("ventas_productos").insert([{ barber_id: user.id, producto_id: producto.id, producto_nombre: producto.nombre, precio: producto.precio }]);
    if (!error) {
      if (producto.stock > 0) {
        await supabase.from("productos").update({ stock: producto.stock - 1 }).eq("id", producto.id);
        setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: p.stock - 1 } : p));
      }
      await cargarVentasHoy(user.id);
    } else alert("Error: " + error.message);
    setVendiendo(false); setProductoVendiendo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (editandoId) {
      const { error } = await supabase.from("productos").update({ nombre, precio: parseFloat(precio), stock: parseInt(stock), descripcion }).eq("id", editandoId);
      if (error) alert("Error: " + error.message);
      else { cancelarEdicion(); cargarProductos(user.id); }
    } else {
      const { error } = await supabase.from("productos").insert([{ barber_id: user.id, nombre, precio: parseFloat(precio), stock: parseInt(stock), descripcion }]);
      if (error) alert("Error: " + error.message);
      else { setNombre(""); setPrecio(""); setStock(""); setDescripcion(""); cargarProductos(user.id); }
    }
    setGuardando(false);
  };

  const handleEditar = (p) => {
    setEditandoId(p.id); setNombre(p.nombre); setPrecio(String(p.precio)); setStock(String(p.stock)); setDescripcion(p.descripcion || "");
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  };

  const cancelarEdicion = () => { setEditandoId(null); setNombre(""); setPrecio(""); setStock(""); setDescripcion(""); };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) alert("Error: " + error.message);
    else setProductos(prev => prev.filter(p => p.id !== id));
  };

  const ajustarStock = async (id, cambio) => {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    const nuevoStock = Math.max(0, producto.stock + cambio);
    const { error } = await supabase.from("productos").update({ stock: nuevoStock }).eq("id", id);
    if (!error) setProductos(prev => prev.map(p => p.id === id ? { ...p, stock: nuevoStock } : p));
  };

  if (!loading && plan !== "PRO" && plan !== "BOSS") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tienda</h1>
          <p className="text-muted-foreground mt-1">Vende productos físicos directamente desde tu perfil.</p>
        </div>
        <Card className="border-none shadow-2xl bg-zinc-950 text-white overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
              <ShoppingBag size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black">Vende mientras cortas</h2>
              <p className="text-zinc-400 mt-3 text-base max-w-md mx-auto">Con el plan PRO activas tu tienda y punto de venta rápido.</p>
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tienda</h1>
        <p className="text-muted-foreground mt-1">Vende productos y registra ventas en un toque.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Productos", value: productos.length },
          { label: "En stock", value: productos.filter(p => p.stock > 0).length },
          { label: "Ventas hoy", value: ventasHoy.length },
          { label: "Ingresos hoy", value: `$${totalVentasHoy}` },
        ].map((m, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-2xl font-black">{loadingProductos ? "..." : m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Venta rápida */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Venta rápida</CardTitle>
          <CardDescription className="text-xs">Toca un producto para registrar la venta. Descuenta el stock automáticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          {productos.filter(p => p.stock > 0).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay productos con stock disponible.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productos.filter(p => p.stock > 0).map((p) => (
                <button key={p.id} onClick={() => registrarVenta(p)} disabled={vendiendo && productoVendiendo === p.id}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 bg-background hover:bg-zinc-950 hover:text-white hover:border-zinc-950 active:scale-95 transition-all shadow-sm text-center group">
                  <ShoppingBag size={24} className="mb-2 opacity-50 group-hover:opacity-80" />
                  <p className="font-black text-sm">{p.nombre}</p>
                  <p className="font-black text-lg mt-1">${p.precio}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-zinc-400 mt-1">Stock: {p.stock}</p>
                  {vendiendo && productoVendiendo === p.id && <p className="text-xs font-bold mt-1 text-green-400">Vendido</p>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ventas de hoy */}
      {ventasHoy.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Ventas de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ventasHoy.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                  <div>
                    <p className="font-bold text-sm">{v.producto_nombre}</p>
                    <p className="text-xs text-muted-foreground">{new Date(v.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <p className="font-black text-base">${v.precio}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/50 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">{editandoId ? "Editar producto" : "Nuevo producto"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input required placeholder="Nombre del producto" className="h-11" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Precio ($)</Label>
                  <Input required type="number" min="0" step="any" placeholder="15" className="h-11" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock</Label>
                  <Input required type="number" min="0" placeholder="10" className="h-11" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción <span className="text-muted-foreground text-xs font-normal">(opcional)</span></Label>
                <textarea className="w-full text-sm rounded-md border border-input bg-muted/30 px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={3} placeholder="Descripción del producto" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-11 font-bold" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Agregar producto"}
              </Button>
              {editandoId && <Button type="button" variant="outline" className="w-full h-10 font-bold" onClick={cancelarEdicion}>Cancelar</Button>}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Catálogo ({productos.length})</CardTitle>
            <CardDescription className="text-xs">Ajusta el stock con los botones + y −</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProductos ? (
              <div className="text-center py-10 text-muted-foreground animate-pulse text-sm">Cargando...</div>
            ) : productos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No hay productos. Agrega tu primer producto.</div>
            ) : (
              <div className="space-y-3">
                {productos.map((p) => (
                  <div key={p.id} className={`group flex flex-col gap-3 p-4 rounded-xl border transition-colors ${editandoId === p.id ? "border-zinc-900 bg-zinc-50" : p.stock === 0 ? "border-red-200 bg-red-50/30" : "border-border/50 hover:bg-muted/20"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm">{p.nombre}</p>
                          {p.stock === 0 && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Sin stock</span>}
                        </div>
                        {p.descripcion && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.descripcion}</p>}
                      </div>
                      <p className="font-black text-lg shrink-0">${p.precio}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
                        <button onClick={() => ajustarStock(p.id, -1)} className="w-9 h-9 rounded-md font-black text-lg hover:bg-muted active:scale-95 transition-all flex items-center justify-center">−</button>
                        <span className="text-sm font-black w-8 text-center">{p.stock}</span>
                        <button onClick={() => ajustarStock(p.id, 1)} className="w-9 h-9 rounded-md font-black text-lg hover:bg-muted active:scale-95 transition-all flex items-center justify-center">+</button>
                      </div>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => handleEditar(p)}><Pencil size={13} strokeWidth={2} /></Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={() => handleEliminar(p.id)}><Trash2 size={13} strokeWidth={2} /></Button>
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