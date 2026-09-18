"use client";

import { useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";

export default function ModalTratamientoDatos({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  useEffect(() => {
    if (!abierto) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-tratamiento-datos"
      onClick={onCerrar}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-700" />
            <h2 id="titulo-tratamiento-datos" className="text-base font-semibold text-slate-900">
              Autorización para el Tratamiento de Datos Personales
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
          <p>
            De conformidad con la <strong>Ley Estatutaria 1581 de 2012</strong> y su decreto
            reglamentario <strong>1377 de 2013</strong> de la República de Colombia, la información
            personal registrada en este sistema se recolecta y trata exclusivamente con fines
            humanitarios: gestionar la vinculación a programas, registrar atenciones o ayudas y
            hacer seguimiento a la situación de la persona y su núcleo familiar.
          </p>
          <p>
            <strong>Confidencialidad:</strong> los datos son de acceso restringido al personal
            autorizado de COOPI y sus aliados ejecutores (FADV, HIAS Colombia, Humanity &amp;
            Inclusion). No se comparten con terceros ajenos al proyecto ni se muestran datos
            personales en reportes o pantallas públicas.
          </p>
          <p>
            <strong>Derechos de Habeas Data:</strong> como titular de los datos, la persona (o su
            representante) tiene derecho a <strong>conocer, actualizar y rectificar</strong> su
            información en cualquier momento, así como a solicitar prueba de la autorización
            otorgada y a revocarla cuando lo considere pertinente, salvo que exista un deber legal
            o contractual que impida su supresión inmediata.
          </p>
          <p>
            <strong>Necesidad institucional:</strong> solo se solicitan los datos estrictamente
            necesarios para la atención y el seguimiento humanitario, conforme al principio de
            necesidad establecido en la ley. La ausencia de documento de identidad no impide el
            registro, dado el contexto de movilidad humana que atiende el proyecto.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
