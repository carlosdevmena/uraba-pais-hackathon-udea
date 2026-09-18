"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Envuelve contenido y lo hace aparecer (fade + slide) al entrar en pantalla. */
export default function Reveal({
  children,
  className = "",
  retraso = 0,
}: {
  children: ReactNode;
  className?: string;
  retraso?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visible ? `${retraso}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
