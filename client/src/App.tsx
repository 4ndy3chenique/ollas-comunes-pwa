import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
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
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/registro-olla" element={<RegistroOllaPage />} />
            <Route path="/padron" element={<PadronPage />} />
            <Route path="/confirmacion" element={<ConfirmacionSolicitudPage />} />
            <Route path="/solicitud" element={<SeguimientoSolicitudPage />} />
            <Route path="/insumos" element={<AsignacionPage />} />
            <Route path="/historial" element={<HistorialPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/padron" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
