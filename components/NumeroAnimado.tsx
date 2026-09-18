"use client";

import { useEffect, useRef, useState } from "react";

/** Cuenta desde 0 hasta `valor` cuando entra en pantalla — para tarjetas de indicadores. */
export default function NumeroAnimado({ valor, duracionMs = 900 }: { valor: number; duracionMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observer.disconnect();
        const inicio = performance.now();
        function tick(ahora: number) {
          const progreso = Math.min(1, (ahora - inicio) / duracionMs);
          const suavizado = 1 - Math.pow(1 - progreso, 3);
          setActual(Math.round(suavizado * valor));
          if (progreso < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [valor, duracionMs]);

  return <span ref={ref}>{actual.toLocaleString("es-CO")}</span>;
}
