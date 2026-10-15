import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { router } from 'expo-router';

import { apiFetch, registrarSesionInvalida } from '@/lib/api';
import { borrarToken, guardarToken } from '@/lib/auth';

/** Usuario tal como lo devuelve la API (UserResource, ver docs/API.md). */
export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  avatar: string | null;
  google: boolean;
  is_premium: boolean;
  premium_until: string | null;
  racha: number;
  xp: number;
  telefono: string | null;
  como_nos_conociste: string | null;
};

type RespuestaAuth = { token: string; user: Usuario };
type RespuestaMe = { data: Usuario };

type SesionContextValue = {
  /** Usuario autenticado, o null si es invitado. */
  usuario: Usuario | null;
  /** true mientras se restaura la sesión guardada al arrancar la app. */
  cargando: boolean;
  iniciarSesion: (credenciales: { email: string; password: string }) => Promise<void>;
  crearCuenta: (datos: {
    nombre: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  eliminarCuenta: () => Promise<void>;
  actualizarUsuario: (datos: Partial<Pick<Usuario, 'nombre' | 'telefono' | 'como_nos_conociste'>>) => Promise<void>;
};

const SesionContext = createContext<SesionContextValue | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  // Ref espejo para saber dentro del handler de 401 si había sesión activa
  const usuarioRef = useRef<Usuario | null>(null);

  /** Limpia la sesión local (token + estado). No toca favoritos ni historial. */
  const limpiarSesionLocal = useCallback(async () => {
    await borrarToken();
    usuarioRef.current = null;
    setUsuario(null);
  }, []);

  // 401: la API dice que el token ya no sirve → cerrar sesión local y volver a login
  useEffect(() => {
    registrarSesionInvalida(async () => {
      const habiaSesion = usuarioRef.current !== null;
      await limpiarSesionLocal();
      if (habiaSesion) router.navigate('/login');
    });
  }, [limpiarSesionLocal]);

  // Restaurar sesión guardada: si hay token, pedir /me; si falla, seguir como invitado
  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<RespuestaMe>('/me');
        usuarioRef.current = data;
        setUsuario(data);
      } catch {
        // Sin token o sesión inválida: la app funciona igual como invitada
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const iniciarSesion = useCallback(async (credenciales: { email: string; password: string }) => {
    const { token, user } = await apiFetch<RespuestaAuth>('/login', {
      method: 'POST',
      auth: false,
      body: credenciales,
    });
    await guardarToken(token);
    usuarioRef.current = user;
    setUsuario(user);
  }, []);

  const crearCuenta = useCallback(
    async (datos: {
      nombre: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      const { token, user } = await apiFetch<RespuestaAuth>('/register', {
        method: 'POST',
        auth: false,
        body: datos,
      });
      await guardarToken(token);
      usuarioRef.current = user;
      setUsuario(user);
    },
    []
  );

  const cerrarSesion = useCallback(async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {
      // Aunque falle el servidor (p. ej. sin conexión), se cierra la sesión local igual
    }
    await limpiarSesionLocal();
  }, [limpiarSesionLocal]);

  const eliminarCuenta = useCallback(async () => {
    await apiFetch('/account', { method: 'DELETE' });
    await limpiarSesionLocal();
  }, [limpiarSesionLocal]);

  const actualizarUsuario = useCallback(
    async (datos: Partial<Pick<Usuario, 'nombre' | 'telefono' | 'como_nos_conociste'>>) => {
      const { data } = await apiFetch<RespuestaMe>('/me', { method: 'PATCH', body: datos });
      usuarioRef.current = data;
      setUsuario(data);
    },
    []
  );

  return (
    <SesionContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        crearCuenta,
        cerrarSesion,
        eliminarCuenta,
        actualizarUsuario,
      }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion(): SesionContextValue {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>');
  return ctx;
}
