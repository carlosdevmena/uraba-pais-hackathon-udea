"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HeartHandshake, HeartPulse, Briefcase, Users2, ChevronLeft, ChevronRight } from "lucide-react";
import { card } from "@/components/ui";

const LINEAS = [
  {
    titulo: "Asistencia humanitaria y protección",
    texto: "Apartadó, Turbo y Necoclí — orientación y registro frente a necesidades urgentes.",
    icon: HeartHandshake,
    imagen: "/galeria-asistencia-humanitaria.jpeg",
  },
  {
    titulo: "Salud y bienestar comunitario",
    texto: "Nutrición, bienestar y apoyo mutuo en la vida cotidiana de la comunidad.",
    icon: HeartPulse,
    imagen: "/galeria-salud.jpeg",
  },
  {
    titulo: "Integración socioeconómica y cohesión social",
    texto: "Formación, emprendimiento y encuentros comunitarios entre distintas nacionalidades.",
    icon: Briefcase,
    imagen: "/galeria-integracion-socioeconomica.jpeg",
  },
  {
    titulo: "Acompañamiento familiar",
    texto: "Visitas y seguimiento cercano a las familias en sus propios hogares.",
    icon: Users2,
    imagen: "/galeria-acompanamiento-familiar.jpeg",
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
        <p className="text-xs text-slate-500">Imágenes ilustrativas de referencia.</p>
      </div>

      <div className={`${card} relative overflow-hidden`}>
        {activa.imagen ? (
          <div className="relative h-56 w-full sm:h-64">
            <Image src={activa.imagen} alt={activa.titulo} fill className="object-cover" priority={indice === 0} />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/10 to-transparent" />
            <div className="absolute bottom-0 left-0 flex w-full flex-col gap-1 p-6 text-white">
              <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-brand-800">
                <Icon size={18} />
              </span>
              <h3 className="text-lg font-semibold">{activa.titulo}</h3>
              <p className="max-w-md text-sm text-white/85">{activa.texto}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-yellow-400">
              <Icon size={28} />
            </span>
            <h3 className="text-lg font-semibold text-slate-900">{activa.titulo}</h3>
            <p className="max-w-md text-sm text-slate-500">{activa.texto}</p>
          </div>
        )}

        <button
          type="button"
          onClick={anterior}
          aria-label="Anterior"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-brand-700"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={siguiente}
          aria-label="Siguiente"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white hover:text-brand-700"
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
            className={`h-2 rounded-full transition-all hover:bg-brand-400 ${
              i === indice ? "w-6 bg-brand-700" : "w-2 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
