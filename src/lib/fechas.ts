/** Utilidades de fechas para calculadoras (formato chileno DD-MM-AAAA, sin zona horaria). */

const MS_DIA = 86_400_000;

/** Fecha local a medianoche (evita saltos por horario de verano). */
export function crearFecha(anio: number, mes: number, dia: number): Date {
  return new Date(anio, mes - 1, dia, 12, 0, 0);
}

export function hoy(): Date {
  const d = new Date();
  return crearFecha(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** "07-03-2026" → Date, o null si no es una fecha real (ej. 31-02-2026). */
export function leerFecha(txt: string): Date | null {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(txt.trim());
  if (!m) return null;
  const [dia, mes, anio] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = crearFecha(anio, mes, dia);
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return d;
}

export function fechaATexto(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** Fecha larga: "martes 13 de octubre de 2026". */
export function fechaLarga(d: Date): string {
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Días entre dos fechas (b − a), en días calendario. */
export function diasEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_DIA);
}

export function sumarDias(d: Date, dias: number): Date {
  return crearFecha(d.getFullYear(), d.getMonth() + 1, d.getDate() + dias);
}

/** Diferencia exacta en años, meses y días (como se calcula la edad). */
export function diferenciaAMD(desde: Date, hasta: Date): { anios: number; meses: number; dias: number } {
  let anios = hasta.getFullYear() - desde.getFullYear();
  let meses = hasta.getMonth() - desde.getMonth();
  let dias = hasta.getDate() - desde.getDate();
  if (dias < 0) {
    meses -= 1;
    // días del mes anterior a "hasta"
    dias += new Date(hasta.getFullYear(), hasta.getMonth(), 0).getDate();
  }
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  return { anios, meses, dias };
}

/** Días hábiles (lunes a viernes) entre a (incluida) y b (excluida). No descuenta feriados. */
export function diasHabilesEntre(a: Date, b: Date): number {
  const signo = b >= a ? 1 : -1;
  let [ini, fin] = signo === 1 ? [a, b] : [b, a];
  let cuenta = 0;
  for (let d = ini; d < fin; d = sumarDias(d, 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) cuenta++;
  }
  return cuenta * signo;
}

/** Inserta guiones mientras se escribe: "0703" → "07-03", "07032026" → "07-03-2026". */
export function mascaraFecha(txt: string): string {
  const digitos = txt.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 4)}-${digitos.slice(4)}`;
}
