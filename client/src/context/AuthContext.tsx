import { createContext, useContext, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type {
  Usuario,
  SesionAutenticada,
  LoginInput,
  RegistroDirigenteInput,
} from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (input: LoginInput) => Promise<void>;
  registrar: (input: RegistroDirigenteInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const KEY_USUARIO = "sesion_usuario";
const KEY_ACCESS = "access_token";
const KEY_REFRESH = "refresh_token";

function guardarSesion(sesion: SesionAutenticada) {
  localStorage.setItem(KEY_USUARIO, JSON.stringify(sesion.usuario));
  localStorage.setItem(KEY_ACCESS, sesion.access_token);
  localStorage.setItem(KEY_REFRESH, sesion.refresh_token);
}

function limpiarSesion() {
  localStorage.removeItem(KEY_USUARIO);
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
}

function leerUsuarioGuardado(): Usuario | null {
  const guardado = localStorage.getItem(KEY_USUARIO);
  if (!guardado) return null;
  try {
    return JSON.parse(guardado) as Usuario;
  } catch {
    limpiarSesion();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuarioGuardado);
  const cargando = false;

  async function login(input: LoginInput) {
    const sesion = await api.post<SesionAutenticada>("/auth/login", input);
    if (sesion.usuario.estado !== "ACTIVO") {
      throw new ApiError(
        sesion.usuario.estado === "BLOQUEADO"
          ? "Tu cuenta está bloqueada. Contacta al administrador del programa."
          : "Tu cuenta está suspendida temporalmente.",
        403
      );
    }
    guardarSesion(sesion);
    setUsuario(sesion.usuario);
  }

  async function registrar(input: RegistroDirigenteInput) {
    const sesion = await api.post<SesionAutenticada>("/auth/registro-dirigente", input);
    guardarSesion(sesion);
    setUsuario(sesion.usuario);
  }

  function logout() {
    limpiarSesion();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
