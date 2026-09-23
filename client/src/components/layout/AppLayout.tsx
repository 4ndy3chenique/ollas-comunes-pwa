import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { NavBar } from "./NavBar";
import { contarPendientes } from "../../lib/offlineQueue";

export function AppLayout() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(contarPendientes());

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    const intervalo = setInterval(() => setPendientes(contarPendientes()), 4000);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
      clearInterval(intervalo);
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <NavBar />

      {(!enLinea || pendientes > 0) && (
        <div className="border-b border-accent-light bg-accent-light px-4 py-2 text-center text-sm text-accent">
          {!enLinea
            ? "Sin conexión. Tus cambios se guardan en este dispositivo y se enviarán al reconectar."
            : `Sincronizando ${pendientes} cambio(s) pendiente(s)...`}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
