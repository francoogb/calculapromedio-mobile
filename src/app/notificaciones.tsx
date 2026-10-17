import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CabeceraCuenta } from '@/components/cuenta/campos';
import { FormularioCompletarPerfil } from '@/components/cuenta/completar-perfil';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';

const colors = Colors.dark;

/**
 * Centro de notificaciones. Hoy lista los pendientes del perfil; es el lugar
 * donde en el futuro llegarán las novedades y actualizaciones que enviemos.
 */
export default function NotificacionesScreen() {
  const { usuario } = useSesion();
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

        {faltaPerfil ? (
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
