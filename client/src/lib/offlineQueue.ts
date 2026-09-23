/**
 * Cola offline-first en el cliente. Persiste en localStorage (equivalente
 * ligero de IndexedDB para este cliente web) y refleja la estructura de
 * la tabla `cola_sincronizacion` de bd_operativa_central.
 *
 * Cuando vuelve la conexión, `sincronizarCola()` envía cada transacción
 * pendiente al backend usando su uuid_transaccion como clave de
 * idempotencia (INSERT IGNORE del lado del servidor).
 */

import { api } from "./api";
import type { TransaccionOffline, TipoTransaccionOffline } from "../types";

const STORAGE_KEY = "cola_sincronizacion_local";

function leerCola(): TransaccionOffline[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as TransaccionOffline[]) : [];
}

function escribirCola(cola: TransaccionOffline[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cola));
}

export function encolarTransaccion<T>(
  usuarioId: number,
  tipo: TipoTransaccionOffline,
  payload: T
): TransaccionOffline<T> {
  const transaccion: TransaccionOffline<T> = {
    uuid_transaccion: crypto.randomUUID(),
    usuario_id: usuarioId,
    tipo_transaccion: tipo,
    payload_json: payload,
    estado: "PENDIENTE",
    fecha_creacion_local: new Date().toISOString(),
  };

  const cola = leerCola();
  cola.push(transaccion as TransaccionOffline);
  escribirCola(cola);
  return transaccion;
}

export function obtenerPendientes(): TransaccionOffline[] {
  return leerCola().filter((t) => t.estado === "PENDIENTE");
}

export function contarPendientes(): number {
  return obtenerPendientes().length;
}

/** Intenta enviar cada transacción pendiente; marca SINCRONIZADO o CONFLICTO. */
export async function sincronizarCola(): Promise<{ enviadas: number; fallidas: number }> {
  const cola = leerCola();
  let enviadas = 0;
  let fallidas = 0;

  for (const transaccion of cola) {
    if (transaccion.estado !== "PENDIENTE") continue;
    try {
      await api.post("/sincronizacion/transacciones", transaccion);
      transaccion.estado = "SINCRONIZADO";
      enviadas++;
    } catch {
      transaccion.estado = "CONFLICTO";
      fallidas++;
    }
  }

  escribirCola(cola);
  return { enviadas, fallidas };
}

/** Se debe invocar una vez en el arranque de la app (ver App.tsx). */
export function registrarSincronizacionAutomatica(): void {
  window.addEventListener("online", () => {
    void sincronizarCola();
  });
}
