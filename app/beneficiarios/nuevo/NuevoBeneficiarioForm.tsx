"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangle, IdCard, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { crearBeneficiario, type CrearBeneficiarioState } from "../actions";
import { buttonPrimary, buttonSecondary, card, inputClass } from "@/components/ui";

const initialState: CrearBeneficiarioState = {};

const MUNICIPIOS = ["Apartadó", "Turbo", "Necoclí", "Otro"];
const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "Pasaporte", "PPT"];
const TIPOS_POBLACION = [
  { value: "migrante", label: "Migrante" },
  { value: "refugiado", label: "Refugiado" },
  { value: "desplazado", label: "Desplazado" },
  { value: "victima_conflicto", label: "Víctima del conflicto" },
  { value: "comunidad_acogida", label: "Comunidad de acogida" },
  { value: "otro", label: "Otro" },
];

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function FieldsetHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <legend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-slate-900">
      <span className="text-blue-600">{icon}</span>
      {title}
    </legend>
  );
}

export default function NuevoBeneficiarioForm() {
  const [state, formAction, pending] = useActionState(crearBeneficiario, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{state.error}</p>
            {state.duplicadoId && (
              <Link
                href={`/beneficiarios/${state.duplicadoId}`}
                className="mt-1 inline-flex items-center gap-1 font-medium underline"
              >
                Abrir ficha existente <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      <fieldset className={`grid gap-4 ${card} p-5 sm:grid-cols-2 sm:p-6`}>
        <FieldsetHeader icon={<IdCard size={16} />} title="Datos del beneficiario" />

        <Campo label="Nombres completos *">
          <input name="nombres" required className={inputClass} />
        </Campo>

        <Campo label="Tipo de población">
          <select name="tipoPoblacion" defaultValue="otro" className={inputClass}>
            {TIPOS_POBLACION.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Tipo de documento (si aplica)">
          <select name="tipoDocumento" defaultValue="" className={inputClass}>
            <option value="">Sin documento</option>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Número de documento">
          <input name="numeroDocumento" className={inputClass} />
        </Campo>

        <Campo label="Fecha de nacimiento">
          <input type="date" name="fechaNacimiento" className={inputClass} />
        </Campo>

        <Campo label="Género">
          <select name="genero" defaultValue="" className={inputClass}>
            <option value="">Prefiere no decir</option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
        </Campo>

        <Campo label="Municipio">
          <select name="municipio" defaultValue="" className={inputClass}>
            <option value="">Seleccionar...</option>
            {MUNICIPIOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Teléfono de contacto">
          <input name="telefono" className={inputClass} />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" name="discapacidad" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
          La persona tiene alguna discapacidad
        </label>
      </fieldset>

      <fieldset className={`grid gap-4 ${card} p-5 sm:grid-cols-2 sm:p-6`}>
        <FieldsetHeader icon={<Users size={16} />} title="Núcleo familiar (opcional, hasta 2 integrantes)" />
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-[1fr_1fr]">
            <Campo label={`Nombre del familiar ${i + 1}`}>
              <input name="familiarNombres" className={inputClass} />
            </Campo>
            <Campo label="Parentesco">
              <input name="familiarParentescos" placeholder="Hijo/a, cónyuge, etc." className={inputClass} />
            </Campo>
          </div>
        ))}
      </fieldset>

      <fieldset className={`${card} p-5 sm:p-6`}>
        <FieldsetHeader icon={<ShieldCheck size={16} />} title="Protección de datos" />
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="autorizacionDatos"
            required
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
          />
          <span>
            La persona autoriza el tratamiento de sus datos personales para fines de
            registro, seguimiento y generación de reportes agregados del proyecto. *
          </span>
        </label>
      </fieldset>

      <div className="flex justify-end gap-3">
        <Link href="/beneficiarios" className={buttonSecondary}>
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Guardando..." : "Registrar beneficiario"}
        </button>
      </div>
    </form>
  );
}
