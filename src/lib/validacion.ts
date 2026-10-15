/**
 * Validación de correos en la app.
 * Nota: ninguna regex comprueba que un correo exista de verdad; eso solo se
 * logra con un correo de confirmación. Aquí validamos formato y detectamos
 * errores de tipeo frecuentes en dominios conocidos (p. ej. "gmail.comf").
 */

const DOMINIOS_COMUNES = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'protonmail.com',
];

/**
 * TLD (lo último del dominio) que existen de verdad. Si el correo termina en
 * otra cosa ("gmail.comf"), el dominio no puede existir: se rechaza o se
 * corrige. Lista amplia pero de uso común (Chile y Latinoamérica primero).
 */
const TLDS_CONOCIDOS = new Set([
  'cl', 'com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'io', 'co', 'dev', 'app',
  'pro', 'me', 'info', 'biz', 'name', 'tv', 'cc', 'ai', 'online', 'site', 'tech',
  'store', 'email', 'cloud', 'us', 'uk', 'de', 'fr', 'es', 'br', 'mx', 'ar', 'pe',
  'uy', 'bo', 'ec', 've', 'py', 'gt', 'cr', 'pa', 'do', 'ni', 'hn', 'sv',
]);

/** Formato básico + TLD real: algo@dominio.tld (sin espacios, TLD conocido). */
export function esCorreoValido(email: string): boolean {
  const coincidencia = /^[^\s@]+@[^\s@]+\.([^\s@]{2,})$/.exec(email.trim());
  if (!coincidencia) return false;
  return TLDS_CONOCIDOS.has(coincidencia[1].toLowerCase());
}

/** Distancia de edición entre dos cadenas (cuántos cambios de un carácter hay que hacer). */
function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = fila[j];
      fila[j] = Math.min(
        fila[j] + 1,
        fila[j - 1] + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      anterior = temp;
    }
  }
  return fila[b.length];
}

/**
 * Si el dominio parece un error de tipeo de un dominio común (a lo más 2
 * cambios de un carácter), devuelve el correo corregido sugerido. Si no, null.
 * Solo compara en minúsculas; la sugerencia se devuelve en minúsculas.
 */
export function sugerirCorreo(email: string): string | null {
  const partes = email.trim().split('@');
  if (partes.length !== 2) return null;
  const [local, dominio] = partes;
  if (!local || !dominio) return null;
  const dominioLower = dominio.toLowerCase();

  let mejor: string | null = null;
  let mejorDistancia = Infinity;
  for (const comun of DOMINIOS_COMUNES) {
    const d = distancia(dominioLower, comun);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = comun;
    }
  }
  // 1 cambio: typo claro (gmal.com, gmail.comf). 2: aceptable (hotmal.com).
  // Dominios cortos los exigimos casi exactos para no sugerir de más.
  const limite = dominioLower.length <= 6 ? 1 : 2;
  if (mejor && mejorDistancia >= 1 && mejorDistancia <= limite && dominioLower !== mejor) {
    return `${local}@${mejor}`;
  }
  return null;
}
