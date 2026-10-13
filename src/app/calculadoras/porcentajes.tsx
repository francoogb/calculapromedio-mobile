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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type Modo = 'porcentaje-de' | 'que-porcentaje' | 'variacion';

type ConfigModo = {
  label: string;
  pregunta: string;
  labelA: string;
  labelB: string;
  placeholderA: string;
  placeholderB: string;
  formula: string;
};

const MODOS: Record<Modo, ConfigModo> = {
  'porcentaje-de': {
    label: 'X% de',
    pregunta: '¿Cuánto es el X% de un número?',
    labelA: 'Porcentaje (%)',
    labelB: 'Número base',
    placeholderA: 'Ej. 20',
    placeholderB: 'Ej. 150',
    formula: 'Resultado = (Porcentaje × Base) ÷ 100',
  },
  'que-porcentaje': {
    label: '¿Qué %?',
    pregunta: '¿Qué porcentaje es A de B?',
    labelA: 'Parte (A)',
    labelB: 'Total (B)',
    placeholderA: 'Ej. 30',
    placeholderB: 'Ej. 150',
    formula: 'Porcentaje = (A ÷ B) × 100',
  },
  variacion: {
    label: 'Variación',
    pregunta: '¿Cuánto subió o bajó un valor?',
    labelA: 'Valor inicial (A)',
    labelB: 'Valor final (B)',
    placeholderA: 'Ej. 10000',
    placeholderB: 'Ej. 8500',
    formula: 'Variación = ((B − A) ÷ A) × 100',
  },
};

const ORDEN_MODOS: Modo[] = ['porcentaje-de', 'que-porcentaje', 'variacion'];

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

// Quita decimales innecesarios: 30.00 → 30, 12.50 → 12.5
function formatear(n: number): string {
  return parseFloat(n.toFixed(2)).toLocaleString('es-CL');
}

export default function PorcentajesScreen() {
  const colors = Colors.dark;
  const [modo, setModo] = useState<Modo>('porcentaje-de');
  const [valorA, setValorA] = useState('');
  const [valorB, setValorB] = useState('');
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  const config = MODOS[modo];

  const resultado = useMemo(() => {
    const a = aNumero(valorA);
    const b = aNumero(valorB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    if (modo === 'porcentaje-de') {
      const r = (a * b) / 100;
      return {
        valor: formatear(r),
        detalle: `El ${formatear(a)}% de ${formatear(b)} es ${formatear(r)}`,
        tono: 'neutro' as const,
      };
    }

    if (b === 0) return { valor: '—', detalle: 'El total (B) no puede ser 0', tono: 'error' as const };

    if (modo === 'que-porcentaje') {
      const r = (a / b) * 100;
      return {
        valor: `${formatear(r)}%`,
        detalle: `${formatear(a)} es el ${formatear(r)}% de ${formatear(b)}`,
        tono: 'neutro' as const,
      };
    }

    if (a === 0) return { valor: '—', detalle: 'El valor inicial (A) no puede ser 0', tono: 'error' as const };

    const r = ((b - a) / a) * 100;
    const diferencia = b - a;
    if (r === 0) {
      return { valor: '0%', detalle: 'El valor no cambió', tono: 'neutro' as const };
    }
    return {
      valor: `${r > 0 ? '+' : ''}${formatear(r)}%`,
      detalle:
        r > 0
          ? `Aumentó ${formatear(diferencia)} respecto al valor inicial`
          : `Disminuyó ${formatear(Math.abs(diferencia))} respecto al valor inicial`,
      tono: r > 0 ? ('sube' as const) : ('baja' as const),
    };
  }, [modo, valorA, valorB]);

  const cambiarModo = (m: Modo) => {
    setModo(m);
    setValorA('');
    setValorB('');
  };

  const reiniciar = () => {
    setValorA('');
    setValorB('');
  };

  const colorResultado =
    resultado === null
      ? colors.textMuted
      : resultado.tono === 'error' || resultado.tono === 'baja'
      ? colors.danger
      : resultado.tono === 'sube'
      ? colors.success
      : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Porcentajes',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={reiniciar} hitSlop={8} style={styles.headerButton}>
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

            {/* SELECTOR DE MODO */}
            <View
              style={[
                styles.segment,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {ORDEN_MODOS.map((m) => {
                const activo = m === modo;
                return (
                  <Pressable
                    key={m}
                    onPress={() => cambiarModo(m)}
                    style={[
                      styles.segmentItem,
                      activo && { backgroundColor: colors.primary },
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: activo ? '#ffffff' : colors.textSecondary },
                      ]}>
                      {MODOS[m].label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.pregunta, { color: colors.text }]}>{config.pregunta}</Text>

            {/* INPUTS */}
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  {config.labelA.toUpperCase()}
                </Text>
                <TextInput
                  value={valorA}
                  onChangeText={setValorA}
                  placeholder={config.placeholderA}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                  {config.labelB.toUpperCase()}
                </Text>
                <TextInput
                  value={valorB}
                  onChangeText={setValorB}
                  placeholder={config.placeholderB}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
            </View>

            {/* RESULTADO */}
            <View
              style={[
                styles.displayCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.displayLabel, { color: colors.textMuted }]}>RESULTADO</Text>
              <Text style={[styles.metricText, { color: colorResultado }]}>
                {resultado === null ? '—' : resultado.valor}
              </Text>
              <Text style={[styles.detalleText, { color: colors.textSecondary }]}>
                {resultado === null ? 'Ingresa ambos valores para calcular' : resultado.detalle}
              </Text>
            </View>

            {/* BLOQUE PEDAGÓGICO COLAPSABLE */}
            <View
              style={[
                styles.pedagogicCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Pressable
                onPress={() => setMostrarExplicacion((prev) => !prev)}
                style={styles.pedagogicHeader}>
                <View style={styles.pedagogicHeaderLeft}>
                  <Ionicons name="help-circle" size={18} color={colors.accentTip} />
                  <Text style={[styles.pedagogicTitle, { color: colors.text }]}>
                    ¿Cómo se calcula?
                  </Text>
                </View>
                <Ionicons
                  name={mostrarExplicacion ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {mostrarExplicacion && (
                <View style={styles.pedagogicContent}>
                  <View
                    style={[
                      styles.formulaBox,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>FÓRMULA</Text>
                    <Text style={[styles.formulaMath, { color: colors.text }]}>{config.formula}</Text>
                  </View>

                  <View
                    style={[
                      styles.pedagogicTipBox,
                      { backgroundColor: colors.accentTipBg, borderColor: colors.accentTip },
                    ]}>
                    <View style={styles.pedagogicTipHeader}>
                      <Ionicons name="bulb" size={16} color={colors.accentTip} />
                      <Text style={[styles.pedagogicTipTitle, { color: colors.accentTip }]}>
                        Tip PAES
                      </Text>
                    </View>
                    <Text style={[styles.pedagogicTipBody, { color: colors.textSecondary }]}>
                      Un descuento del 20% seguido de un aumento del 20% no te devuelve al valor
                      original: 100 → 80 → 96. Cada porcentaje se aplica sobre el valor que hay en
                      ese momento.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
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
    gap: Spacing.three,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pregunta: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: Spacing.one,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  inputField: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '700',
  },
  displayCard: {
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  displayLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metricText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  detalleText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
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
    textAlign: 'center',
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
