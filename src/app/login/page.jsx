"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 relative">

      <div className="absolute top-0 w-full py-6 text-center">
        <Link href="/">
          <span className="font-black tracking-tighter text-2xl">GB PRO</span>
        </Link>
        <p className="text-muted-foreground text-sm font-medium mt-1">Toma el control de tu negocio</p>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-xl mt-12">
        <CardContent className="p-8 space-y-6">

          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido de vuelta</h1>
            <p className="text-muted-foreground text-sm">Ingresa tus datos para acceder a tu panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                className="h-12 text-base"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/reset-password" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                className="h-12 text-base"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full h-12 font-bold text-base mt-2" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-bold text-foreground hover:underline">
              Regístrate gratis
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}