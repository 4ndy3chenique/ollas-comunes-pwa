import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ResumenExpediente } from "../types";

export default function ConfirmacionSolicitudPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState<ResumenExpediente | null>(null);
  const [aceptaDeclaracion, setAceptaDeclaracion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ResumenExpediente>(`/ollas-comunes/${usuario?.olla_id}/resumen`)
      .then(setResumen)
      .catch(() => setResumen(null));
  }, [usuario?.olla_id]);

  async function confirmarEnvio() {
    if (!aceptaDeclaracion) {
      setError("Debes aceptar la declaración jurada para continuar.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await api.post(`/ollas-comunes/${usuario?.olla_id}/solicitudes`, {});
      navigate("/solicitud");
    } catch {
      setError("No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  }

  if (!resumen) {
    return <p className="text-muted">Cargando expediente…</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Revisa tu expediente</h1>
      <p className="mt-1 text-muted">
        Verifica que la información esté completa antes de enviarla al programa. Una vez enviada, pasará a evaluación.
      </p>

      <div className="card mt-6">
        <h2 className="font-medium text-ink">{resumen.olla.nombre}</h2>
        <p className="text-sm text-muted">{resumen.olla.direccion}, {resumen.olla.distrito}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5">
          <div>
            <dt className="text-sm text-muted">Familias registradas</dt>
            <dd className="text-2xl font-semibold text-ink">{resumen.total_familias}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Integrantes totales</dt>
            <dd className="text-2xl font-semibold text-ink">{resumen.total_integrantes}</dd>
          </div>
        </dl>

        {resumen.beneficiarios_con_alerta > 0 && (
          <p className="mt-4 rounded border border-accent-light bg-accent-light px-3 py-2 text-sm text-accent">
            {resumen.beneficiarios_con_alerta} registro(s) tienen alertas de duplicidad sin resolver. Puedes enviar
            igual, pero el programa podría observarlos.
          </p>
        )}
      </div>

      <div className="card mt-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary"
            checked={aceptaDeclaracion}
            onChange={(e) => setAceptaDeclaracion(e.target.checked)}
          />
          <span className="text-sm text-ink">
            Declaro bajo juramento que la información registrada es verdadera y autorizo el tratamiento de estos
            datos personales conforme a la Ley N.° 29733 de Protección de Datos Personales, exclusivamente para
            fines de evaluación y asignación del programa.
          </span>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        className="btn-primary mt-5 w-full justify-center sm:w-auto"
        onClick={confirmarEnvio}
        disabled={enviando}
      >
        {enviando ? "Enviando…" : "Confirmar y enviar solicitud"}
      </button>
    </div>
  );
}
