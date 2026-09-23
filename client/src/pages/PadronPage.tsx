import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Fallback seguro: lee de usuario o directamente de la sesión guardada en localStorage
  const ollaIdEfectivo =
    usuario?.olla_id ??
    (() => {
      try {
        const stored = localStorage.getItem("sesion_usuario");
        return stored ? JSON.parse(stored).olla_id : null;
      } catch {
        return null;
      }
    })();

  const cargarPadron = useCallback(async () => {
    if (!ollaIdEfectivo) {
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const datos = await api.get<Beneficiario[]>(
        `/ollas-comunes/${ollaIdEfectivo}/beneficiarios`
      );
      setBeneficiarios(datos || []);
    } catch {
      setBeneficiarios([]);
    } finally {
      setCargando(false);
    }
  }, [ollaIdEfectivo]);

  useEffect(() => {
    cargarPadron();
  }, [cargarPadron]);

  const totalIntegrantes = beneficiarios.reduce(
    (acc, b) => acc + (Number(b.integrantes_hogar) || 1),
    0
  );
  const conAlerta = beneficiarios.filter((b) => b.estado_padron === "DUPLICADO").length;

  return (
    <div>
      {!ollaIdEfectivo && (
        <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-medium text-amber-900">
                Aún no has registrado los datos de tu Olla Común
              </h3>
              <p className="text-sm text-amber-700">
                Debes registrar tu organización antes de asociar familias a tu padrón.
              </p>
            </div>
            <Link
              to="/registro-olla"
              className="rounded bg-amber-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-amber-800 shrink-0"
            >
              Registrar Olla
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Padrón de beneficiarios</h1>
          <p className="mt-1 text-muted">
            {beneficiarios.length} familias registradas · {totalIntegrantes} integrantes en total
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {beneficiarios.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => navigate("/confirmacion")}
            >
              Continuar solicitud
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setMostrarFormulario(true)}
            disabled={!ollaIdEfectivo}
          >
            Agregar familia
          </button>
        </div>
      </div>

      {conAlerta > 0 && (
        <div className="mt-4 rounded border border-accent-light bg-accent-light px-4 py-3 text-sm text-accent">
          Hay {conAlerta} registro(s) marcados como posible duplicado. Revísalos antes de enviar tu solicitud.
        </div>
      )}

      {mostrarFormulario && ollaIdEfectivo && (
        <FormularioBeneficiario
          ollaId={ollaIdEfectivo}
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
            accion={
              ollaIdEfectivo
                ? {
                    etiqueta: "Agregar la primera familia",
                    onClick: () => setMostrarFormulario(true),
                  }
                : undefined
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {beneficiarios.map((b) => (
              <li
                key={b.id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {b.nombres} {b.apellidos}
                  </p>
                  <p className="text-sm text-muted">
                    DNI {b.dni} · {b.integrantes_hogar} integrante(s) de hogar
                    {b.condicion_nutricional ? ` · ${b.condicion_nutricional}` : ""}
                  </p>
                </div>
                <StatusBadge
                  estado={b.estado_padron}
                  tono={
                    b.estado_padron === "ACTIVO"
                      ? "exito"
                      : b.estado_padron === "DUPLICADO"
                      ? "peligro"
                      : "neutro"
                  }
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
  ollaId,
  onCancelar,
  onGuardado,
}: {
  ollaId: number;
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
    try {
      const resultado = await verificarConReniec(form.dni);
      if (resultado.motivo === "SIN_CONEXION") {
        setAvisoReniec("Sin conexión: se validará con RENIEC cuando el registro se sincronice.");
      } else if (!resultado.valido) {
        setAvisoReniec("RENIEC no encontró un documento válido con este número.");
      } else if (resultado.nombres) {
        setForm((f) => ({
          ...f,
          nombres: resultado.nombres!,
          apellidos: resultado.apellidos ?? f.apellidos,
        }));
      }
    } catch {
      // Ignora error silenciosamente para no interrumpir el llenado manual
    } finally {
      setValidandoDni(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validarDniModulo11(form.dni)) {
      setError("El DNI ingresado no tiene un formato válido (8 dígitos).");
      return;
    }

    setEnviando(true);
    try {
      await api.post(`/ollas-comunes/${ollaId}/beneficiarios`, form);
      onGuardado();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0 && usuario) {
        encolarTransaccion(usuario.id, "REGISTRO_BENEFICIARIO", form);
        onGuardado();
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setError("Este DNI ya está registrado en tu olla común (posible duplicado).");
      } else {
        setError(
          err instanceof ApiError ? err.message : "No pudimos guardar el registro. Intenta de nuevo."
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mt-4 flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="b-dni">
          DNI del integrante
        </label>
        <input
          id="b-dni"
          className="input-field"
          inputMode="numeric"
          maxLength={8}
          placeholder="8 dígitos numéricos"
          value={form.dni}
          onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
          onBlur={onDniBlur}
          required
        />
        {validandoDni && <p className="mt-1 text-sm text-muted">Verificando con RENIEC…</p>}
        {avisoReniec && <p className="mt-1 text-sm text-accent">{avisoReniec}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="b-nombres">
            Nombres
          </label>
          <input
            id="b-nombres"
            className="input-field"
            value={form.nombres}
            onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="b-apellidos">
            Apellidos
          </label>
          <input
            id="b-apellidos"
            className="input-field"
            value={form.apellidos}
            onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="b-nacimiento">
            Fecha de nacimiento
          </label>
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
          <label className="label-field" htmlFor="b-integrantes">
            N.° integrantes de su hogar
          </label>
          <input
            id="b-integrantes"
            type="number"
            min={1}
            max={20}
            className="input-field"
            value={form.integrantes_hogar}
            onChange={(e) =>
              setForm({ ...form, integrantes_hogar: Number(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div>
        <label className="label-field" htmlFor="b-condicion">
          Condición nutricional (opcional)
        </label>
        <input
          id="b-condicion"
          className="input-field"
          placeholder="Ej. gestante, niño en riesgo de desnutrición, adulto mayor"
          value={form.condicion_nutricional}
          onChange={(e) =>
            setForm({ ...form, condicion_nutricional: e.target.value })
          }
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          className="btn-primary justify-center"
          disabled={enviando}
        >
          {enviando ? "Guardando…" : "Guardar familia"}
        </button>
        <button
          type="button"
          className="btn-secondary justify-center"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}