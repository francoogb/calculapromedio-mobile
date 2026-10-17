import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSesion } from '@/context/sesion';
import { cargarNotificaciones } from '@/lib/notificaciones';

/**
 * Campana de notificaciones global (se usa en las barras superiores de las tabs).
 * Muestra un punto rojo cuando hay pendientes del perfil o notificaciones sin leer
 * (la primera vez, la de bienvenida; después, las novedades que lleguen).
 * Al tocar abre la pantalla de notificaciones.
 */
export function CampanaNotificaciones() {
  const { usuario } = useSesion();
  const [sinLeer, setSinLeer] = useState(false);

  // Se revisa cada vez que la pantalla vuelve a estar a la vista (por ejemplo, al salir del centro)
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      cargarNotificaciones().then((lista) => {
        if (activo) setSinLeer(lista.some((n) => !n.leida));
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  const pendientes =
    sinLeer || (!!usuario && (!usuario.telefono || !usuario.como_nos_conociste));

  return (
    <Pressable
      onPress={() => router.push('/notificaciones')}
      hitSlop={10}
      accessibilityLabel="Notificaciones"
      style={({ pressed }) => [styles.boton, { opacity: pressed ? 0.7 : 1 }]}>
      <View>
        <Ionicons name="notifications-outline" size={22} color="#ffffff" />
        {pendientes && <View style={styles.punto} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  punto: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#060919',
  },
});
