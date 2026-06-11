import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background py-8 md:py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Marca y slogan */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-bold text-xl tracking-tight">GB PRO</span>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Elevando el estándar de la barbería en todo el mundo.
          </p>
        </div>

        {/* Enlaces legales */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-center md:text-left">
          <Link href="/terminos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Privacidad
          </Link>
          <a href="mailto:soporte@gbpro.app" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            soporte@gbpro.app
          </a>
        </div>
        
      </div>
      
      {/* Copyright */}
      <div className="container mx-auto px-4 mt-8 max-w-7xl border-t border-border/10 pt-8 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 GB PRO. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}