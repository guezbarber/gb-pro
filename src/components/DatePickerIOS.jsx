"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// value: "YYYY-MM-DD" | onChange: (v: "YYYY-MM-DD") => void | minDate: "YYYY-MM-DD"
export default function DatePickerIOS({ value, onChange, minDate }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const min = minDate ? parseDate(minDate) : hoy;
  min.setHours(0, 0, 0, 0);

  const initial = value ? parseDate(value) : (min > hoy ? min : hoy);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [selected, setSelected] = useState(value || toStr(initial));

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // lunes = 0 … domingo = 6 (L M M J V S D)
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const minMonth = min.getFullYear() * 12 + min.getMonth();
  const curMonth = viewYear * 12 + viewMonth;
  const canGoPrev = curMonth > minMonth;

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < min) return;
    const str = toStr(date);
    setSelected(str);
    onChange(str);
  };

  const isDisabled = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    return date < min;
  };

  const isSelected = (day) => {
    return selected === `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const isToday = (day) => {
    return hoy.getFullYear() === viewYear && hoy.getMonth() === viewMonth && hoy.getDate() === day;
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-background rounded-2xl border border-border/40 p-4 select-none">
      {/* Header: mes y flechas */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-20 hover:bg-muted active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold tracking-wide">
          {MESES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goNext}
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-muted active:scale-95"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Encabezado días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          const today = isToday(day);
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              disabled={disabled}
              className={[
                "mx-auto w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors",
                sel
                  ? "bg-foreground text-background font-bold"
                  : today
                  ? "border border-foreground/30 text-foreground hover:bg-muted"
                  : disabled
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-foreground hover:bg-muted active:scale-95",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
