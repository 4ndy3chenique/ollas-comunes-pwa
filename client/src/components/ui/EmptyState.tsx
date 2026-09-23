interface EmptyStateProps {
  titulo: string;
  descripcion: string;
  accion?: { etiqueta: string; onClick: () => void };
}

export function EmptyState({ titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-base font-medium text-ink">{titulo}</p>
      <p className="max-w-sm text-sm text-muted">{descripcion}</p>
      {accion && (
        <button onClick={accion.onClick} className="btn-secondary mt-3">
          {accion.etiqueta}
        </button>
      )}
    </div>
  );
}
