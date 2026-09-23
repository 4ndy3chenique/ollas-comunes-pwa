interface StepperProps {
  pasos: { clave: string; etiqueta: string }[];
  pasoActualIndex: number;
  esNoApta?: boolean;
}

export function Stepper({ pasos, pasoActualIndex, esNoApta }: StepperProps) {
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {pasos.map((paso, index) => {
        const completado = index < pasoActualIndex;
        const actual = index === pasoActualIndex;
        const esUltimoYNoApta = esNoApta && index === pasos.length - 1;

        return (
          <li key={paso.clave} className="flex flex-1 items-start sm:flex-col">
            <div className="flex items-center sm:w-full">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  esUltimoYNoApta
                    ? "border-danger bg-danger-light text-danger"
                    : completado
                    ? "border-primary bg-primary text-white"
                    : actual
                    ? "border-primary bg-white text-primary"
                    : "border-border bg-white text-muted"
                }`}
              >
                {completado ? "✓" : index + 1}
              </div>
              {index < pasos.length - 1 && (
                <div
                  className={`hidden h-0.5 flex-1 sm:block ${
                    completado ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-2 pb-4 pl-3 text-sm sm:pl-0 ${
                actual || completado ? "font-medium text-ink" : "text-muted"
              }`}
            >
              {paso.etiqueta}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
