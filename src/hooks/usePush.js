"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function usePush() {
  const [suscrito, setSuscrito] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    verificarSuscripcion();
  }, []);

  const verificarSuscripcion = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setSuscrito(!!sub);
  };

  const suscribirse = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setCargando(false); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barber_id: user.id, subscription: sub }),
      });

      setSuscrito(true);
    } catch (err) {
      console.error("Error suscribirse push:", err);
    }
    setCargando(false);
  };

  const desuscribirse = async () => {
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barber_id: user.id }),
      });

      setSuscrito(false);
    } catch (err) {
      console.error("Error desuscribirse push:", err);
    }
    setCargando(false);
  };

  return { suscrito, cargando, suscribirse, desuscribirse };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}