import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { registrarSincronizacionAutomatica, sincronizarCola } from "./lib/offlineQueue";

import LoginPage from "./pages/LoginPage";
import RegistroOllaPage from "./pages/RegistroOllaPage";
import PadronPage from "./pages/PadronPage";
import ConfirmacionSolicitudPage from "./pages/ConfirmacionSolicitudPage";
import SeguimientoSolicitudPage from "./pages/SeguimientoSolicitudPage";
import AsignacionPage from "./pages/AsignacionPage";
import HistorialPage from "./pages/HistorialPage";
import NotificacionesPage from "./pages/NotificacionesPage";
import PerfilPage from "./pages/PerfilPage";

/**
 * Guardian que valida si el dirigente tiene registrada una olla.
 * Si no la tiene y navega por el sistema, lo redirige a /registro-olla.
 */
function VerificadorOlla({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();

  // Si el usuario está autenticado pero no tiene olla_id y no está ya en /registro-olla ni /perfil
  if (usuario && !usuario.olla_id && location.pathname !== "/registro-olla" && location.pathname !== "/perfil") {
    return <Navigate to="/registro-olla" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    registrarSincronizacionAutomatica();
    if (navigator.onLine) void sincronizarCola();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <VerificadorOlla>
                  <AppLayout />
                </VerificadorOlla>
              </ProtectedRoute>
            }
          >
            {/* Formulario accesible para registrar o actualizar datos de la olla */}
            <Route path="/registro-olla" element={<RegistroOllaPage />} />
            <Route path="/padron" element={<PadronPage />} />
            <Route path="/confirmacion" element={<ConfirmacionSolicitudPage />} />
            <Route path="/solicitud" element={<SeguimientoSolicitudPage />} />
            <Route path="/insumos" element={<AsignacionPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/padron" replace />} />
          <Route path="*" element={<Navigate to="/padron" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}