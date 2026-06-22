"use client";

import { useRef, useEffect, useState } from "react";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const ITEM_H = 44; // altura generosa para dedos
const VISIBLE = 2; // items arriba y abajo del seleccionado

function Drum({ items, initialIndex = 0, onChange }) {
  const innerRef = useRef(null);
  const idxRef = useRef(initialIndex);
  const pointerStartY = useRef(0);
  const pointerStartIdx = useRef(0);
  const animRef = useRef(null);

  const clamp = (i) => ((i % items.length) + items.length) % items.length;

  const renderItems = (centerIdx, offsetPx = 0) => {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.transition = "none";
    inner.innerHTML = "";
    for (let i = -VISIBLE; i <= VISIBLE + 1; i++) {
      const ri = clamp(centerIdx + i);
      const div = document.createElement("div");
      div.style.cssText = `
        height:${ITEM_H}px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${i === 0 ? "22px" : "17px"};
        font-weight:${i === 0 ? "600" : "400"};
        color:${i === 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)"};
        flex-shrink:0;
        transition:none;
        font-family:var(--font-sans);
      `;
      div.textContent = items[ri];
      inner.appendChild(div);
    }
    inner.style.transform = `translateY(${-offsetPx}px)`;
  };

  const snapTo = (newIdx) => {
    idxRef.current = clamp(newIdx);
    if (innerRef.current) {
      innerRef.current.style.transition = "transform 0.18s cubic-bezier(0.25,0.46,0.45,0.94)";
      innerRef.current.style.transform = "translateY(0px)";
    }
    renderItems(idxRef.current);
    onChange(items[idxRef.current], idxRef.current);
  };

  useEffect(() => {
    renderItems(idxRef.current);
    onChange(items[idxRef.current], idxRef.current);
  }, [items]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerStartY.current = e.clientY;
    pointerStartIdx.current = idxRef.current;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const onPointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dy = pointerStartY.current - e.clientY;
    const shift = Math.round(dy / ITEM_H);
    const offset = dy % ITEM_H;
    renderItems(clamp(pointerStartIdx.current + shift), offset);
  };

  const onPointerUp = (e) => {
    const dy = pointerStartY.current - e.clientY;
    const shift = Math.round(dy / ITEM_H);
    snapTo(pointerStartIdx.current + shift);
  };

  const onWheel = (e) => {
    e.preventDefault();
    snapTo(idxRef.current + (e.deltaY > 0 ? 1 : -1));
  };

  const containerH = ITEM_H * (VISIBLE * 2 + 1);
  const selectorTop = ITEM_H * VISIBLE;

  return (
    <div
      style={{
        position: "relative",
        height: `${containerH}px`,
        overflow: "hidden",
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      {/* Fade top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: `${selectorTop}px`,
        background: "linear-gradient(to bottom, var(--color-background-primary) 20%, transparent 100%)",
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Selector highlight */}
      <div style={{
        position: "absolute", top: `${selectorTop}px`, left: 0, right: 0,
        height: `${ITEM_H}px`,
        borderTop: "0.5px solid var(--color-border-secondary)",
        borderBottom: "0.5px solid var(--color-border-secondary)",
        zIndex: 1, pointerEvents: "none",
      }} />
      {/* Fade bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: `${selectorTop}px`,
        background: "linear-gradient(to top, var(--color-background-primary) 20%, transparent 100%)",
        zIndex: 2, pointerEvents: "none",
      }} />
      {/* Items */}
      <div ref={innerRef} style={{ display: "flex", flexDirection: "column" }} />
    </div>
  );
}

// ── Componente principal exportable ──────────────────────────────────────────
// value: "YYYY-MM-DD" string
// onChange: (value: "YYYY-MM-DD") => void
// minDate: "YYYY-MM-DD" (opcional, default = hoy)
//
// El año ya NO se muestra como selector visual. Se calcula automáticamente:
// - Si el mes elegido es >= mes actual, se usa el año actual.
// - Si el mes elegido es < mes actual (el usuario "dio la vuelta" al tambor
//   hacia atrás, ej. eligió Enero estando en Noviembre), se asume el año siguiente.
export default function DatePickerIOS({ value, onChange, minDate }) {
  const hoy = new Date();
  const min = minDate ? new Date(minDate + "T00:00:00") : hoy;
  const anioBase = min.getFullYear();
  const mesBase = min.getMonth();

  // Calcula automáticamente el año correcto dado un mes elegido en el tambor
  const calcularAnio = (mesElegido) => {
    return mesElegido >= mesBase ? anioBase : anioBase + 1;
  };

  // Parsear value inicial
  const parseInitial = () => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: hoy.getFullYear(), month: hoy.getMonth(), day: hoy.getDate() };
  };

  const initial = parseInitial();

  const [selYear, setSelYear] = useState(initial.year);
  const [selMonth, setSelMonth] = useState(initial.month);
  const [selDay, setSelDay] = useState(initial.day);

  // Días del mes seleccionado
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  // Ajustar día si excede el mes
  const safeDay = Math.min(selDay, daysInMonth);

  const emit = (y, m, d) => {
    const safe = Math.min(d, new Date(y, m + 1, 0).getDate());
    const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(safe).padStart(2, "0")}`;
    onChange(str);
  };

  const initialMonthIdx = initial.month;
  const initialDayIdx = initial.day - 1;

  return (
    <div style={{
      background: "var(--color-background-primary)",
      borderRadius: "var(--border-radius-lg)",
      border: "0.5px solid var(--color-border-tertiary)",
      padding: "0 8px",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", gap: 0 }}>
        {/* Día */}
        <div style={{ flex: 1 }}>
          <Drum
            key={`day-${selMonth}-${selYear}`}
            items={days}
            initialIndex={Math.min(initialDayIdx, days.length - 1)}
            onChange={(val, idx) => {
              setSelDay(idx + 1);
              emit(selYear, selMonth, idx + 1);
            }}
          />
        </div>

        {/* Separador */}
        <div style={{ display:"flex", alignItems:"center", padding:"0 4px", color:"var(--color-text-tertiary)", fontSize:"18px" }}>/</div>

        {/* Mes — al cambiar, recalcula el año automáticamente */}
        <div style={{ flex: 1.4 }}>
          <Drum
            items={MESES}
            initialIndex={initialMonthIdx}
            onChange={(val, idx) => {
              const nuevoAnio = calcularAnio(idx);
              setSelMonth(idx);
              setSelYear(nuevoAnio);
              emit(nuevoAnio, idx, safeDay);
            }}
          />
        </div>
      </div>
    </div>
  );
}