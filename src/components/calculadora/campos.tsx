import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Acento, Colors } from '@/constants/theme';

const colors = Colors.dark;

/** Fondo de inputs dentro de una Seccion (mismo que en Promedio Ponderado). */
export const FONDO_INPUT = 'rgba(15,23,42,0.6)';

// ── Campo numérico con label, sufijo opcional y error ────────

export function CampoNumero({
  label,
  value,
  onChangeText,
  placeholder,
  sufijo,
  error,
  ayuda,
  maxLength = 6,
  permiteNegativo = false,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  sufijo?: string;
  error?: string | null;
  ayuda?: string;
  maxLength?: number;
  /** Teclado con signo menos (los teclados decimales no lo traen) */
  permiteNegativo?: boolean;
}) {
  return (
    <View style={styles.campo}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? colors.danger : colors.border },
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={permiteNegativo ? TECLADO_CON_SIGNO : 'decimal-pad'}
          maxLength={maxLength}
          style={[styles.input, { color: colors.text }]}
        />
        {sufijo && (
          <View style={[styles.sufijo, { borderLeftColor: colors.border }]}>
            <Text style={[styles.sufijoTexto, { color: colors.textMuted }]}>{sufijo}</Text>
          </View>
        )}
      </View>
      {error ? (
        <Text style={[styles.mensaje, { color: colors.danger }]}>{error}</Text>
      ) : ayuda ? (
        <Text style={[styles.mensaje, { color: colors.textMuted }]}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

// ── Chips de valores rápidos (ej. 4.0 · 5.0 · 6.0) ───────────

export function ChipsRapidos({
  opciones,
  valorActual,
  onElegir,
}: {
  opciones: string[];
  valorActual: string;
  onElegir: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {opciones.map((op) => {
        const activo = op === valorActual.replace(',', '.');
        return (
          <Pressable
            key={op}
            onPress={() => onElegir(op)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: activo ? Acento.base : 'rgba(99,102,241,0.08)',
                borderColor: activo ? Acento.base : 'rgba(129,140,248,0.25)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Text style={[styles.chipTexto, { color: activo ? '#ffffff' : Acento.claro }]}>{op}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Selector segmentado (ej. escala de notas) ────────────────

export function Segmentado<T extends string>({
  label,
  opciones,
  valor,
  onCambiar,
}: {
  label?: string;
  opciones: { id: T; texto: string }[];
  valor: T;
  onCambiar: (v: T) => void;
}) {
  return (
    <View style={styles.campo}>
      {label && <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>}
      <View style={[styles.segmento, { borderColor: colors.border }]}>
        {opciones.map((op) => {
          const activo = op.id === valor;
          return (
            <Pressable
              key={op.id}
              onPress={() => onCambiar(op.id)}
              style={[styles.segmentoItem, activo && { backgroundColor: Acento.base }]}>
              <Text
                style={[
                  styles.segmentoTexto,
                  { color: activo ? '#ffffff' : colors.textSecondary },
                ]}>
                {op.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
  },
  sufijo: {
    width: 46,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  sufijoTexto: {
    fontSize: 16,
    fontWeight: '600',
  },
  mensaje: {
    fontSize: 12,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmento: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
  },
  segmentoItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentoTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
});

/** Teclado numérico que incluye el signo menos en ambas plataformas. */
export const TECLADO_CON_SIGNO = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';
