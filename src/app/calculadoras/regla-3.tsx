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

type Tipo = 'directa' | 'inversa';

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

// Quita decimales innecesarios: 30.00 → 30, 12.50 → 12.5
function formatear(n: number): string {
  return parseFloat(n.toFixed(2)).toLocaleString('es-CL');
}

export default function ReglaDeTresScreen() {
  const colors = Colors.dark;
  const [tipo, setTipo] = useState<Tipo>('directa');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);

  const resultado = useMemo((): { x: number; desarrollo: string } | { error: string } | null => {
    const na = aNumero(a);
    const nb = aNumero(b);
    const nc = aNumero(c);
    if (![na, nb, nc].every(Number.isFinite)) return null;

    if (tipo === 'directa') {
      if (na === 0) return { error: 'A no puede ser 0' };
      const x = (nb * nc) / na;
      return { x, desarrollo: `X = (${formatear(nb)} × ${formatear(nc)}) ÷ ${formatear(na)}` };
    }

    if (nc === 0) return { error: 'C no puede ser 0' };
    const x = (na * nb) / nc;
    return { x, desarrollo: `X = (${formatear(na)} × ${formatear(nb)}) ÷ ${formatear(nc)}` };
  }, [tipo, a, b, c]);

  const reiniciar = () => {
    setA('');
    setB('');
    setC('');
  };

  const inputStyle = [
    styles.inputField,
    { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border },
  ];

  const valorX = resultado !== null && 'x' in resultado ? resultado.x : null;
  const tieneValor = valorX !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Regla de 3',
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

            {/* SELECTOR DIRECTA / INVERSA */}
            <View
              style={[
                styles.segment,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {(['directa', 'inversa'] as Tipo[]).map((t) => {
                const activo = t === tipo;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTipo(t)}
                    style={[styles.segmentItem, activo && { backgroundColor: colors.primary }]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: activo ? '#ffffff' : colors.textSecondary },
                      ]}>
                      {t === 'directa' ? 'Directa' : 'Inversa'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.ayudaTipo, { color: colors.textMuted }]}>
              {tipo === 'directa'
                ? 'Si una magnitud aumenta, la otra también aumenta (más kilos, más precio).'
                : 'Si una magnitud aumenta, la otra disminuye (más trabajadores, menos días).'}
            </Text>

            {/* PROPORCIÓN */}
            <View
              style={[
                styles.proporcionCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.filaProporcion}>
                <Text style={[styles.conector, { color: colors.textMuted }]}>Si</Text>
                <TextInput
                  value={a}
                  onChangeText={setA}
                  placeholder="A"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
                <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
                <TextInput
                  value={b}
                  onChangeText={setB}
                  placeholder="B"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>

              <View style={[styles.separador, { backgroundColor: colors.border }]} />

              <View style={styles.filaProporcion}>
                <Text style={[styles.conector, { color: colors.textMuted }]}>Con</Text>
                <TextInput
                  value={c}
                  onChangeText={setC}
                  placeholder="C"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
                <Ionicons name="arrow-forward" size={18} color={colors.textMuted} />
                <View
                  style={[
                    styles.inputField,
                    styles.xBox,
                    {
                      backgroundColor: tieneValor ? colors.primary : colors.backgroundElement,
                      borderColor: tieneValor ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[styles.xText, { color: tieneValor ? '#ffffff' : colors.textMuted }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {valorX !== null ? formatear(valorX) : 'X'}
                  </Text>
                </View>
              </View>
            </View>

            {/* RESULTADO */}
            <View
              style={[
                styles.displayCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.displayLabel, { color: colors.textMuted }]}>VALOR DE X</Text>
              <Text
                style={[
                  styles.metricText,
                  {
                    color:
                      resultado === null
                        ? colors.textMuted
                        : 'error' in resultado
                        ? colors.danger
                        : colors.primary,
                  },
                ]}>
                {valorX !== null ? formatear(valorX) : '—'}
              </Text>
              <Text style={[styles.detalleText, { color: colors.textSecondary }]}>
                {resultado === null
                  ? 'Completa A, B y C para calcular'
                  : 'error' in resultado
                  ? resultado.error
                  : resultado.desarrollo}
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
                    ¿Directa o inversa?
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
                    <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>DIRECTA</Text>
                    <Text style={[styles.formulaMath, { color: colors.text }]}>X = (B × C) ÷ A</Text>
                    <Text style={[styles.formulaEjemplo, { color: colors.textMuted }]}>
                      3 kg cuestan $6.000 → 5 kg cuestan $10.000
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.formulaBox,
                      { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>INVERSA</Text>
                    <Text style={[styles.formulaMath, { color: colors.text }]}>X = (A × B) ÷ C</Text>
                    <Text style={[styles.formulaEjemplo, { color: colors.textMuted }]}>
                      4 obreros tardan 6 días → 8 obreros tardan 3 días
                    </Text>
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
                      Antes de calcular pregúntate: si duplico una magnitud, ¿la otra se duplica o
                      se reduce a la mitad? Esa pregunta te dice si es directa o inversa.
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
  ayudaTipo: {
    fontSize: 12,
    lineHeight: 17,
  },
  proporcionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  filaProporcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  conector: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
  },
  separador: {
    height: 1,
  },
  inputField: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  xBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xText: {
    fontSize: 17,
    fontWeight: '800',
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
    fontSize: 15,
    fontWeight: '700',
  },
  formulaEjemplo: {
    fontSize: 12,
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
