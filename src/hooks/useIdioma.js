"use client";

import { useState, useEffect, useCallback } from "react";
import { detectarIdiomaNavegador, traducir, IDIOMA_DEFAULT, IDIOMAS_SOPORTADOS } from "@/lib/i18n";

const STORAGE_KEY = "gbpro_idioma";

// Hook para usar en cualquier página que necesite traducción.
// Detecta el idioma del navegador la primera vez que el usuario entra,
// lo guarda en localStorage, y permite cambiarlo manualmente después.
//
// Uso:
//   const { idioma, t, cambiarIdioma } = useIdioma();
//   <h1>{t("reserva.tusDatos")}</h1>
export function useIdioma() {
  const [idioma, setIdioma] = useState(IDIOMA_DEFAULT);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const guardado = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;

    if (guardado && IDIOMAS_SOPORTADOS.includes(guardado)) {
      setIdioma(guardado);
    } else {
      const detectado = detectarIdiomaNavegador();
      setIdioma(detectado);
      try { localStorage.setItem(STORAGE_KEY, detectado); } catch {}
    }
    setListo(true);
  }, []);

  const cambiarIdioma = useCallback((nuevoIdioma) => {
    if (!IDIOMAS_SOPORTADOS.includes(nuevoIdioma)) return;
    setIdioma(nuevoIdioma);
    try { localStorage.setItem(STORAGE_KEY, nuevoIdioma); } catch {}
  }, []);

  const t = useCallback((clave) => traducir(idioma, clave), [idioma]);

  return { idioma, t, cambiarIdioma, listo };
}