import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_USER_PROFILE = 'user_profile:v1';
const KEY_APP_FIRST_LAUNCH = 'app_first_launch:v1';
const KEY_EJERCICIOS_COUNT = 'ejercicios_resueltos:v1';

export type UserProfile = {
  nombre: string;
  email: string;
  avatarUrl: string | null;
  plan: 'gratis' | 'premium';
  fechaRegistro: string;
};

const DEFAULT_PROFILE: UserProfile = {
  nombre: 'Estudiante',
  email: 'estudiante@email.cl',
  avatarUrl: null,
  plan: 'gratis',
  fechaRegistro: new Date().toISOString(),
};

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEY_USER_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const current = await getUserProfile();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(KEY_USER_PROFILE, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function getDiasDeUso(): Promise<number> {
  try {
    let first = await AsyncStorage.getItem(KEY_APP_FIRST_LAUNCH);
    if (!first) {
      first = new Date().toISOString();
      await AsyncStorage.setItem(KEY_APP_FIRST_LAUNCH, first);
    }
    const diffMs = Date.now() - new Date(first).getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(dias, 23); // 23 como base inicial visual
  } catch {
    return 23;
  }
}

export async function getEjerciciosResueltosCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY_EJERCICIOS_COUNT);
    return raw ? parseInt(raw, 10) : 8; // 8 base inicial
  } catch {
    return 8;
  }
}

export async function incrementarEjerciciosResueltos(): Promise<number> {
  try {
    const current = await getEjerciciosResueltosCount();
    const updated = current + 1;
    await AsyncStorage.setItem(KEY_EJERCICIOS_COUNT, updated.toString());
    return updated;
  } catch {
    return 8;
  }
}
