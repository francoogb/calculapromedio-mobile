import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_FAVORITOS = 'favoritos:v1';
const KEY_HISTORIAL = 'historial:v1';
const MAX_HISTORIAL = 30;

export type EntradaHistorial = {
  id: string;
  calculadoraId: string;
  /** Valor principal mostrado (ej. "5.65") */
  resultado: string;
  /** Resumen corto de los datos (ej. "3 evaluaciones · 100%") */
  resumen: string;
  /** ISO 8601 */
  fecha: string;
  /**
   * Datos que escribió el usuario (JSON), para volver a abrir el cálculo con los campos llenos.
   * Su forma la define cada calculadora; las entradas antiguas no lo traen.
   */
  datos?: unknown;
};

async function leerJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function escribirJSON(key: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando sin persistir
  }
}

// ── Favoritos ────────────────────────────────────────────────

export function getFavoritos(): Promise<string[]> {
  return leerJSON<string[]>(KEY_FAVORITOS, []);
}

/** Alterna el favorito y devuelve el nuevo estado (true = quedó marcado). */
export async function toggleFavorito(calculadoraId: string): Promise<boolean> {
  const actuales = await getFavoritos();
  const marcado = actuales.includes(calculadoraId);
  const nuevos = marcado
    ? actuales.filter((id) => id !== calculadoraId)
    : [...actuales, calculadoraId];
  await escribirJSON(KEY_FAVORITOS, nuevos);
  return !marcado;
}

// ── Historial ────────────────────────────────────────────────

export function getHistorial(): Promise<EntradaHistorial[]> {
  return leerJSON<EntradaHistorial[]>(KEY_HISTORIAL, []);
}

/** Una entrada del historial por su id, o null si ya no existe. */
export async function getEntradaHistorial(id: string): Promise<EntradaHistorial | null> {
  const actuales = await getHistorial();
  return actuales.find((e) => e.id === id) ?? null;
}

export async function guardarEnHistorial(
  entrada: Omit<EntradaHistorial, 'id' | 'fecha'>
): Promise<void> {
  const actuales = await getHistorial();
  const nueva: EntradaHistorial = {
    ...entrada,
    id: Math.random().toString(36).slice(2, 10),
    fecha: new Date().toISOString(),
  };
  await escribirJSON(KEY_HISTORIAL, [nueva, ...actuales].slice(0, MAX_HISTORIAL));
}

export async function borrarDelHistorial(id: string): Promise<void> {
  const actuales = await getHistorial();
  await escribirJSON(
    KEY_HISTORIAL,
    actuales.filter((e) => e.id !== id)
  );
}

// ── Onboarding ───────────────────────────────────────────────

const KEY_ONBOARDING = 'onboarding:v1';

export function getOnboardingVisto(): Promise<boolean> {
  return leerJSON<boolean>(KEY_ONBOARDING, false);
}

export async function marcarOnboardingVisto(): Promise<void> {
  await escribirJSON(KEY_ONBOARDING, true);
}
