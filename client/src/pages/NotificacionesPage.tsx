import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyState } from "../components/ui/EmptyState";
import type { Notificacion, TipoNotificacion } from "../types";

const ICONO_POR_TIPO: Record<TipoNotificacion, string> = {
  APROBACION: "✅",
  OBSERVACION: "⚠️",
  DUPLICIDAD: "👥",
  DESPACHO_EN_CAMINO: "🚚",
};

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<Notificacion[]>("/notificaciones").then((datos) => {
      setNotificaciones(datos);
      setCargando(false);
    });
  }, []);

  async function marcarLeida(id: number) {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await api.put(`/notificaciones/${id}/leer`);
    } catch {
      /* se reintentará en la próxima carga */
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Notificaciones</h1>
      <p className="mt-1 text-muted">Avisos sobre tu solicitud, tu padrón y tus despachos.</p>

      <div className="mt-6">
        {cargando ? (
          <p className="text-muted">Cargando notificaciones…</p>
        ) : notificaciones.length === 0 ? (
          <EmptyState
            titulo="No tienes notificaciones"
            descripcion="Aquí verás avisos de aprobación, alertas de duplicidad y despachos en camino."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {notificaciones.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.leida && marcarLeida(n.id)}
                className={`card flex cursor-pointer items-start gap-3 ${!n.leida ? "border-l-4 border-l-primary" : ""}`}
              >
                <span className="text-xl leading-none">{ICONO_POR_TIPO[n.tipo]}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!n.leida ? "font-semibold text-ink" : "text-ink"}`}>{n.titulo}</p>
                  <p className="mt-0.5 text-sm text-muted">{n.mensaje}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(n.fecha).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
