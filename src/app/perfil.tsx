import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Acento, Colors, Spacing } from '@/constants/theme';
import { getFavoritos, getHistorial } from '@/lib/storage';

const colors = Colors.dark;

const URL_WEB = 'https://calculapromedio.cl';
const URL_PRIVACIDAD = 'https://calculapromedio.cl/politica-de-privacidad';

/**
 * Perfil sin login (versión 1.0): actividad guardada en el teléfono y enlaces útiles.
 * Cuando exista el login (Fase 3) esta pantalla pasa a ser el perfil de la cuenta.
 */
export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const [favoritos, setFavoritos] = useState(0);
  const [guardados, setGuardados] = useState(0);

  // Se recarga al volver a la pestaña (pudo marcarse un favorito en otra pantalla)
  useFocusEffect(
    useCallback(() => {
      getFavoritos().then((f) => setFavoritos(f.length));
      getHistorial().then((h) => setGuardados(h.length));
    }, [])
  );

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + Spacing.two }]}>
        <Text style={styles.heroTitulo}>Tu perfil</Text>
        <Text style={styles.heroSub}>Tu actividad en esta app</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Actividad */}
        <Text style={[styles.seccion, { color: colors.textMuted }]}>TU ACTIVIDAD</Text>
        <View style={[styles.tarjeta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.stats}>
            <Stat icono="heart" color="#f472b6" valor={favoritos} etiqueta={favoritos === 1 ? 'favorita' : 'favoritas'} />
            <View style={[styles.divisor, { backgroundColor: colors.border }]} />
            <Stat icono="bookmark" color={Acento.claro} valor={guardados} etiqueta={guardados === 1 ? 'guardado' : 'guardados'} />
          </View>
          <Fila icono="heart-outline" texto="Ver mis favoritos y cálculos" onPress={() => router.push('/favoritos')} />
        </View>

        {/* Enlaces */}
        <Text style={[styles.seccion, { color: colors.textMuted }]}>CALCULAPROMEDIO</Text>
        <View style={[styles.tarjeta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Fila icono="globe-outline" texto="Visita calculapromedio.cl" onPress={() => WebBrowser.openBrowserAsync(URL_WEB)} />
          <View style={[styles.separador, { backgroundColor: colors.border }]} />
          <Fila icono="shield-checkmark-outline" texto="Política de privacidad" onPress={() => WebBrowser.openBrowserAsync(URL_PRIVACIDAD)} />
        </View>

        {/* Cuenta (informativo) */}
        <View style={[styles.aviso, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}>
          <Ionicons name="information-circle-outline" size={22} color={colors.info} />
          <Text style={[styles.avisoTexto, { color: colors.textSecondary }]}>
            Pronto podrás iniciar sesión con tu cuenta de CalculaPromedio y sincronizar tu progreso
            con la web.
          </Text>
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>Versión {version}</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ icono, color, valor, etiqueta }: { icono: keyof typeof Ionicons.glyphMap; color: string; valor: number; etiqueta: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icono} size={20} color={color} />
      <Text style={[styles.statValor, { color: colors.text }]}>{valor}</Text>
      <Text style={[styles.statEtiqueta, { color: colors.textMuted }]}>{etiqueta}</Text>
    </View>
  );
}

function Fila({ icono, texto, onPress }: { icono: keyof typeof Ionicons.glyphMap; texto: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fila, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.filaIcono}>
        <Ionicons name={icono} size={18} color={Acento.claro} />
      </View>
      <Text style={[styles.filaTexto, { color: colors.text }]}>{texto}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#1b1844',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSub: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    padding: Spacing.four,
    gap: 10,
  },
  seccion: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: Spacing.two,
  },
  tarjeta: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValor: {
    fontSize: 24,
    fontWeight: '900',
  },
  statEtiqueta: {
    fontSize: 12,
    fontWeight: '600',
  },
  divisor: {
    width: 1,
    height: 44,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  filaIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  separador: {
    height: 1,
    marginHorizontal: 10,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: Spacing.three,
  },
});
