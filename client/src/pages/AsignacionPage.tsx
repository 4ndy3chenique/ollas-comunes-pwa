import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import type { OllaComun, AsignacionNutricional } from "../types";

export default function AsignacionPage() {
  const { usuario } = useAuth();
  const [olla, setOlla] = useState<OllaComun | null>(null);
  const [asignacion, setAsignacion] = useState<AsignacionNutricional | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario?.olla_id) return;
    Promise.all([
      api.get<OllaComun>(`/ollas-comunes/${usuario.olla_id}`),
      api.get<AsignacionNutricional>(`/ollas-comunes/${usuario.olla_id}/asignacion-vigente`).catch(() => null),
    ])
      .then(([o, a]) => {
        setOlla(o);
        setAsignacion(a);
      })
      .finally(() => setCargando(false));
  }, [usuario?.olla_id]);

  if (cargando) return <p className="text-muted">Cargando…</p>;

  if (!olla || olla.estado_aprobacion !== "APTA") {
    return (
      <EmptyState
        titulo="Todavía no hay una asignación disponible"
        descripcion="Los insumos y porciones se calculan una vez que tu olla común es reconocida como apta por el programa."
      />
    );
  }

  return (
    <div>
      <div className="card border-primary bg-primary-light">
        <p className="text-sm font-medium text-primary-dark">Olla reconocida y apta</p>
        <h1 className="mt-1 text-xl font-semibold text-primary-dark">{olla.nombre}</h1>
        {olla.fecha_aprobacion && (
          <p className="mt-1 text-sm text-primary-dark">
            Aprobada el {new Date(olla.fecha_aprobacion).toLocaleDateString("es-PE", { dateStyle: "long" })}
          </p>
        )}
      </div>

      {!asignacion ? (
        <p className="mt-6 text-muted">Tu asignación de insumos se está calculando. Vuelve a revisar en unas horas.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-sm text-muted">Kcal totales / periodo</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{asignacion.kcal_total.toLocaleString("es-PE")}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted">Porciones diarias estimadas</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{asignacion.porciones_diarias_estimadas}</p>
            </div>
          </div>

          <div className="card mt-4">
            <h2 className="font-medium text-ink">Insumos asignados</h2>
            <p className="mt-1 text-sm text-muted">
              Calculados según tablas MIDIS para el tipo de ración: {asignacion.programacion.tipo_racion}
            </p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Insumo</th>
                  <th className="pb-2 font-medium text-right">Kg asignados</th>
                </tr>
              </thead>
              <tbody>
                {asignacion.gramajes.map((g) => (
                  <tr key={g.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 text-ink">{g.insumo}</td>
                    <td className="py-2.5 text-right text-ink">{g.kg_calculado.toFixed(2)} kg</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-medium text-ink">Total</td>
                  <td className="pt-3 text-right font-medium text-ink">
                    {asignacion.kg_insumos_total.toFixed(2)} kg
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
