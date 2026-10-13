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

type FilaNota = {
  id: string;
  nota: string;
  porcentaje: string;
};

function generarFila(porcentajeDefault: string = ''): FilaNota {
  return {
    id: Math.random().toString(36).substring(2, 9),
    nota: '',
    porcentaje: porcentajeDefault,
  };
}

export default function PromedioPonderadoScreen() {
  const colors = Colors.dark;

  const [filas, setFilas] = useState<FilaNota[]>(() => [
    generarFila('30'),
    generarFila('30'),
    generarFila('40'),
  ]);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  // Cálculos reactivos
  const calculo = useMemo(() => {
    let sumaPonderada = 0;
    let sumaPorcentaje = 0;
    let notasValidas = 0;

    for (const f of filas) {
      const n = parseFloat(f.nota.replace(',', '.'));
      const p = parseFloat(f.porcentaje.replace(',', '.'));

      if (!isNaN(p) && p > 0) {
        sumaPorcentaje += p;
      }

      if (!isNaN(n) && !isNaN(p) && n > 0 && p > 0) {
        sumaPonderada += n * (p / 100);
        notasValidas++;
      }
    }

    // Si el porcentaje acumulado es distinto de 100 y tenemos notas, escalamos
    let promedioFinal: number | null = null;
    if (notasValidas > 0 && sumaPorcentaje > 0) {
      // Si la suma no es 100%, calculamos el promedio relativo a la ponderación ingresada
      promedioFinal = (sumaPonderada / (sumaPorcentaje / 100));
    }

    return {
      promedio: promedioFinal,
      sumaPorcentaje,
      notasValidas,
      es100Porciento: Math.abs(sumaPorcentaje - 100) < 0.01,
    };
  }, [filas]);

  const actualizarNota = (id: string, campo: 'nota' | 'porcentaje', valor: string) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f))
    );
  };

  const agregarFila = () => {
    setFilas((prev) => [...prev, generarFila()]);
  };

  const eliminarFila = (id: string) => {
    if (filas.length <= 1) return;
    setFilas((prev) => prev.filter((f) => f.id !== id));
  };

  const reiniciar = () => {
    setFilas([generarFila('30'), generarFila('30'), generarFila('40')]);
  };

  const estaAprobando = calculo.promedio !== null && calculo.promedio >= 4.0;
  const estaReprobando = calculo.promedio !== null && calculo.promedio < 4.0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Promedio Ponderado',
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
                  PROMEDIO PONDERADO
                </Text>

                {calculo.promedio !== null ? (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: estaAprobando
                          ? colors.successBg
                          : colors.dangerBg,
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
                        {
                          color: estaAprobando ? colors.success : colors.danger,
                        },
                      ]}>
                      {estaAprobando ? 'Aprobado' : 'Bajo 4.0'}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.statusBadgeText, { color: colors.textMuted }]}>
                      Sin calcular
                    </Text>
                  </View>
                )}
              </View>

              {/* Métrica Display Grande */}
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

              {/* Sub-métricas (Ponderación total, cantidad de notas) */}
              <View style={[styles.subMetricsGrid, { borderTopColor: colors.border }]}>
                <View style={styles.subMetricCol}>
                  <Text style={[styles.subMetricLabel, { color: colors.textMuted }]}>
                    % Acumulado
                  </Text>
                  <View style={styles.subMetricValueRow}>
                    <Text
                      style={[
                        styles.subMetricValue,
                        {
                          color: calculo.es100Porciento
                            ? colors.text
                            : colors.warning,
                        },
                      ]}>
                      {calculo.sumaPorcentaje}%
                    </Text>
                    {!calculo.es100Porciento && calculo.sumaPorcentaje > 0 && (
                      <Text style={[styles.warningTiny, { color: colors.warning }]}>
                        (ideal 100%)
                      </Text>
                    )}
                  </View>
                </View>

                <View style={[styles.subMetricDivider, { backgroundColor: colors.border }]} />

                <View style={styles.subMetricCol}>
                  <Text style={[styles.subMetricLabel, { color: colors.textMuted }]}>
                    Notas ingresadas
                  </Text>
                  <Text style={[styles.subMetricValue, { color: colors.text }]}>
                    {calculo.notasValidas} de {filas.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECCIÓN DE EVALUACIONES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Evaluaciones
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {filas.length} filas
              </Text>
            </View>

            {/* Encabezados de columna */}
            <View style={styles.tableHeadRow}>
              <Text style={[styles.tableHeadText, { flex: 1, color: colors.textMuted }]}>
                NOTA (1.0 - 7.0)
              </Text>
              <Text style={[styles.tableHeadText, { width: 105, color: colors.textMuted }]}>
                PESO %
              </Text>
              <View style={{ width: 44 }} />
            </View>

            {/* LISTA DINÁMICA DE FILAS */}
            <View style={styles.filasContainer}>
              {filas.map((fila, index) => {
                const esUltimaFilaUnica = filas.length <= 1;
                return (
                  <View
                    key={fila.id}
                    style={[
                      styles.filaCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}>
                    {/* Campo de Nota */}
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={fila.nota}
                        onChangeText={(txt) => actualizarNota(fila.id, 'nota', txt)}
                        placeholder="ej. 6.2"
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
                    </View>

                    {/* Campo de Porcentaje */}
                    <View style={[styles.inputWrap, { width: 90 }]}>
                      <TextInput
                        value={fila.porcentaje}
                        onChangeText={(txt) => actualizarNota(fila.id, 'porcentaje', txt)}
                        placeholder="%"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        style={[
                          styles.inputField,
                          {
                            color: colors.text,
                            backgroundColor: colors.backgroundElement,
                            borderColor: colors.border,
                            textAlign: 'center',
                          },
                        ]}
                      />
                    </View>

                    {/* Botón Eliminar Fila (Touch target >= 44dp) */}
                    <Pressable
                      disabled={esUltimaFilaUnica}
                      onPress={() => eliminarFila(fila.id)}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        {
                          opacity: esUltimaFilaUnica ? 0.3 : pressed ? 0.7 : 1,
                          backgroundColor: colors.backgroundElement,
                        },
                      ]}>
                      <Ionicons name="trash-outline" size={18} color={esUltimaFilaUnica ? colors.textMuted : colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* BOTÓN AGREGAR NOTA */}
            <Pressable
              onPress={agregarFila}
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
                Agregar otra evaluación
              </Text>
            </Pressable>

            {/* BLOQUE PEDAGÓGICO: ¿CÓMO SE CALCULA? (Colapsable) */}
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
                    ¿Cómo se calcula el promedio ponderado?
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
                    A diferencia del promedio simple donde todas las notas valen lo mismo, en el
                    promedio ponderado cada evaluación tiene un peso porcentual específico dentro del
                    100% final.
                  </Text>

                  {/* Fórmula Matemática */}
                  <View
                    style={[
                      styles.formulaBox,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>
                      FÓRMULA GENERAL
                    </Text>
                    <Text style={[styles.formulaMath, { color: colors.text }]}>
                      Promedio = (N₁ × %₁) + (N₂ × %₂) + ...
                    </Text>
                  </View>

                  {/* Tip PAES Violeta */}
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
                        Consejo de estudio PAES
                      </Text>
                    </View>
                    <Text style={[styles.pedagogicTipBody, { color: colors.textSecondary }]}>
                      Si la suma de tus porcentajes aún no da 100%, puedes usar la calculadora para
                      simular qué nota necesitas en la evaluación restante para asegurar tu promedio
                      meta.
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
  subMetricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  subMetricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  warningTiny: {
    fontSize: 10,
    fontWeight: '600',
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
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: -4,
  },
  tableHeadText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  inputWrap: {
    flex: 1,
  },
  inputField: {
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
