"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function WelcomeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setIsOpen(true);
    }
  }, [searchParams]);

  const closeModal = () => {
    setIsOpen(false);
    router.replace("/dashboard/agenda", { scroll: false });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

        <div className="bg-zinc-950 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Check size={32} strokeWidth={2.5} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Bienvenido a GB PRO
          </h2>
          <p className="text-zinc-400 text-sm mt-2">Tu pago fue procesado con éxito.</p>
        </div>

        <div className="p-6 space-y-4">
          <ul className="space-y-2 text-sm font-medium text-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
            {[
              "Turnos ilimitados activados",
              "Herramientas de gestión desbloqueadas",
              "Cero comisiones por agendamiento",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check size={14} strokeWidth={2.5} className="text-green-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={closeModal}
            className="w-full rounded-xl bg-zinc-950 px-4 py-4 text-base font-bold text-white transition-all hover:bg-zinc-800 active:scale-95"
          >
            Ir a mi agenda
          </button>
        </div>

      </div>
    </div>
  );
}