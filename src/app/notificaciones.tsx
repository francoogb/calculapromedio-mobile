import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CabeceraCuenta } from '@/components/cuenta/campos';
import { FormularioCompletarPerfil } from '@/components/cuenta/completar-perfil';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import {
  cargarNotificaciones,
  ID_BIENVENIDA,
  marcarTodasLeidas,
  type Notificacion,
} from '@/lib/notificaciones';

const colors = Colors.dark;

/**
 * Centro de notificaciones. Lista los pendientes del perfil y las notificaciones
 * (la de bienvenida la primera vez; después, las novedades y actualizaciones que enviemos).
 */
export default function NotificacionesScreen() {
  const { usuario } = useSesion();
  const [lista, setLista] = useState<Notificacion[]>([]);

  // Se muestran con su estado de "sin leer" y recién después se marcan como leídas
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      cargarNotificaciones().then((cargadas) => {
        if (!activo) return;
        setLista(cargadas);
        marcarTodasLeidas();
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  const faltaPerfil = !!usuario && (!usuario.telefono || !usuario.como_nos_conociste);
  const faltaTelefono = !!usuario && !usuario.telefono;
  const faltaConociste = !!usuario && !usuario.como_nos_conociste;
  const descripcionPerfil =
    faltaTelefono && faltaConociste
      ? 'Añade tu celular (+569) y cuéntanos cómo nos conociste.'
      : faltaTelefono
        ? 'Añade tu celular (+569) para completar tu perfil.'
        : 'Cuéntanos cómo nos conociste para completar tu perfil.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <CabeceraCuenta titulo="Notificaciones" />

      <ScrollView
        contentContainerStyle={[styles.scroll, ContenidoCentrado]}
        showsVerticalScrollIndicator={false}>
        {faltaPerfil && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconoWrap}>
                <Ionicons name="person-outline" size={22} color="#a78bfa" />
              </View>
              <View style={styles.cardTexto}>
                <Text style={styles.cardTitulo}>Completa tu perfil</Text>
                <Text style={styles.cardDesc}>{descripcionPerfil}</Text>
              </View>
            </View>
            <FormularioCompletarPerfil />
          </View>
        )}

        {/* Invitados: invitación a iniciar sesión (desaparece sola al tener cuenta) */}
        {!usuario && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconoWrap}>
                <Ionicons name="person-add-outline" size={22} color="#a78bfa" />
              </View>
              <View style={styles.cardTexto}>
                <Text style={styles.cardTitulo}>Inicia sesión para sacarle más provecho</Text>
                <Text style={styles.cardDesc}>
                  Con tu cuenta gratuita te avisamos de las novedades de CalculaPromedio y accedes a
                  herramientas como Resolver con foto.
                </Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/login')} hitSlop={8} style={styles.enlace}>
              <Text style={styles.enlaceTexto}>Iniciar sesión</Text>
              <Ionicons name="arrow-forward" size={14} color="#a78bfa" />
            </Pressable>
          </View>
        )}

        {lista.map((n) => (
          <View key={n.id} style={[styles.notificacion, !n.leida && styles.notificacionNueva]}>
            <View style={styles.iconoWrap}>
              <Ionicons
                name={n.id === ID_BIENVENIDA ? 'sparkles' : 'notifications'}
                size={22}
                color="#a78bfa"
              />
            </View>
            <View style={styles.cardTexto}>
              <Text style={styles.cardTitulo}>{n.titulo}</Text>
              <Text style={styles.cardDesc}>{n.texto}</Text>
            </View>
            {!n.leida && <View style={styles.puntoNueva} />}
          </View>
        ))}

        {lista.length > 0 || !usuario ? null : faltaPerfil ? (
          <Text style={styles.notas}>
            También avisaremos aquí de actualizaciones, novedades y noticias de CalculaPromedio.
          </Text>
        ) : (
          <View style={styles.vacio}>
            <View style={styles.vacioIcono}>
              <Ionicons name="notifications-outline" size={40} color="#a78bfa" />
            </View>
            <Text style={styles.vacioTitulo}>No hay notificaciones</Text>
            <Text style={styles.vacioTexto}>
              Aquí te avisaremos de actualizaciones, novedades y noticias de CalculaPromedio.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTexto: {
    flex: 1,
    gap: 3,
  },
  cardTitulo: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginLeft: 54,
  },
  enlaceTexto: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
  notificacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    borderRadius: 16,
    padding: 14,
  },
  notificacionNueva: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  puntoNueva: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  notas: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
  },
  vacio: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  vacioIcono: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioTitulo: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  vacioTexto: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
});
