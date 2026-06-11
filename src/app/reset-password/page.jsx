"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-password`,
    });

    if (error) {
      setError("Error al enviar el correo. Verifica que el email sea correcto.");
      setLoading(false);
      return;
    }

    setEnviado(true);
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

          {enviado ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check size={32} strokeWidth={2.5} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Correo enviado</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Te mandamos un enlace a <strong>{email}</strong> para restablecer tu contraseña. Revisa también tu carpeta de spam.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full h-12 font-bold">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">Recuperar contraseña</h1>
                <p className="text-muted-foreground text-sm">
                  Escribe tu correo y te mandamos un enlace para crear una nueva.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
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

                <Button type="submit" className="w-full h-12 font-bold text-base" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
                <Link href="/login" className="font-bold text-foreground hover:underline">
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}