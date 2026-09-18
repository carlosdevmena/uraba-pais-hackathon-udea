"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles, Send, Loader2, X, MessageCircle } from "lucide-react";
import { analizarIndicadoresIA } from "@/app/reportes/ai-actions";

type Mensaje = { rol: "usuario" | "asistente"; texto: string; esError?: boolean };

const SUGERENCIAS = [
  "¿Cuál municipio concentra más beneficiarios?",
  "¿Cuántos seguimientos siguen pendientes?",
  "Resume la distribución por tipo de población.",
];

export default function AiAssistant() {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pending, startTransition] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, pending]);

  function preguntar(texto: string) {
    const pregunta = texto.trim();
    if (!pregunta || pending) return;
    setMensajes((m) => [...m, { rol: "usuario", texto: pregunta }]);
    setConsulta("");
    startTransition(async () => {
      const resultado = await analizarIndicadoresIA(pregunta);
      setMensajes((m) => [
        ...m,
        resultado.error
          ? { rol: "asistente", texto: resultado.error, esError: true }
          : { rol: "asistente", texto: resultado.respuesta ?? "Sin respuesta." },
      ]);
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {abierto && (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-brand-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={16} className="text-accent-400" />
              Asistente de reportes
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-3 text-xs text-slate-500">
              Pregunta sobre los indicadores agregados. Nunca veo nombres, documentos ni
              teléfonos — solo cifras.
            </p>

            {mensajes.length === 0 && (
              <div className="flex flex-col gap-2">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => preguntar(s)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {mensajes.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.rol === "usuario"
                      ? "self-end bg-brand-700 text-white"
                      : m.esError
                        ? "self-start bg-rose-50 text-rose-700"
                        : "self-start bg-mint-50 text-slate-800"
                  }`}
                >
                  {m.texto}
                </div>
              ))}
              {pending && (
                <div className="flex items-center gap-1.5 self-start text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin" />
                  Analizando...
                </div>
              )}
            </div>
            <div ref={finRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-slate-200 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              preguntar(consulta);
            }}
          >
            <input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="w-full flex-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-50"
            />
            <button
              type="submit"
              disabled={pending}
              aria-label="Enviar pregunta"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition hover:bg-brand-800 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? "Cerrar asistente de IA" : "Abrir asistente de IA"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg transition hover:scale-105 hover:bg-brand-800"
      >
        {abierto ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
