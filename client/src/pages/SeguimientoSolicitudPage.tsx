import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Stepper } from "../components/ui/Stepper";
import type { OllaComun, EstadoAprobacionOlla } from "../types";

const PASOS: { clave: EstadoAprobacionOlla; etiqueta: string }[] = [
  { clave: "PENDIENTE", etiqueta: "Registrada" },
  { clave: "EN_EVALUACION", etiqueta: "En evaluación" },
  { clave: "OBSERVADA", etiqueta: "Observada" },
  { clave: "APTA", etiqueta: "Apta / No apta" },
];

function indiceDelEstado(estado: EstadoAprobacionOlla): number {
  if (estado === "NO_APTA") return PASOS.length - 1;
  const idx = PASOS.findIndex((p) => p.clave === estado);
  return idx === -1 ? 0 : idx;
}

export default function SeguimientoSolicitudPage() {
  const { usuario } = useAuth();
  const [olla, setOlla] = useState<OllaComun | null>(null);

  useEffect(() => {
    if (!usuario?.olla_id) return;
    api.get<OllaComun>(`/ollas-comunes/${usuario.olla_id}`).then(setOlla);
    const intervalo = setInterval(() => {
      api.get<OllaComun>(`/ollas-comunes/${usuario.olla_id}`).then(setOlla);
    }, 15000);
    return () => clearInterval(intervalo);
  }, [usuario?.olla_id]);

  if (!olla) return <p className="text-muted">Cargando estado de tu solicitud…</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Estado de tu solicitud</h1>
      <p className="mt-1 text-muted">{olla.nombre}</p>

      <div className="card mt-6">
        <Stepper
          pasos={PASOS}
          pasoActualIndex={indiceDelEstado(olla.estado_aprobacion)}
          esNoApta={olla.estado_aprobacion === "NO_APTA"}
        />
      </div>

      {olla.estado_aprobacion === "OBSERVADA" && (
        <div className="card mt-4 border-accent-light bg-accent-light">
          <p className="font-medium text-accent">Tu solicitud tiene observaciones</p>
          <p className="mt-1 text-sm text-accent">
            Revisa el padrón de beneficiarios: puede haber DNIs duplicados o datos incompletos que debes corregir.
          </p>
          <Link to="/padron" className="btn-secondary mt-3 inline-flex">Revisar padrón</Link>
        </div>
      )}

      {olla.estado_aprobacion === "APTA" && (
        <div className="card mt-4 border-primary bg-primary-light">
          <p className="font-medium text-primary-dark">¡Tu olla común fue reconocida como apta!</p>
          <p className="mt-1 text-sm text-primary-dark">
            Ya puedes ver los insumos y porciones asignadas para tu organización.
          </p>
          <Link to="/insumos" className="btn-primary mt-3 inline-flex">Ver asignación</Link>
        </div>
      )}

      {olla.estado_aprobacion === "NO_APTA" && (
        <div className="card mt-4 border-danger-light bg-danger-light">
          <p className="font-medium text-danger">Tu solicitud no fue aprobada en este ciclo</p>
          <p className="mt-1 text-sm text-danger">
            Puedes revisar el historial para más detalle y volver a postular en el siguiente ciclo de evaluación.
          </p>
          <Link to="/historial" className="btn-secondary mt-3 inline-flex">Ver historial</Link>
        </div>
      )}

      {olla.estado_aprobacion === "PENDIENTE" && (
        <p className="mt-4 text-sm text-muted">
          Tu solicitud fue registrada y está en cola para ser asignada a un evaluador del programa.
        </p>
      )}
    </div>
  );
}
