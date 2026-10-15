import { leerToken } from '@/lib/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Errores de validación de Laravel: { campo: [mensajes] } (HTTP 422). */
export type ErroresValidacion = Record<string, string[]>;

/** Error de la API con status, mensaje general y errores por campo (si vienen). */
export class ApiError extends Error {
  status: number;
  errores: ErroresValidacion;

  constructor(status: number, message: string, errores: ErroresValidacion = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errores = errores;
  }

  /** Primer mensaje de error de un campo, o undefined si no hay. */
  errorDe(campo: string): string | undefined {
    return this.errores[campo]?.[0];
  }
}

type OpcionesFetch = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  /** false para endpoints públicos (login/register). Default true. */
  auth?: boolean;
};

/**
 * Llamada a la API. Devuelve el JSON parseado (sin envoltorio extra).
 * Lanza ApiError en cualquier respuesta no exitosa.
 * En 401 limpia la sesión local (vía el handler registrado) y redirige a login.
 */
export async function apiFetch<T = unknown>(
  ruta: string,
  { method = 'GET', body, auth = true }: OpcionesFetch = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await leerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión a internet.');
  }

  let datos: Record<string, unknown> = {};
  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin JSON (p. ej. error 500 del hosting): se usa solo el status
  }

  if (!respuesta.ok) {
    const message =
      typeof datos.message === 'string'
        ? datos.message
        : 'Ocurrió un error inesperado. Inténtalo de nuevo.';
    const errores =
      datos.errors && typeof datos.errors === 'object'
        ? (datos.errors as ErroresValidacion)
        : {};

    if (respuesta.status === 401 && auth) {
      await alSesionInvalida?.();
    }
    throw new ApiError(respuesta.status, message, errores);
  }

  return datos as T;
}

/**
 * Se ejecuta cuando la API responde 401 (token revocado o cuenta eliminada).
 * Lo registra el SesionProvider para limpiar la sesión local sin importación circular.
 */
let alSesionInvalida: (() => Promise<void>) | null = null;

export function registrarSesionInvalida(fn: () => Promise<void>): void {
  alSesionInvalida = fn;
}
