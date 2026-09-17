"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertTriangle, IdCard, Users, ShieldCheck, ArrowRight, SearchCheck } from "lucide-react";
import { crearBeneficiario, type ActionState } from "../actions";
import { buttonPrimary, buttonSecondary, card, inputClass } from "@/components/ui";

const initialState: ActionState = {};

const MUNICIPIOS = ["Apartadó", "Turbo", "Necoclí", "Otro"];
const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "Pasaporte", "PPT"];
const TIPOS_POBLACION = [
  { value: "migrante", label: "Migrante" },
  { value: "refugiado", label: "Refugiado" },
  { value: "desplazado", label: "Desplazado" },
  { value: "retornado", label: "Retornado" },
  { value: "victima_conflicto", label: "Víctima del conflicto" },
  { value: "comunidad_acogida", label: "Comunidad de acogida" },
  { value: "otro", label: "Otro" },
];
const TIPOS_DISCAPACIDAD = [
  "Física o motriz",
  "Visual",
  "Auditiva",
  "Cognitiva o intelectual",
  "Psicosocial",
  "Múltiple",
];

const HOY = new Date().toISOString().slice(0, 10);
const HACE_120_ANIOS = new Date(new Date().setFullYear(new Date().getFullYear() - 120))
  .toISOString()
  .slice(0, 10);

function Campo({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function FieldsetHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <legend className="mb-1 flex items-center gap-2 px-1 text-sm font-semibold text-slate-900">
      <span className="text-brand-700">{icon}</span>
      {title}
    </legend>
  );
}

export default function NuevoBeneficiarioForm() {
  const [state, formAction, pending] = useActionState(crearBeneficiario, initialState);
  const [tieneDocumento, setTieneDocumento] = useState(false);
  const [tieneDiscapacidad, setTieneDiscapacidad] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
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

      {state.coincidenciasDifusas && state.coincidenciasDifusas.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <div className="flex items-start gap-3">
            <SearchCheck size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                Esta persona no tiene documento, y encontramos nombres parecidos ya registrados. Revisa antes
                de continuar:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {state.coincidenciasDifusas.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2">
                    <Link href={`/beneficiarios/${c.id}`} className="font-medium underline" target="_blank">
                      {c.nombres} ({c.codigoInterno})
                    </Link>
                    <span className="text-xs text-orange-700">
                      {c.municipio ?? "sin municipio"} · similitud {Math.round(c.score * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <label className="flex items-start gap-2 border-t border-orange-200 pt-3">
            <input
              type="checkbox"
              name="confirmarSinCoincidencia"
              required
              className="mt-0.5 h-4 w-4 rounded border-orange-400 text-brand-700 focus:ring-brand-400"
            />
            <span>
              Confirmo que revisé la lista y es una persona <strong>diferente</strong>; continuar con el
              registro nuevo.
            </span>
          </label>
        </div>
      )}

      <fieldset className={`grid gap-4 ${card} p-5 sm:grid-cols-2 sm:p-6`}>
        <FieldsetHeader icon={<IdCard size={16} />} title="Datos del beneficiario" />

        <Campo label="Nombres completos *">
          <input
            name="nombres"
            required
            minLength={2}
            maxLength={100}
            pattern="[A-Za-zÁÉÍÓÚÑÜáéíóúñü'\-\s]+"
            title="Solo letras y espacios"
            className={inputClass}
          />
        </Campo>

        <Campo
          label="Tipo de población *"
          hint="Define el enfoque diferencial de atención según su situación migratoria o social."
        >
          <select name="tipoPoblacion" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona una opción...
            </option>
            {TIPOS_POBLACION.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          label="Tipo de documento (opcional)"
          hint="Déjalo vacío si la persona no cuenta con documento de identidad."
        >
          <select
            name="tipoDocumento"
            defaultValue=""
            className={inputClass}
            onChange={(e) => setTieneDocumento(e.target.value !== "")}
          >
            <option value="">Sin documento</option>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label={`Número de documento${tieneDocumento ? " *" : ""}`}>
          <input
            name="numeroDocumento"
            required={tieneDocumento}
            pattern="[A-Za-z0-9\-]{4,15}"
            title="Alfanumérico, entre 4 y 15 caracteres (se permite guion)"
            className={inputClass}
          />
        </Campo>

        <Campo label="Fecha de nacimiento (o edad aproximada) *">
          <input type="date" name="fechaNacimiento" max={HOY} min={HACE_120_ANIOS} className={inputClass} />
        </Campo>

        <Campo label="Edad aproximada (si no se conoce la fecha)">
          <input type="number" name="edadAproximada" min={0} max={120} className={inputClass} />
        </Campo>

        <Campo label="Género *">
          <select name="genero" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona una opción...
            </option>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiere no decir">Prefiere no decir</option>
          </select>
        </Campo>

        <Campo label="Municipio *">
          <select name="municipio" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Seleccionar...
            </option>
            {MUNICIPIOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Teléfono de contacto">
          <input
            type="tel"
            name="telefono"
            pattern="\+?[0-9]{7,15}"
            title="Entre 7 y 15 dígitos, opcionalmente con + al inicio"
            className={inputClass}
          />
        </Campo>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="discapacidad"
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-400"
              onChange={(e) => setTieneDiscapacidad(e.target.checked)}
            />
            La persona tiene alguna discapacidad
          </label>
          {tieneDiscapacidad && (
            <div className="mt-3 max-w-sm">
              <Campo label="¿Qué tipo de discapacidad? *">
                <input
                  name="tipoDiscapacidad"
                  list="tipos-discapacidad"
                  required={tieneDiscapacidad}
                  placeholder="Selecciona una opción o escribe la tuya..."
                  className={inputClass}
                />
                <datalist id="tipos-discapacidad">
                  {TIPOS_DISCAPACIDAD.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Campo>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={`grid gap-4 ${card} p-5 sm:grid-cols-2 sm:p-6`}>
        <FieldsetHeader icon={<Users size={16} />} title="Núcleo familiar (opcional, hasta 2 integrantes)" />
        <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">
          Registrar al menos un integrante ayuda a contextualizar la situación familiar, pero no es
          obligatorio para completar el registro.
        </p>
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-[1fr_1fr]">
            <Campo label={`Nombre del familiar ${i + 1}`}>
              <input
                name="familiarNombres"
                pattern="[A-Za-zÁÉÍÓÚÑÜáéíóúñü'\-\s]*"
                title="Solo letras y espacios"
                className={inputClass}
              />
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
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-400"
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
