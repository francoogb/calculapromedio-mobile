import { File, Paths } from 'expo-file-system';

/**
 * Borra archivos temporales (fotos del ejercicio, versiones rotadas o recortadas).
 * Solo toca archivos dentro de la caché de la app: nunca borra nada de la galería.
 */
export function borrarTemporales(uris: Iterable<string>): void {
  const cache = Paths.cache.uri;

  for (const uri of uris) {
    if (!uri.startsWith(cache)) continue;
    try {
      const archivo = new File(uri);
      if (archivo.exists) archivo.delete();
    } catch {
      // El archivo ya no existe o no se pudo borrar: no es crítico
    }
  }
}
