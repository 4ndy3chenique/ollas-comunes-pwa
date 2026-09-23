import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { encolarTransaccion } from "../lib/offlineQueue";
import type { OllaComun, RegistroOllaInput } from "../types";

const DISTRITOS = [
  "San Juan de Lurigancho",
  "Villa El Salvador",
  "San Juan de Miraflores",
  "Comas",
  "Ate",
  "Villa María del Triunfo",
  "Independencia",
  "Otro",
];

export default function RegistroOllaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistroOllaInput>({
    nombre: "",
    direccion: "",
    distrito: DISTRITOS[0],
    referencia: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    // Adjuntamos el ID del dirigente autenticado
    const payload = {
      ...form,
      usuario_id: usuario?.id,
    };

    try {
      const nuevaOlla = await api.post<OllaComun>("/ollas-comunes", payload);

      // Actualizar el objeto de usuario en localStorage para que el sistema reconozca que ya tiene olla_id
      if (usuario && nuevaOlla?.id) {
        const usuarioActualizado = { ...usuario, olla_id: nuevaOlla.id };
        localStorage.setItem("sesion_usuario", JSON.stringify(usuarioActualizado));
        // Si tienes una función en tu AuthContext para setUsuario, se llamaría aquí
      }

      navigate("/padron");
    } catch (err) {
      if (err instanceof ApiError && err.status === 0 && usuario) {
        // En caso de modo offline
        encolarTransaccion(usuario.id, "REGISTRO_OLLA", form);
        navigate("/padron");
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "No pudimos registrar tu olla común. Intenta de nuevo en unos minutos."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Registra tu olla común</h1>
      <p className="mt-1 text-muted">
        Estos datos identifican a tu organización ante el programa. Podrás actualizarlos después desde tu perfil.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-4">
        <div>
          <label className="label-field" htmlFor="nombre">
            Nombre de la olla común
          </label>
          <input
            id="nombre"
            className="input-field"
            placeholder="Ej. Olla Común Unidas Venceremos"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label-field" htmlFor="distrito">
            Distrito
          </label>
          <select
            id="distrito"
            className="input-field"
            value={form.distrito}
            onChange={(e) => setForm({ ...form, distrito: e.target.value })}
          >
            {DISTRITOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-field" htmlFor="direccion">
            Dirección
          </label>
          <input
            id="direccion"
            className="input-field"
            placeholder="Jirón, número, referencia de manzana/lote"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label-field" htmlFor="referencia">
            Punto de referencia (opcional)
          </label>
          <input
            id="referencia"
            className="input-field"
            placeholder="Ej. A media cuadra del mercado"
            value={form.referencia}
            onChange={(e) => setForm({ ...form, referencia: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" className="btn-primary mt-2 justify-center" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}