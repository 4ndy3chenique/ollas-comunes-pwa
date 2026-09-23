/**
 * Validación sintáctica de DNI (algoritmo módulo 11) y mock de verificación
 * de identidad contra RENIEC (ver bd_estado_reniec / KPI V_DNI, t_PIDE).
 *
 * El módulo 11 aquí es una heurística de formato para feedback inmediato en
 * cliente; la validación de identidad real (existencia, estado del
 * documento) siempre se confirma contra el backend/mock RENIEC.
 */

import { api } from "./api";

const PESOS_MODULO11 = [3, 2, 7, 6, 5, 4, 3, 2];

/** Verifica formato (8 dígitos) y dígito verificador ponderado módulo 11. */
export function validarDniModulo11(dni: string): boolean {
  if (!/^\d{8}$/.test(dni)) return false;

  const digitos = dni.split("").map(Number);
  const digitoVerificador = digitos[7];
  const suma = digitos
    .slice(0, 7)
    .reduce((acc, digito, i) => acc + digito * PESOS_MODULO11[i], 0);

  const resto = suma % 11;
  const calculado = resto <= 1 ? 0 : 11 - resto;

  return calculado === digitoVerificador;
}

export interface ResultadoValidacionReniec {
  dni: string;
  valido: boolean;
  nombres?: string;
  apellidos?: string;
  estado_documento?: "VIGENTE" | "VENCIDO" | "ANULADO" | "OBSERVADO";
  motivo?: string;
}

/**
 * Consulta el microservicio mock RENIEC (bd_estado_reniec) vía backend PHP.
 * Se usa tras la validación de formato en cliente, antes de guardar el
 * beneficiario en el padrón.
 */
export async function verificarConReniec(
  dni: string
): Promise<ResultadoValidacionReniec> {
  try {
    return await api.get<ResultadoValidacionReniec>(`/reniec/verificar/${dni}`);
  } catch {
    // Si no hay red, se difiere la verificación: se guarda localmente y se
    // valida contra RENIEC cuando la cola offline sincronice.
    return { dni, valido: validarDniModulo11(dni), motivo: "SIN_CONEXION" };
  }
}
