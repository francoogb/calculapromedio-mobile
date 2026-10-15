import * as SecureStore from 'expo-secure-store';

const KEY_TOKEN = 'auth_token';

/** Guarda el token Sanctum en el almacenamiento seguro del dispositivo (nunca en AsyncStorage). */
export async function guardarToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY_TOKEN, token);
  } catch {
    // Sin almacenamiento seguro disponible: la sesión simplemente no persiste
  }
}

export async function leerToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY_TOKEN);
  } catch {
    return null;
  }
}

export async function borrarToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_TOKEN);
  } catch {
    // Ignorar: el token ya no está o no hay almacenamiento seguro
  }
}
