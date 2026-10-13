/** Utilidades matemáticas compartidas por las calculadoras de Matemática PAES. */

/** Máximo común divisor (Euclides). */
export function mcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Mínimo común múltiplo. */
export function mcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / mcd(a, b);
}

/** Factores primos como mapa primo → exponente. Ej: 12 → {2: 2, 3: 1} */
export function factoresPrimos(n: number): Map<number, number> {
  const factores = new Map<number, number>();
  let resto = Math.abs(Math.trunc(n));
  for (let p = 2; p * p <= resto; p++) {
    while (resto % p === 0) {
      factores.set(p, (factores.get(p) ?? 0) + 1);
      resto /= p;
    }
  }
  if (resto > 1) factores.set(resto, (factores.get(resto) ?? 0) + 1);
  return factores;
}

const SUPERINDICES: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺',
};

/** Convierte un exponente a superíndice: -12 → "⁻¹²" */
export function superindice(exp: number | string): string {
  return String(exp)
    .split('')
    .map((c) => SUPERINDICES[c] ?? c)
    .join('');
}

/** "2³ × 3" a partir de un mapa de factores (exponente 1 se omite). */
export function factoresATexto(factores: Map<number, number>): string {
  if (factores.size === 0) return '1';
  return [...factores.entries()]
    .sort(([a], [b]) => a - b)
    .map(([p, e]) => (e > 1 ? `${p}${superindice(e)}` : String(p)))
    .join(' × ');
}

/** Número legible: separador de miles chileno, sin decimales innecesarios, notación científica si es enorme. */
export function fmtNumero(n: number, decimales = 4): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) {
    const [mant, exp] = n.toExponential(4).split('e');
    const mantisa = parseFloat(mant).toLocaleString('es-CL', { maximumFractionDigits: 4 });
    return `${mantisa} × 10${superindice(Number(exp))}`;
  }
  return parseFloat(n.toFixed(decimales)).toLocaleString('es-CL', { maximumFractionDigits: decimales });
}

/** Pesos chilenos sin decimales: 1234567.8 → "$1.234.568" */
export function fmtPesos(n: number): string {
  const signo = n < 0 ? '−' : '';
  return `${signo}$${Math.round(Math.abs(n)).toLocaleString('es-CL')}`;
}

/** Lee un monto en pesos: ignora "$" y puntos de miles ("1.500.000" → 1500000). */
export function leerPesos(txt: string): number {
  const limpio = txt.replace(/[$\s.]/g, '').replace(',', '.');
  return limpio === '' ? NaN : Number(limpio);
}

/** Lee un número escrito por el usuario (acepta coma decimal y signo negativo). */
export function leerNumero(txt: string): number {
  const limpio = txt.trim().replace(',', '.');
  return limpio === '' || limpio === '-' ? NaN : Number(limpio);
}

/** Lee un entero; NaN si no es entero. */
export function leerEntero(txt: string): number {
  const n = leerNumero(txt);
  return Number.isInteger(n) ? n : NaN;
}
