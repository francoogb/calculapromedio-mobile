/**
 * Iniciales y colores del avatar de la cuenta.
 * Se usan cuando la app no muestra una foto: las iniciales salen del nombre
 * (o del correo si no hay nombre) y el degradado siempre es el mismo para la misma cuenta.
 */

/** Degradados azulados, en la misma familia que los botones de la app (índigo, azul y cian). */
const DEGRADADOS_AVATAR: [string, string][] = [
  ['#6366f1', '#3b82f6'],
  ['#4f46e5', '#2563eb'],
  ['#3b82f6', '#22d3ee'],
  ['#6366f1', '#0ea5e9'],
  ['#2563eb', '#6366f1'],
  ['#1d4ed8', '#22d3ee'],
];

/** Partes de un texto separadas por espacios, puntos, guiones o guiones bajos. */
function partes(texto: string): string[] {
  return texto
    .split(/[\s._-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Hasta dos letras en mayúscula: primera letra del nombre y del apellido.
 * "Franco Valdenegro" → "FV". Sin nombre usa el correo: "fran.valdenegr@…" → "FV".
 */
export function iniciales(nombre: string | null | undefined, email: string | null | undefined): string {
  const origen = nombre?.trim() ? nombre : (email ?? '').split('@')[0];
  const palabras = partes(origen ?? '');
  if (palabras.length === 0) return '?';
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/** Degradado estable para una cuenta: el mismo correo siempre da el mismo par de colores. */
export function degradadoAvatar(semilla: string | null | undefined): [string, string] {
  const texto = (semilla ?? '').toLowerCase();
  let suma = 0;
  for (let i = 0; i < texto.length; i++) suma = (suma + texto.charCodeAt(i)) % 9973;
  return DEGRADADOS_AVATAR[suma % DEGRADADOS_AVATAR.length];
}
