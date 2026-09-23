import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { validarDniModulo11 } from "../lib/dniValidation";

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-primary-dark">Ollas Comunes</h1>
          <p className="mt-1 text-muted">Plataforma del Solicitante</p>
        </div>

        <div className="card">
          <div className="mb-6 flex rounded-sm bg-bg p-1">
            <button
              className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
                modo === "login" ? "bg-surface text-ink shadow-sm" : "text-muted"
              }`}
              onClick={() => setModo("login")}
            >
              Ingresar
            </button>
            <button
              className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
                modo === "registro" ? "bg-surface text-ink shadow-sm" : "text-muted"
              }`}
              onClick={() => setModo("registro")}
            >
              Crear cuenta
            </button>
          </div>

          {modo === "login" ? <FormularioLogin /> : <FormularioRegistro />}
        </div>
      </div>
    </div>
  );
}

function FormularioLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login({ identificador, password });
      navigate("/padron");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos iniciar tu sesión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="identificador">
          DNI o correo electrónico
        </label>
        <input
          id="identificador"
          className="input-field"
          placeholder="12345678 o tucorreo@ejemplo.com"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label-field" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

function FormularioRegistro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dni: "",
    nombres: "",
    apellidos: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const dniValido = form.dni.length === 0 || validarDniModulo11(form.dni);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validarDniModulo11(form.dni)) {
      setError("El DNI ingresado no tiene un formato válido. Revísalo e inténtalo de nuevo.");
      return;
    }

    setEnviando(true);
    try {
      await registrar(form);
      navigate("/registro-olla");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos crear tu cuenta. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="dni">
          DNI (8 dígitos)
        </label>
        <input
          id="dni"
          className="input-field"
          inputMode="numeric"
          maxLength={8}
          value={form.dni}
          onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, "") })}
          required
        />
        {!dniValido && <p className="mt-1 text-sm text-danger">Verifica que el DNI esté bien escrito.</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="nombres">Nombres</label>
          <input
            id="nombres"
            className="input-field"
            value={form.nombres}
            onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-field" htmlFor="apellidos">Apellidos</label>
          <input
            id="apellidos"
            className="input-field"
            value={form.apellidos}
            onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <label className="label-field" htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          className="input-field"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label-field" htmlFor="reg-password">Contraseña</label>
        <input
          id="reg-password"
          type="password"
          className="input-field"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
