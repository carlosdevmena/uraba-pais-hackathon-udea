"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, HeartPulse, Briefcase, Users2, ChevronLeft, ChevronRight } from "lucide-react";
import { card } from "@/components/ui";

const LINEAS = [
  {
    titulo: "Asistencia humanitaria y protección",
    texto: "Apartadó, Turbo y Necoclí — ayudas y orientación frente a necesidades urgentes.",
    icon: HeartHandshake,
  },
  {
    titulo: "Salud integral y psicosocial",
    texto: "Salud, salud mental, apoyo psicosocial y salud sexual y reproductiva.",
    icon: HeartPulse,
  },
  {
    titulo: "Integración socioeconómica",
    texto: "Formación, empleabilidad, emprendimiento y fortalecimiento comunitario.",
    icon: Briefcase,
  },
  {
    titulo: "Acompañamiento familiar",
    texto: "Cohesión social entre comunidades migrantes, desplazadas y de acogida.",
    icon: Users2,
  },
];

export default function GaleriaProyecto() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndice((i) => (i + 1) % LINEAS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const anterior = () => setIndice((i) => (i - 1 + LINEAS.length) % LINEAS.length);
  const siguiente = () => setIndice((i) => (i + 1) % LINEAS.length);
  const activa = LINEAS[indice];
  const Icon = activa.icon;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Líneas de trabajo del proyecto</h2>
        <p className="text-xs text-slate-500">
          Ilustrativo — el prototipo no incluye fotografías reales del proyecto todavía.
        </p>
      </div>

      <div className={`${card} relative overflow-hidden p-8 sm:p-10`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-yellow-400">
            <Icon size={28} />
          </span>
          <h3 className="text-lg font-semibold text-slate-900">{activa.titulo}</h3>
          <p className="max-w-md text-sm text-slate-500">{activa.texto}</p>
        </div>

        <button
          type="button"
          onClick={anterior}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-brand-700"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={siguiente}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-brand-700"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {LINEAS.map((l, i) => (
          <button
            key={l.titulo}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ir a ${l.titulo}`}
            className={`h-2 rounded-full transition-all ${
              i === indice ? "w-6 bg-brand-700" : "w-2 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
