"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));

    // Mientras el dispositivo/navegador no tenga una preferencia explícita
    // guardada (el usuario nunca tocó el botón), la página sigue el tema del
    // sistema en vivo — incluye cambios mientras la pestaña sigue abierta.
    let preferenciaGuardada: string | null = null;
    try {
      preferenciaGuardada = localStorage.getItem("theme");
    } catch {
      // almacenamiento no disponible: se trata como "sin preferencia guardada".
    }
    if (preferenciaGuardada) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiarSistema = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
      setOscuro(e.matches);
    };
    media.addEventListener("change", alCambiarSistema);
    return () => media.removeEventListener("change", alCambiarSistema);
  }, []);

  function alternar() {
    const activar = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", activar);
    try {
      localStorage.setItem("theme", activar ? "dark" : "light");
    } catch {
      // almacenamiento no disponible (privado/bloqueado): el toggle sigue
      // funcionando para esta sesión, solo no persiste entre visitas.
    }
    setOscuro(activar);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:scale-105 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <span className="transition-transform duration-300 ease-out" key={oscuro ? "sun" : "moon"}>
        {oscuro ? <Sun size={15} className="animate-[fadeIn_0.3s_ease-out]" /> : <Moon size={15} className="animate-[fadeIn_0.3s_ease-out]" />}
      </span>
    </button>
  );
}
