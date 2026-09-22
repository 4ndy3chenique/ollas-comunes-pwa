export interface DniValidationResult {
  valido: boolean;
  mensaje: string;
}

export function useDniValidation() {

  const validarDni = (dni: string): DniValidationResult => {

    // Verificar si el DNI está vacío
    if (!dni.trim()) {
      return {
        valido: false,
        mensaje: "El DNI es obligatorio."
      };
    }

    // Verificar que solo contenga números
    if (!/^\d+$/.test(dni)) {
      return {
        valido: false,
        mensaje: "El DNI solo debe contener números."
      };
    }

    // Verificar que tenga exactamente 8 dígitos
    if (dni.length !== 8) {
      return {
        valido: false,
        mensaje: "El DNI debe tener exactamente 8 dígitos."
      };
    }

    // DNI con formato correcto
    return {
      valido: true,
      mensaje: "El DNI tiene un formato válido."
    };

  };

  return {
    validarDni
  };
}