/** Fórmulas de salud usadas por las calculadoras (mismas que la web). */

export type Sexo = 'hombre' | 'mujer';

export function imc(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return pesoKg / (m * m);
}

/** Clasificación OMS del IMC en adultos. */
export function categoriaImc(valor: number): { texto: string; tono: 'ok' | 'info' | 'warning' | 'error' } {
  if (valor < 18.5) return { texto: 'Bajo peso', tono: 'warning' };
  if (valor < 25) return { texto: 'Peso normal', tono: 'ok' };
  if (valor < 30) return { texto: 'Sobrepeso', tono: 'warning' };
  if (valor < 35) return { texto: 'Obesidad grado I', tono: 'error' };
  if (valor < 40) return { texto: 'Obesidad grado II', tono: 'error' };
  return { texto: 'Obesidad grado III', tono: 'error' };
}

/** Tasa metabólica basal, Mifflin-St Jeor (kcal/día). */
export function tmbMifflin(sexo: Sexo, pesoKg: number, alturaCm: number, edad: number): number {
  return 10 * pesoKg + 6.25 * alturaCm - 5 * edad + (sexo === 'hombre' ? 5 : -161);
}

export const NIVELES_ACTIVIDAD = [
  { id: '1.2', texto: 'Sedentario', detalle: 'Poco o nada de ejercicio' },
  { id: '1.375', texto: 'Ligero', detalle: 'Ejercicio 1 a 3 días por semana' },
  { id: '1.55', texto: 'Moderado', detalle: 'Ejercicio 3 a 5 días por semana' },
  { id: '1.725', texto: 'Intenso', detalle: 'Ejercicio 6 a 7 días por semana' },
] as const;

export type NivelActividad = (typeof NIVELES_ACTIVIDAD)[number]['id'];

/** % de grasa corporal, fórmula de Deurenberg (a partir del IMC). */
export function grasaDeurenberg(sexo: Sexo, valorImc: number, edad: number): number {
  return 1.2 * valorImc + 0.23 * edad - (sexo === 'hombre' ? 16.2 : 5.4);
}

/** Categorías de % de grasa (American Council on Exercise). */
export function categoriaGrasa(sexo: Sexo, pct: number): { texto: string; tono: 'ok' | 'info' | 'warning' | 'error' } {
  const [esencial, atleta, fitness, promedio] = sexo === 'hombre' ? [6, 14, 18, 25] : [14, 21, 25, 32];
  if (pct < esencial) return { texto: 'Grasa esencial', tono: 'warning' };
  if (pct < atleta) return { texto: 'Atlético', tono: 'ok' };
  if (pct < fitness) return { texto: 'En forma', tono: 'ok' };
  if (pct < promedio) return { texto: 'Promedio', tono: 'info' };
  return { texto: 'Elevado', tono: 'error' };
}
