import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONDO_INPUT } from '@/components/calculadora/campos';
import { Acento, Colors } from '@/constants/theme';
import { fechaATexto, hoy, leerFecha, mascaraFecha } from '@/lib/fechas';

const colors = Colors.dark;

/** Campo de fecha DD-MM-AAAA con guiones automáticos y botón "Hoy". */
export function CampoFecha({
  label,
  value,
  onChangeText,
  conHoy = true,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  conHoy?: boolean;
  error?: string | null;
}) {
  const completa = value.length === 10;
  const invalida = completa && leerFecha(value) === null;
  const mensaje = error ?? (invalida ? 'Esa fecha no existe' : null);

  return (
    <View style={styles.campo}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      <View style={styles.fila}>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(mascaraFecha(t))}
          placeholder="DD-MM-AAAA"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.input, { color: colors.text, borderColor: mensaje ? colors.danger : colors.border }]}
        />
        {conHoy && (
          <Pressable
            onPress={() => onChangeText(fechaATexto(hoy()))}
            style={({ pressed }) => [styles.hoy, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.hoyTexto}>Hoy</Text>
          </Pressable>
        )}
      </View>
      {mensaje && <Text style={[styles.mensaje, { color: colors.danger }]}>{mensaje}</Text>}
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
  fila: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hoy: {
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoyTexto: {
    color: Acento.claro,
    fontSize: 14,
    fontWeight: '700',
  },
  mensaje: {
    fontSize: 12,
    fontWeight: '500',
  },
});
