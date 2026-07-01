"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { detectarIdiomaNavegador, traducir, IDIOMA_DEFAULT, IDIOMAS_SOPORTADOS } from "@/lib/i18n";
import { IdiomaContext } from "@/lib/IdiomaContext";

const STORAGE_KEY = "gbpro_idioma";

// Hook para usar en cualquier página que necesite traducción.
// Dentro del dashboard (envuelto en IdiomaProvider) usa el contexto global —
// cambiar el idioma se propaga a todos los componentes al instante.
// Fuera del provider (reserva pública, etc.) funciona con estado local, igual que antes.
//
// Uso:
//   const { idioma, t, cambiarIdioma } = useIdioma();
//   <h1>{t("reserva.tusDatos")}</h1>
export function useIdioma() {
  const ctx = useContext(IdiomaContext);

  // Estado local — siempre se inicializa (regla de hooks), pero solo se usa
  // cuando no hay IdiomaProvider en el árbol.
  const [idiomaLocal, setIdiomaLocal] = useState(IDIOMA_DEFAULT);
  const [listoLocal, setListoLocal] = useState(false);

  useEffect(() => {
    if (ctx) return; // el provider ya maneja la inicialización
    const guardado = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (guardado && IDIOMAS_SOPORTADOS.includes(guardado)) {
      setIdiomaLocal(guardado);
    } else {
      const detectado = detectarIdiomaNavegador();
      setIdiomaLocal(detectado);
      try { localStorage.setItem(STORAGE_KEY, detectado); } catch {}
    }
    setListoLocal(true);
  }, [ctx]);

  const cambiarIdiomaLocal = useCallback((nuevoIdioma) => {
    if (!IDIOMAS_SOPORTADOS.includes(nuevoIdioma)) return;
    setIdiomaLocal(nuevoIdioma);
    try { localStorage.setItem(STORAGE_KEY, nuevoIdioma); } catch {}
  }, []);

  const tLocal = useCallback((clave) => traducir(idiomaLocal, clave), [idiomaLocal]);

  if (ctx) return ctx;
  return { idioma: idiomaLocal, t: tLocal, cambiarIdioma: cambiarIdiomaLocal, listo: listoLocal };
}