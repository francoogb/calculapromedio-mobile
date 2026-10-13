/**
 * Estadística descriptiva para datos no agrupados.
 * Métodos alineados con las calculadoras de la web (calculapromedio.cl) para dar los mismos resultados.
 */

export function ordenar(datos: number[]): number[] {
  return [...datos].sort((a, b) => a - b);
}

export function suma(datos: number[]): number {
  return datos.reduce((acc, v) => acc + v, 0);
}

export function media(datos: number[]): number {
  return suma(datos) / datos.length;
}

export function mediana(datos: number[]): number {
  const o = ordenar(datos);
  const mitad = Math.floor(o.length / 2);
  return o.length % 2 === 0 ? (o[mitad - 1] + o[mitad]) / 2 : o[mitad];
}

/** Frecuencia absoluta de cada valor, ordenada por valor. */
export function frecuencias(datos: number[]): { valor: number; frecuencia: number }[] {
  const mapa = new Map<number, number>();
  for (const d of datos) mapa.set(d, (mapa.get(d) ?? 0) + 1);
  return [...mapa.entries()].sort(([a], [b]) => a - b).map(([valor, frecuencia]) => ({ valor, frecuencia }));
}

/**
 * Moda(s). Igual que la web: si todos los valores tienen la misma frecuencia
 * (o ninguno se repite) no hay moda.
 */
export function modas(datos: number[]): { valores: number[]; frecuencia: number } {
  const f = frecuencias(datos);
  const max = Math.max(...f.map((x) => x.frecuencia));
  const todasIguales = new Set(f.map((x) => x.frecuencia)).size === 1;
  if (max <= 1 || todasIguales) return { valores: [], frecuencia: max };
  return { valores: f.filter((x) => x.frecuencia === max).map((x) => x.valor), frecuencia: max };
}

/** Percentil por interpolación lineal en la posición (n − 1)·p (método de la web / Excel PERCENTIL.INC). */
export function percentil(datos: number[], p: number): number {
  const o = ordenar(datos);
  const pos = (o.length - 1) * (p / 100);
  const base = Math.floor(pos);
  const resto = pos - base;
  return o[base + 1] !== undefined ? o[base] + resto * (o[base + 1] - o[base]) : o[base];
}

/** Posición (1-indexada) usada en el percentil, para mostrar el desarrollo. */
export function posicionPercentil(n: number, p: number): number {
  return (n - 1) * (p / 100) + 1;
}

export function varianza(datos: number[], tipo: 'poblacion' | 'muestra'): number {
  const m = media(datos);
  const sc = suma(datos.map((x) => (x - m) ** 2));
  return sc / (tipo === 'poblacion' ? datos.length : datos.length - 1);
}

/**
 * Convierte texto pegado en números. Separa por espacios, punto y coma, saltos de línea
 * o coma seguida de espacio; una coma sin espacio se interpreta como decimal ("3,5").
 */
export function parsearLista(texto: string): number[] {
  return texto
    .split(/[\s;]+|,(?=\s)/)
    .map((t) => t.trim().replace(/,$/, '').replace(',', '.'))
    .filter((t) => t !== '' && t !== '-')
    .map(Number)
    .filter((n) => Number.isFinite(n));
}
