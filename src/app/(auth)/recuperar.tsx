import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CabeceraCuenta } from '@/components/cuenta/campos';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';

const colors = Colors.dark;

/** La recuperación de contraseña vive en la web (misma base de usuarios). */
const URL_RECUPERAR = 'https://calculapromedio.cl/forgot-password';

export default function RecuperarScreen() {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <CabeceraCuenta titulo="Recuperar contraseña" />

      <ScrollView
        contentContainerStyle={[styles.scroll, ContenidoCentrado]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.iconoWrap}>
          <Ionicons name="lock-open-outline" size={40} color="#a78bfa" />
        </View>
        <Text style={styles.titulo}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitulo}>
          Te enviaremos un correo con un enlace para restablecerla. Usa el mismo correo con el que
          creaste tu cuenta.
        </Text>

        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(URL_RECUPERAR)}
          style={({ pressed }) => [styles.boton, { opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.botonTexto}>Abrir recuperación en la web</Text>
          <Ionicons name="open-outline" size={18} color="#ffffff" />
        </Pressable>

        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.volver}>
          <Text style={styles.volverTexto}>Volver a iniciar sesión</Text>
        </Pressable>
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
    paddingTop: Spacing.six,
    gap: Spacing.three,
    alignItems: 'center',
  },
  iconoWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  botonTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  volver: {
    paddingVertical: Spacing.two,
  },
  volverTexto: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
});
