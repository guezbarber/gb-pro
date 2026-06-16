import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="font-bold text-sm tracking-tight">GB PRO</span>
        <div className="flex gap-6">
          <Link href="/terminos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Términos</Link>
          <Link href="/privacidad" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacidad</Link>
          <a href="mailto:soporte@gbpro.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Soporte</a>
        </div>
        <p className="text-xs text-muted-foreground">&copy; 2026 GB PRO</p>
      </div>
    </footer>
  );
}