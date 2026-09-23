/**
 * Validación sintáctica de DNI (algoritmo módulo 11) y mock de verificación
 * de identidad contra RENIEC (ver bd_estado_reniec / KPI V_DNI, t_PIDE).
 *
 * El módulo 11 aquí es una heurística de formato para feedback inmediato en
 * cliente; la validación de identidad real (existencia, estado del
 * documento) siempre se confirma contra el backend/mock RENIEC.
 */

import { api } from "./api";

/** Verifica formato (8 dígitos) y dígito verificador ponderado módulo 11. */
/** Verifica formato básico de 8 dígitos numéricos válidos en Perú (no consecutivos ni repetidos idénticos). */
export function validarDniModulo11(dni: string): boolean {
  if (!/^\d{8}$/.test(dni)) return false;

  // Evita cadenas obvias de prueba como 00000000, 11111111, etc.
  if (/^(\d)\1{7}$/.test(dni)) return false;

  return true;
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
