import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EmptyState } from "../components/ui/EmptyState";
import type { CicloPostulacion } from "../types";

const TONO_POR_ESTADO = {
  APTA: "exito",
  NO_APTA: "peligro",
  OBSERVADA: "alerta",
  PENDIENTE: "neutro",
  EN_EVALUACION: "info",
} as const;

export default function HistorialPage() {
  const { usuario } = useAuth();
  const [ciclos, setCiclos] = useState<CicloPostulacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<CicloPostulacion[]>(`/ollas-comunes/${usuario?.olla_id}/historial-postulaciones`)
      .then(setCiclos)
      .finally(() => setCargando(false));
  }, [usuario?.olla_id]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Historial de postulaciones</h1>
      <p className="mt-1 text-muted">Revisa tus ciclos de evaluación anteriores y sus resultados.</p>

      <div className="mt-6">
        {cargando ? (
          <p className="text-muted">Cargando historial…</p>
        ) : ciclos.length === 0 ? (
          <EmptyState
            titulo="Aún no tienes postulaciones anteriores"
            descripcion="Cuando completes tu primer ciclo de evaluación, aparecerá registrado aquí."
          />
        ) : (
          <ol className="flex flex-col gap-4 border-l-2 border-border pl-5">
            {ciclos.map((ciclo) => (
              <li key={ciclo.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                <div className="card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted">
                      Solicitado el {new Date(ciclo.fecha_solicitud).toLocaleDateString("es-PE", { dateStyle: "long" })}
                    </p>
                    <StatusBadge estado={ciclo.estado_final} tono={TONO_POR_ESTADO[ciclo.estado_final]} />
                  </div>
                  {ciclo.fecha_resolucion && (
                    <p className="mt-1 text-sm text-muted">
                      Resuelto el {new Date(ciclo.fecha_resolucion).toLocaleDateString("es-PE", { dateStyle: "long" })}
                    </p>
                  )}
                  {ciclo.observaciones && (
                    <p className="mt-2 text-sm text-ink">{ciclo.observaciones}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
