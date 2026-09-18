"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, Link2, HeartHandshake, ClipboardCheck } from "lucide-react";

const RADIO = 104;

// Definidos aquí (no recibidos como prop) porque los componentes de ícono de
// lucide-react son funciones — React Server Components no puede pasar
// funciones como prop de servidor a cliente.
const PASOS = [
  { titulo: "Registro", icon: UserPlus },
  { titulo: "Vinculación", icon: Link2 },
  { titulo: "Atención o ayuda", icon: HeartHandshake },
  { titulo: "Seguimiento", icon: ClipboardCheck },
];

function posicion(indice: number, total: number) {
  const angulo = (indice / total) * 2 * Math.PI - Math.PI / 2;
  return { x: Math.cos(angulo) * RADIO, y: Math.sin(angulo) * RADIO };
}

export default function FlujoCiclo() {
  const [giroScroll, setGiroScroll] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Progreso de 0 a 1 mientras el bloque atraviesa el viewport.
      const progreso = 1 - (rect.top + rect.height / 2) / (window.innerHeight + rect.height);
      setGiroScroll(Math.max(0, Math.min(1, progreso)) * 180);
    }
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <div ref={ref} className="relative mx-auto flex h-64 w-64 shrink-0 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full border-4 border-dashed border-brand-200 dark:border-brand-800"
        style={{ transform: `rotate(${giroScroll}deg)`, transition: "transform 0.15s linear" }}
        aria-hidden="true"
      />
      <div
        className="animate-spin-slow absolute inset-8 rounded-full bg-[conic-gradient(var(--color-accent-200)_0deg,transparent_90deg,var(--color-mint-200)_180deg,transparent_270deg)] opacity-40 dark:opacity-20"
        aria-hidden="true"
      />
      {PASOS.map((p, i) => {
        const { x, y } = posicion(i, PASOS.length);
        const Icon = p.icon;
        return (
          <div
            key={p.titulo}
            className="absolute flex flex-col items-center gap-1.5"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white shadow-md ring-4 ring-white dark:ring-slate-900">
              <Icon size={18} />
            </span>
            <span className="max-w-[5.5rem] text-center text-xs font-medium leading-tight text-brand-800 dark:text-brand-200">
              {p.titulo}
            </span>
          </div>
        );
      })}
    </div>
  );
}
