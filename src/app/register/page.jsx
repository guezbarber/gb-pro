"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      router.push("/onboarding");
    }

    setLoading(false);
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

          <div className="text-center space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Crea tu cuenta</h1>
            <p className="text-muted-foreground text-sm">Únete a la red global de profesionales. Es gratis.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
              <Label htmlFor="password">Contraseña</Label>
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

            <Button type="submit" className="w-full h-12 font-bold text-base mt-2" disabled={loading}>
              {loading ? "Creando cuenta..." : "Comenzar gratis"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Al registrarte aceptas nuestros{" "}
            <Link href="/terminos" className="font-bold hover:text-foreground transition-colors">Términos</Link>
            {" "}y{" "}
            <Link href="/privacidad" className="font-bold hover:text-foreground transition-colors">Política de Privacidad</Link>.
          </p>

          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-bold text-foreground hover:underline">
              Inicia sesión aquí
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}