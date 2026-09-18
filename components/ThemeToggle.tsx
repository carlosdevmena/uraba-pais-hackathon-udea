"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-900/10 bg-white/60 text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {oscuro ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
