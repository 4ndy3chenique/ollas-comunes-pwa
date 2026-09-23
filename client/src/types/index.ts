/**
 * Tipos de dominio — reflejan 1:1 las tablas de bd_operativa_central
 * involucradas en la Plataforma del Solicitante.
 * Mantener sincronizado con los scripts SQL (01_bd_operativa_central.sql).
 */

// ---------------------------------------------------------------------------
// roles / usuarios
// ---------------------------------------------------------------------------

export type NombreRol =
  | "SOLICITANTE_DIRIGENTE"
  | "ALMACENERO"
  | "TRANSPORTISTA"
  | "AUDITOR"
  | "ADMINISTRADOR";

export type EstadoUsuario = "ACTIVO" | "SUSPENDIDO" | "BLOQUEADO";

export interface Usuario {
  id: number;
  dni: string; // CHAR(8)
  nombres: string;
  apellidos: string;
  email: string;
  rol_id: number;
  rol_nombre: NombreRol;
  olla_id: number | null;
  estado: EstadoUsuario;
  created_at: string; // ISO datetime
}

/** Payload de registro; password_hash se calcula en el backend, nunca en cliente. */
export interface RegistroDirigenteInput {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface LoginInput {
  identificador: string; // DNI (8 dígitos) o email
  password: string;
}

export interface SesionAutenticada {
  usuario: Usuario;
  access_token: string;
  refresh_token: string;
  expira_en: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// ollas_comunes
// ---------------------------------------------------------------------------

export type EstadoAprobacionOlla =
  | "PENDIENTE"
  | "EN_EVALUACION"
  | "OBSERVADA"
  | "APTA"
  | "NO_APTA";

export interface OllaComun {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  solicitud_id_estado: number | null;
  estado_aprobacion: EstadoAprobacionOlla;
  fecha_aprobacion: string | null;
  created_at: string;
}

export interface RegistroOllaInput {
  nombre: string;
  direccion: string;
  distrito: string;
  referencia?: string;
}

// ---------------------------------------------------------------------------
// beneficiarios / duplicidad_beneficiarios
// ---------------------------------------------------------------------------

export type EstadoPadron = "ACTIVO" | "DUPLICADO" | "INACTIVO";

export interface Beneficiario {
  id: number;
  olla_id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string; // YYYY-MM-DD
  integrantes_hogar: number;
  condicion_nutricional: string | null;
  estado_padron: EstadoPadron;
  dni_valido_modulo11: boolean;
  created_at: string;
}

export interface RegistroBeneficiarioInput {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  integrantes_hogar: number;
  condicion_nutricional?: string;
}

export type TipoDuplicidad = "INTER_OLLA" | "INTRA_OLLA";
export type EstadoResolucionDuplicidad = "DETECTADO" | "RESUELTO" | "DESCARTADO";

export interface DuplicidadBeneficiario {
  id: number;
  beneficiario_id: number;
  beneficiario_duplicado_id: number;
  tipo: TipoDuplicidad;
  estado_resolucion: EstadoResolucionDuplicidad;
  fecha_deteccion: string;
}

// ---------------------------------------------------------------------------
// programaciones_menu / gramajes_calculados
// ---------------------------------------------------------------------------

export interface ProgramacionMenu {
  id: number;
  olla_id: number;
  fecha: string;
  tipo_racion: string;
  kcal_total_calculada: number;
  cumple_rango_optimo: boolean;
  created_by: number;
}

export interface GramajeCalculado {
  id: number;
  programacion_menu_id: number;
  insumo: string;
  kg_calculado: number;
  kg_real_usado: number | null;
  unidad?: string;
}

// ---------------------------------------------------------------------------
// guias_despacho / items_despacho
// ---------------------------------------------------------------------------

export type EstadoFSM = "PROGRAMADO" | "DESPACHADO" | "EN_TRANSITO" | "RECEPCIONADO";

export interface GuiaDespacho {
  id: number;
  olla_id: number;
  almacenero_id: number;
  estado_fsm: EstadoFSM;
  fecha_generacion: string;
  fecha_despacho: string | null;
  fecha_recepcion: string | null;
}

export interface ItemDespacho {
  id: number;
  guia_id: number;
  insumo: string;
  unidad: string;
  cantidad_despachada: number;
  cantidad_recepcionada: number | null;
}

// ---------------------------------------------------------------------------
// cola_sincronizacion (soporte Offline-First)
// ---------------------------------------------------------------------------

export type TipoTransaccionOffline =
  | "REGISTRO_BENEFICIARIO"
  | "REGISTRO_OLLA"
  | "ENVIO_SOLICITUD"
  | "ACTUALIZAR_PERFIL";

export type EstadoTransaccionOffline = "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";

export interface TransaccionOffline<TPayload = unknown> {
  uuid_transaccion: string; // UUIDv4
  usuario_id: number;
  tipo_transaccion: TipoTransaccionOffline;
  payload_json: TPayload;
  estado: EstadoTransaccionOffline;
  fecha_creacion_local: string;
}

// ---------------------------------------------------------------------------
// Notificaciones (derivadas: duplicidad, aprobación, guías en camino)
// ---------------------------------------------------------------------------

export type TipoNotificacion =
  | "APROBACION"
  | "OBSERVACION"
  | "DUPLICIDAD"
  | "DESPACHO_EN_CAMINO";

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  referencia_id?: number; // ej: beneficiario_id o guia_id relacionado
}

// ---------------------------------------------------------------------------
// Historial de postulaciones
// ---------------------------------------------------------------------------

export interface CicloPostulacion {
  id: number;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  estado_final: EstadoAprobacionOlla;
  observaciones: string | null;
}

// ---------------------------------------------------------------------------
// Resumen de expediente (vista 4) y asignación (vista 6)
// ---------------------------------------------------------------------------

export interface ResumenExpediente {
  olla: OllaComun;
  total_familias: number;
  total_integrantes: number;
  beneficiarios_activos: number;
  beneficiarios_con_alerta: number;
}

export interface AsignacionNutricional {
  programacion: ProgramacionMenu;
  gramajes: GramajeCalculado[];
  kcal_total: number;
  kg_insumos_total: number;
  porciones_diarias_estimadas: number;
}
