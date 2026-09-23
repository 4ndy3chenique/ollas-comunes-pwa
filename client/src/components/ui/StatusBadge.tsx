interface StatusBadgeProps {
  estado: string;
  tono: "neutro" | "exito" | "alerta" | "peligro" | "info";
}

const TONOS: Record<StatusBadgeProps["tono"], string> = {
  neutro: "bg-border/60 text-ink",
  exito: "bg-primary-light text-primary-dark",
  alerta: "bg-accent-light text-accent",
  peligro: "bg-danger-light text-danger",
  info: "bg-info-light text-info",
};

const ETIQUETAS: Record<string, string> = {
  ACTIVO: "Activo",
  DUPLICADO: "Duplicado",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
  EN_EVALUACION: "En evaluación",
  OBSERVADA: "Observada",
  APTA: "Apta",
  NO_APTA: "No apta",
  SINCRONIZADO: "Sincronizado",
  CONFLICTO: "Con conflicto",
  PROGRAMADO: "Programado",
  DESPACHADO: "Despachado",
  EN_TRANSITO: "En tránsito",
  RECEPCIONADO: "Recepcionado",
};

export function StatusBadge({ estado, tono }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-sm font-medium ${TONOS[tono]}`}
    >
      {ETIQUETAS[estado] ?? estado}
    </span>
  );
}
