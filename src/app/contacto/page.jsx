import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactoPage() {
  return (
    <main className="flex-1 py-12 md:py-24 bg-muted/20 min-h-screen">
      <div className="container max-w-4xl px-4 md:px-6 grid md:grid-cols-2 gap-12">
        
        {/* Información de Contacto */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-4">Hablemos</h1>
            <p className="text-muted-foreground text-lg">
              ¿Tienes dudas sobre cómo implementar GB PRO en tu barbería? Estamos aquí para ayudarte a escalar tu negocio.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📍</div>
              <div>
                <h3 className="font-bold text-foreground">Ubicación</h3>
                <p className="text-muted-foreground">Montevideo, Uruguay<br/>Operando a nivel global</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="text-2xl">✉️</div>
              <div>
                <h3 className="font-bold text-foreground">Email</h3>
                <p className="text-muted-foreground">soporte@gbpro.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario Estético (Aún sin lógica de envío) */}
        <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" placeholder="Tu nombre" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@barberia.com" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <textarea 
                id="mensaje" 
                className="w-full flex min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="¿En qué te podemos ayudar?"
              ></textarea>
            </div>
            <Button type="button" className="w-full h-12 font-bold text-lg mt-2">
              Enviar Mensaje
            </Button>
          </form>
        </div>

      </div>
    </main>
  );
}