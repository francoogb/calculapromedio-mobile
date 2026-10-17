import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LISTA = 'notificaciones:v1';
const KEY_SEMBRADA = 'notificaciones_sembrada:v1';

/** Máximo de notificaciones que se conservan en el teléfono. */
const MAXIMO = 50;

export type Notificacion = {
  id: string;
  titulo: string;
  texto: string;
  /** Fecha ISO de cuando llegó. */
  fecha: string;
  leida: boolean;
};

export const ID_BIENVENIDA = 'bienvenida';

function bienvenida(): Notificacion {
  return {
    id: ID_BIENVENIDA,
    titulo: '¡Te damos la bienvenida a CalculaPromedio.cl!',
    texto:
      'Calcula tu promedio, tu NEM y tu puntaje PAES, y resuelve ejercicios con una foto. Aquí te avisaremos de las novedades.',
    fecha: new Date().toISOString(),
    leida: false,
  };
}

async function leerLista(): Promise<Notificacion[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_LISTA);
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

async function guardarLista(lista: Notificacion[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_LISTA, JSON.stringify(lista));
  } catch {
    // Si no se puede guardar, las notificaciones simplemente no se conservan
  }
}

/**
 * Devuelve las notificaciones, la más reciente primero.
 * La primera vez que se llama deja la de bienvenida, sin leer.
 */
export async function cargarNotificaciones(): Promise<Notificacion[]> {
  try {
    if (!(await AsyncStorage.getItem(KEY_SEMBRADA))) {
      await AsyncStorage.setItem(KEY_SEMBRADA, '1');
      await guardarLista([bienvenida(), ...(await leerLista())]);
    }
  } catch {
    // Sin almacenamiento no hay bienvenida; no es crítico
  }
  return leerLista();
}

/** Marca todas como leídas (al abrir el centro de notificaciones). */
export async function marcarTodasLeidas(): Promise<void> {
  const lista = await leerLista();
  if (lista.some((n) => !n.leida)) {
    await guardarLista(lista.map((n) => ({ ...n, leida: true })));
  }
}

/**
 * Agrega una notificación nueva (por ejemplo, una novedad que llegue del servidor).
 * La de bienvenida solo se muestra mientras no haya otras, así que se retira aquí.
 */
export async function agregarNotificacion(
  nueva: Omit<Notificacion, 'fecha' | 'leida'>
): Promise<void> {
  await cargarNotificaciones();
  const resto = (await leerLista()).filter((n) => n.id !== ID_BIENVENIDA && n.id !== nueva.id);
  await guardarLista(
    [{ ...nueva, fecha: new Date().toISOString(), leida: false }, ...resto].slice(0, MAXIMO)
  );
}
