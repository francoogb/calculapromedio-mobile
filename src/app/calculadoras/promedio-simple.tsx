import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

type Nota = {
  id: string;
  valor: string;
};

function nuevaNota(): Nota {
  return { id: Math.random().toString(36).slice(2), valor: '' };
}

export default function PromedioSimpleScreen() {
  const colors = Colors.dark;
  const [notas, setNotas] = useState<Nota[]>(() => [nuevaNota(), nuevaNota(), nuevaNota()]);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  const calculo = useMemo(() => {
    const numeros = notas
      .map((n) => parseFloat(n.valor.replace(',', '.')))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (numeros.length === 0) {
      return { promedio: null, suma: 0, cantidad: 0 };
    }

    const suma = numeros.reduce((acc, v) => acc + v, 0);
    return {
      promedio: suma / numeros.length,
      suma,
      cantidad: numeros.length,
    };
  }, [notas]);

  const actualizarNota = (id: string, valor: string) => {
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, valor } : n)));
  };

  const agregarNota = () => {
    setNotas((prev) => [...prev, nuevaNota()]);
  };

  const quitarNota = (id: string) => {
    if (notas.length <= 1) return;
    setNotas((prev) => prev.filter((n) => n.id !== id));
  };

  const reiniciar = () => {
    setNotas([nuevaNota(), nuevaNota(), nuevaNota()]);
  };

  const estaAprobando = calculo.promedio !== null && calculo.promedio >= 4.0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Promedio Simple',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.headerButton}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={reiniciar}
              hitSlop={8}
              style={styles.headerButton}>
              <Ionicons name="refresh" size={19} color={colors.textSecondary} />
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* TARJETA DE RESULTADO PRINCIPAL (DISPLAY CARD) */}
            <View
              style={[
                styles.displayCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <View style={styles.displayTopRow}>
                <Text style={[styles.displayLabel, { color: colors.textMuted }]}>
                  PROMEDIO GENERAL
                </Text>

                {calculo.promedio !== null ? (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: estaAprobando ? colors.successBg : colors.dangerBg,
                      },
                    ]}>
                    {estaAprobando ? (
                      <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    ) : (
                      <Ionicons name="alert-circle" size={12} color={colors.danger} />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: estaAprobando ? colors.success : colors.danger },
                      ]}>
                      {estaAprobando ? 'Aprobado' : 'Bajo 4.0'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.textMuted }]}>
                      Sin notas
                    </Text>
                  </View>
                )}
              </View>

              {/* Métrica Display */}
              <View style={styles.metricContainer}>
                <Text
                  style={[
                    styles.metricText,
                    {
                      color:
                        calculo.promedio === null
                          ? colors.textMuted
                          : estaAprobando
                          ? colors.navy
                          : colors.danger,
                    },
                  ]}>
                  {calculo.promedio === null ? '—' : calculo.promedio.toFixed(2)}
                </Text>
              </View>

              {/* Sub-métricas */}
              <View style={[styles.subMetricsGrid, { borderTopColor: colors.border }]}>
                <View style={styles.subMetricCol}>
                  <Text style={[styles.subMetricLabel, { color: colors.textMuted }]}>
                    Suma total
                  </Text>
                  <Text style={[styles.subMetricValue, { color: colors.text }]}>
                    {calculo.suma.toFixed(1)}
                  </Text>
                </View>

                <View style={[styles.subMetricDivider, { backgroundColor: colors.border }]} />

                <View style={styles.subMetricCol}>
                  <Text style={[styles.subMetricLabel, { color: colors.textMuted }]}>
                    Notas sumadas
                  </Text>
                  <Text style={[styles.subMetricValue, { color: colors.text }]}>
                    {calculo.cantidad} de {notas.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN DE NOTAS */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Calificaciones</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {notas.length} notas
              </Text>
            </View>

            {/* LISTA DINÁMICA DE NOTAS */}
            <View style={styles.filasContainer}>
              {notas.map((nota, index) => {
                const esUltimaUnica = notas.length <= 1;
                return (
                  <View
                    key={nota.id}
                    style={[
                      styles.filaCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.badgeIndex}>
                      <Text style={[styles.badgeIndexText, { color: colors.textMuted }]}>
                        {index + 1}
                      </Text>
                    </View>

                    <TextInput
                      value={nota.valor}
                      onChangeText={(txt) => actualizarNota(nota.id, txt)}
                      placeholder="Nota (ej. 5.5)"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={[
                        styles.inputField,
                        {
                          color: colors.text,
                          backgroundColor: colors.backgroundElement,
                          borderColor: colors.border,
                        },
                      ]}
                    />

                    <Pressable
                      disabled={esUltimaUnica}
                      onPress={() => quitarNota(nota.id)}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        {
                          opacity: esUltimaUnica ? 0.3 : pressed ? 0.7 : 1,
                          backgroundColor: colors.backgroundElement,
                        },
                      ]}>
                      <Ionicons name="trash-outline" size={18} color={esUltimaUnica ? colors.textMuted : colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* BOTÓN AGREGAR NOTA */}
            <Pressable
              onPress={agregarNota}
              style={({ pressed }) => [
                styles.addNoteButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={[styles.addNoteText, { color: colors.primary }]}>
                Agregar otra nota
              </Text>
            </Pressable>

            {/* BLOQUE PEDAGÓGICO COLAPSABLE */}
            <View
              style={[
                styles.pedagogicCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Pressable
                onPress={() => setMostrarExplicacion((prev) => !prev)}
                style={styles.pedagogicHeader}>
                <View style={styles.pedagogicHeaderLeft}>
                  <Ionicons name="help-circle" size={18} color={colors.accentTip} />
                  <Text style={[styles.pedagogicTitle, { color: colors.text }]}>
                    ¿Cómo funciona el promedio simple?
                  </Text>
                </View>
                {mostrarExplicacion ? (
                  <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
                ) : (
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                )}
              </Pressable>

              {mostrarExplicacion && (
                <View style={styles.pedagogicContent}>
                  <Text style={[styles.pedagogicText, { color: colors.textSecondary }]}>
                    El promedio simple o media aritmética suma todas las calificaciones y divide el total
                    por la cantidad de notas ingresadas. Cada evaluación tiene exactamente el mismo valor.
                  </Text>

                  <View
                    style={[
                      styles.formulaBox,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>FÓRMULA</Text>
                    <Text style={[styles.formulaMath, { color: colors.text }]}>
                      Promedio = Suma de Notas ÷ Cantidad de Notas
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.pedagogicTipBox,
                      {
                        backgroundColor: colors.accentTipBg,
                        borderColor: colors.accentTip,
                      },
                    ]}>
                    <View style={styles.pedagogicTipHeader}>
                      <Ionicons name="bulb" size={16} color={colors.accentTip} />
                      <Text style={[styles.pedagogicTipTitle, { color: colors.accentTip }]}>
                        Tip rápido
                      </Text>
                    </View>
                    <Text style={[styles.pedagogicTipBody, { color: colors.textSecondary }]}>
                      Si tus pruebas tienen porcentajes distintos (por ejemplo una prueba vale 40% y un
                      trabajo 20%), debes utilizar la calculadora de Promedio Ponderado.
                    </Text>
                  </View>
                </View>
              )}
            </View>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  displayCard: {
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  displayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  metricText: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  subMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  subMetricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  subMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  subMetricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  subMetricDivider: {
    width: 1,
    height: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
  },
  filasContainer: {
    gap: 10,
  },
  filaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeIndex: {
    width: 28,
    alignItems: 'center',
  },
  badgeIndexText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputField: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    width: 44,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addNoteText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pedagogicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    marginTop: Spacing.two,
    gap: Spacing.three,
  },
  pedagogicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pedagogicHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pedagogicTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pedagogicContent: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  pedagogicText: {
    fontSize: 13,
    lineHeight: 19,
  },
  formulaBox: {
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formulaMath: {
    fontSize: 14,
    fontWeight: '700',
  },
  pedagogicTipBox: {
    padding: Spacing.three,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 4,
  },
  pedagogicTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pedagogicTipTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  pedagogicTipBody: {
    fontSize: 12,
    lineHeight: 17,
  },
});
