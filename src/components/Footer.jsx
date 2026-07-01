"use client";

import Link from "next/link";
import { useIdioma } from "@/hooks/useIdioma";

export function Footer() {
  const { t } = useIdioma();

  return (
    <footer className="w-full border-t border-border/40 bg-background py-6 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="font-bold text-sm tracking-tight">GB PRO</span>
        <div className="flex gap-6">
          <Link href="/terminos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.terminos")}</Link>
          <Link href="/privacidad" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacidad")}</Link>
          <a href="mailto:soporte@gbpro.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.soporte")}</a>
        </div>
        <p className="text-xs text-muted-foreground">&copy; 2026 GB PRO</p>
      </div>
    </footer>
  );
}
