"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import { detectarIdiomaNavegador, traducir, IDIOMA_DEFAULT, IDIOMAS_SOPORTADOS } from "@/lib/i18n";

const STORAGE_KEY = "gbpro_idioma";

export const IdiomaContext = createContext(null);

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(IDIOMA_DEFAULT);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
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

  return (
    <IdiomaContext.Provider value={{ idioma, t, cambiarIdioma, listo }}>
      {children}
    </IdiomaContext.Provider>
  );
}
