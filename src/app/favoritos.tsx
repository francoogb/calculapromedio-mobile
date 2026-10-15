import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CALCULADORAS, ESTILO_CARD, getCalculadora } from '@/constants/calculadoras';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import {
  borrarDelHistorial,
  getFavoritos,
  getHistorial,
  type EntradaHistorial,
} from '@/lib/storage';

const colors = Colors.dark;

function formatearFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);

  // Recarga cada vez que la pestaña recibe foco (se pudo marcar algo en otra pantalla)
  useFocusEffect(
    useCallback(() => {
      getFavoritos().then(setFavoritos);
      getHistorial().then(setHistorial);
    }, [])
  );

  const calcsFavoritas = CALCULADORAS.filter((c) => favoritos.includes(c.id) && c.ruta);

  const borrar = async (id: string) => {
    setHistorial((prev) => prev.filter((e) => e.id !== id));
    await borrarDelHistorial(id);
  };

  const vacio = calcsFavoritas.length === 0 && historial.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + Spacing.two }]}>
        <View style={ContenidoCentrado}>
          <Text style={styles.heroTitulo}>Favoritos</Text>
          <Text style={styles.heroSub}>Tus calculadoras y cálculos guardados</Text>
        </View>
      </View>

      {vacio ? (
        <View style={styles.vacio}>
          <View
            style={[
              styles.vacioIcono,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
            ]}>
            <Ionicons name="heart-outline" size={40} color="#a78bfa" />
          </View>
          <Text style={[styles.vacioTitulo, { color: colors.text }]}>Aún no tienes favoritos</Text>
          <Text style={[styles.vacioTexto, { color: colors.textMuted }]}>
            Toca el corazón en cualquier calculadora para tenerla aquí, o guarda un resultado con el
            botón Guardar.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}>
          {calcsFavoritas.length > 0 && (
            <>
              <Text style={[styles.seccion, { color: colors.textMuted }]}>CALCULADORAS</Text>
              {calcsFavoritas.map((calc) => (
                <Pressable
                  key={calc.id}
                  onPress={() => calc.ruta && router.push(calc.ruta)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <View style={[styles.cardIcono, { backgroundColor: ESTILO_CARD[calc.id]?.color ?? calc.colorIcon }]}>
                    <Ionicons name={ESTILO_CARD[calc.id]?.icono ?? calc.icono} size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitulo, { color: colors.text }]}>{calc.nombre}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={1}>
                      {calc.descripcion}
                    </Text>
                  </View>
                  <Ionicons name="heart" size={18} color="#f472b6" />
                </Pressable>
              ))}
            </>
          )}

          {historial.length > 0 && (
            <>
              <Text style={[styles.seccion, { color: colors.textMuted, marginTop: Spacing.three }]}>
                CÁLCULOS GUARDADOS
              </Text>
              {historial.map((entrada) => {
                const calc = getCalculadora(entrada.calculadoraId);
                return (
                  <Pressable
                    key={entrada.id}
                    onPress={() => calc?.ruta && router.push(calc.ruta)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitulo, { color: colors.text }]}>
                        {calc?.nombre ?? 'Cálculo'}
                      </Text>
                      <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                        {entrada.resumen} · {formatearFecha(entrada.fecha)}
                      </Text>
                    </View>
                    <Text style={[styles.historialValor, { color: colors.resultado }]}>
                      {entrada.resultado}
                    </Text>
                    <Pressable
                      onPress={() => borrar(entrada.id)}
                      hitSlop={8}
                      accessibilityLabel="Borrar cálculo guardado"
                      style={styles.borrar}>
                      <Ionicons name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
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
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIcono: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  historialValor: {
    fontSize: 22,
    fontWeight: '900',
  },
  borrar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: 14,
  },
  vacioIcono: {
    width: 88,
    height: 88,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  vacioTitulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  vacioTexto: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
