import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { validarDniModulo11, verificarConReniec } from "../lib/dniValidation";
import { encolarTransaccion } from "../lib/offlineQueue";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import type { Beneficiario, RegistroBeneficiarioInput } from "../types";

const FORM_VACIO: RegistroBeneficiarioInput = {
  dni: "",
  nombres: "",
  apellidos: "",
  fecha_nacimiento: "",
  integrantes_hogar: 1,
  condicion_nutricional: "",
};

export default function PadronPage() {
  const { usuario } = useAuth();
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargarPadron = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await api.get<Beneficiario[]>(`/ollas-comunes/${usuario?.olla_id}/beneficiarios`);
      setBeneficiarios(datos);
    } catch {
      setBeneficiarios([]);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarPadron();
  }, [cargarPadron]);

  const totalIntegrantes = beneficiarios.reduce((acc, b) => acc + b.integrantes_hogar, 0);
  const conAlerta = beneficiarios.filter((b) => b.estado_padron === "DUPLICADO").length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Padrón de beneficiarios</h1>
          <p className="mt-1 text-muted">
            {beneficiarios.length} familias registradas · {totalIntegrantes} integrantes en total
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => setMostrarFormulario(true)}>
          Agregar familia
        </button>
      </div>

      {conAlerta > 0 && (
        <div className="mt-4 rounded border border-accent-light bg-accent-light px-4 py-3 text-sm text-accent">
          Hay {conAlerta} registro(s) marcados como posible duplicado. Revísalos antes de enviar tu solicitud.
        </div>
      )}

      {mostrarFormulario && (
        <FormularioBeneficiario
          onCancelar={() => setMostrarFormulario(false)}
          onGuardado={() => {
            setMostrarFormulario(false);
            cargarPadron();
          }}
        />
      )}

      <div className="mt-6">
        {cargando ? (
          <p className="text-muted">Cargando padrón…</p>
        ) : beneficiarios.length === 0 ? (
          <EmptyState
            titulo="Todavía no registraste familias"
            descripcion="Agrega a las familias que integran tu olla común para poder enviar tu solicitud al programa."
            accion={{ etiqueta: "Agregar la primera familia", onClick: () => setMostrarFormulario(true) }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {beneficiarios.map((b) => (
              <li key={b.id} className="card flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{b.nombres} {b.apellidos}</p>
                  <p className="text-sm text-muted">
                    DNI {b.dni} · {b.integrantes_hogar} integrante(s) de hogar
                  </p>
                </div>
                <StatusBadge
                  estado={b.estado_padron}
                  tono={b.estado_padron === "ACTIVO" ? "exito" : b.estado_padron === "DUPLICADO" ? "peligro" : "neutro"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormularioBeneficiario({
  onCancelar,
  onGuardado,
}: {
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const { usuario } = useAuth();
  const [form, setForm] = useState<RegistroBeneficiarioInput>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [avisoReniec, setAvisoReniec] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [validandoDni, setValidandoDni] = useState(false);

  async function onDniBlur() {
    if (!validarDniModulo11(form.dni)) return;
    setValidandoDni(true);
    setAvisoReniec(null);
    const resultado = await verificarConReniec(form.dni);
    setValidandoDni(false);
    if (resultado.motivo === "SIN_CONEXION") {
      setAvisoReniec("Sin conexión: se validará con RENIEC cuando el registro se sincronice.");
    } else if (!resultado.valido) {
      setAvisoReniec("RENIEC no encontró un documento válido con este número.");
    } else if (resultado.nombres) {
      setForm((f) => ({ ...f, nombres: resultado.nombres!, apellidos: resultado.apellidos ?? f.apellidos }));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validarDniModulo11(form.dni)) {
      setError("El DNI ingresado no tiene un formato válido.");
      return;
    }

    setEnviando(true);
    try {
      await api.post(`/ollas-comunes/${usuario?.olla_id}/beneficiarios`, form);
      onGuardado();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        encolarTransaccion(usuario!.id, "REGISTRO_BENEFICIARIO", form);
        onGuardado();
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setError("Este DNI ya está registrado en tu olla común (posible duplicado).");
      } else {
        setError("No pudimos guardar el registro. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-4 flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="b-dni">DNI del integrante</label>
        <input
          id="b-dni"
          className="input-field"
          inputMode="numeric"
          maxLength={8}
          value={form.dni}
          onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
          onBlur={onDniBlur}
          required
        />
        {validandoDni && <p className="mt-1 text-sm text-muted">Verificando con RENIEC…</p>}
        {avisoReniec && <p className="mt-1 text-sm text-accent">{avisoReniec}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="b-nombres">Nombres</label>
          <input
            id="b-nombres"
            className="input-field"
            value={form.nombres}
            onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="b-apellidos">Apellidos</label>
          <input
            id="b-apellidos"
            className="input-field"
            value={form.apellidos}
            onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="b-nacimiento">Fecha de nacimiento</label>
          <input
            id="b-nacimiento"
            type="date"
            className="input-field"
            value={form.fecha_nacimiento}
            onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="b-integrantes">N.° integrantes de su hogar</label>
          <input
            id="b-integrantes"
            type="number"
            min={1}
            max={20}
            className="input-field"
            value={form.integrantes_hogar}
            onChange={(e) => setForm({ ...form, integrantes_hogar: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="b-condicion">Condición nutricional (opcional)</label>
        <input
          id="b-condicion"
          className="input-field"
          placeholder="Ej. gestante, niño en riesgo de desnutrición, adulto mayor"
          value={form.condicion_nutricional}
          onChange={(e) => setForm({ ...form, condicion_nutricional: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary justify-center" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar familia"}
        </button>
        <button type="button" className="btn-secondary justify-center" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
