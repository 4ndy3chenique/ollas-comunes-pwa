import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { OllaComun } from "../types";

export default function PerfilPage() {
  const { usuario, logout } = useAuth();
  const [olla, setOlla] = useState<OllaComun | null>(null);

  useEffect(() => {
    if (usuario?.olla_id) {
      api.get<OllaComun>(`/ollas-comunes/${usuario.olla_id}`).then(setOlla);
    }
  }, [usuario?.olla_id]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mi perfil</h1>
        <p className="mt-1 text-muted">Actualiza tus datos de contacto y los de tu organización.</p>
      </div>

      <SeccionDatosPersonales />

      {olla && <SeccionDatosOlla olla={olla} onGuardado={setOlla} />}

      <SeccionCambiarContrasena />

      <button onClick={logout} className="btn-secondary self-start text-danger">
        Cerrar sesión
      </button>
    </div>
  );
}

function SeccionDatosPersonales() {
  const { usuario } = useAuth();
  const [nombres, setNombres] = useState(usuario?.nombres ?? "");
  const [apellidos, setApellidos] = useState(usuario?.apellidos ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setGuardado(false);
    try {
      await api.put(`/usuarios/${usuario?.id}`, { nombres, apellidos, email });
      setGuardado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <h2 className="font-medium text-ink">Datos del dirigente</h2>
      <div>
        <label className="label-field">DNI</label>
        <input className="input-field bg-bg text-muted" value={usuario?.dni ?? ""} disabled />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="p-nombres">Nombres</label>
          <input id="p-nombres" className="input-field" value={nombres} onChange={(e) => setNombres(e.target.value)} />
        </div>
        <div>
          <label className="label-field" htmlFor="p-apellidos">Apellidos</label>
          <input id="p-apellidos" className="input-field" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label-field" htmlFor="p-email">Correo electrónico</label>
        <input id="p-email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {guardado && <p className="text-sm text-primary">Tus datos se guardaron correctamente.</p>}
      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function SeccionDatosOlla({ olla, onGuardado }: { olla: OllaComun; onGuardado: (o: OllaComun) => void }) {
  const [direccion, setDireccion] = useState(olla.direccion);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setGuardado(false);
    try {
      const actualizada = await api.put<OllaComun>(`/ollas-comunes/${olla.id}`, { direccion });
      onGuardado(actualizada);
      setGuardado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <h2 className="font-medium text-ink">Datos de la olla común</h2>
      <div>
        <label className="label-field">Nombre</label>
        <input className="input-field bg-bg text-muted" value={olla.nombre} disabled />
      </div>
      <div>
        <label className="label-field" htmlFor="o-direccion">Dirección / punto de entrega</label>
        <input id="o-direccion" className="input-field" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      </div>
      {guardado && <p className="text-sm text-primary">La dirección se actualizó correctamente.</p>}
      <button type="submit" className="btn-primary self-start" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function SeccionCambiarContrasena() {
  const { usuario } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);
    setEnviando(true);
    try {
      await api.put(`/usuarios/${usuario?.id}/contrasena`, { actual, nueva });
      setExito(true);
      setActual("");
      setNueva("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos actualizar tu contraseña.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-4">
      <h2 className="font-medium text-ink">Cambiar contraseña</h2>
      <div>
        <label className="label-field" htmlFor="c-actual">Contraseña actual</label>
        <input id="c-actual" type="password" className="input-field" value={actual} onChange={(e) => setActual(e.target.value)} required />
      </div>
      <div>
        <label className="label-field" htmlFor="c-nueva">Nueva contraseña</label>
        <input id="c-nueva" type="password" className="input-field" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {exito && <p className="text-sm text-primary">Tu contraseña se actualizó correctamente.</p>}
      <button type="submit" className="btn-secondary self-start" disabled={enviando}>
        {enviando ? "Actualizando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
