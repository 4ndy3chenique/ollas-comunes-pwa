import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ENLACES = [
  { to: "/padron", etiqueta: "Padrón", icono: "👪" },
  { to: "/solicitud", etiqueta: "Mi Solicitud", icono: "📋" },
  { to: "/insumos", etiqueta: "Insumos", icono: "🥗" },
  { to: "/notificaciones", etiqueta: "Avisos", icono: "🔔" },
  { to: "/perfil", etiqueta: "Perfil", icono: "👤" },
];

export function NavBar() {
  const { usuario, logout } = useAuth();

  return (
    <>
      {/* Barra superior — visible desde sm hacia arriba */}
      <header className="hidden border-b border-border bg-surface sm:block">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold text-primary-dark">
              Ollas Comunes · Solicitante
            </span>
            <nav className="flex gap-1">
              {ENLACES.map((enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  className={({ isActive }) =>
                    `rounded px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-light text-primary-dark"
                        : "text-muted hover:bg-bg hover:text-ink"
                    }`
                  }
                >
                  {enlace.etiqueta}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{usuario?.nombres}</span>
            <button onClick={logout} className="text-sm font-medium text-danger hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Barra inferior — visible solo en móvil, pensada para pulgar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface sm:hidden">
        {ENLACES.map((enlace) => (
          <NavLink
            key={enlace.to}
            to={enlace.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
                isActive ? "text-primary-dark" : "text-muted"
              }`
            }
          >
            <span className="text-lg leading-none">{enlace.icono}</span>
            {enlace.etiqueta}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
