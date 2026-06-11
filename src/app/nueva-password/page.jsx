"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

export default function NuevaPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  const handleNuevaPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Error al actualizar la contraseña. El enlace puede haber expirado.");
      setLoading(false);
      return;
    }

    setListo(true);
    setLoading(false);

    // Redirigir al dashboard después de 2 segundos
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 relative">

      <div className="absolute top-0 w-full py-6 text-center">
        <Link href="/">
          <span className="font-black tracking-tighter text-2xl">GB PRO</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-xl mt-8">
        <CardContent className="p-8 space-y-6">

          {listo ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check size={32} strokeWidth={2.5} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Contraseña actualizada</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Redirigiendo a tu dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">Nueva contraseña</h1>
                <p className="text-muted-foreground text-sm">Escribe tu nueva contraseña.</p>
              </div>

              <form onSubmit={handleNuevaPassword} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 text-base"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmar">Confirmar contraseña</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    placeholder="Repite la contraseña"
                    className="h-12 text-base"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full h-12 font-bold text-base" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>
              </form>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}