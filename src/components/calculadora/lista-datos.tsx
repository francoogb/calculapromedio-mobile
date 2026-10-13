import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TECLADO_CON_SIGNO, FONDO_INPUT } from '@/components/calculadora/campos';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero } from '@/lib/matematica';
import { parsearLista } from '@/lib/estadistica';

const colors = Colors.dark;

/**
 * Entrada de un conjunto de datos: se escribe un número y se agrega con "+".
 * Acepta pegar una lista completa ("4 7 7 9" o "4; 7; 9"). Cada dato es una píldora que se toca para quitar.
 */
export function ListaDatos({
  datos,
  onCambiar,
  minimo = 2,
}: {
  datos: number[];
  onCambiar: (datos: number[]) => void;
  minimo?: number;
}) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  const agregar = () => {
    const nuevos = parsearLista(texto);
    if (nuevos.length === 0) {
      setError(texto.trim() === '' ? null : 'Escribe un número válido');
      return;
    }
    onCambiar([...datos, ...nuevos]);
    setTexto('');
    setError(null);
  };

  const cambiarTexto = (t: string) => {
    setError(null);
    // Si pegan una lista (con separadores), se agrega de inmediato
    if (/[\s;]/.test(t.trim()) && parsearLista(t).length > 1) {
      onCambiar([...datos, ...parsearLista(t)]);
      setTexto('');
      return;
    }
    setTexto(t);
  };

  const quitar = (indice: number) => {
    onCambiar(datos.filter((_, i) => i !== indice));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.entradaFila}>
        <TextInput
          value={texto}
          onChangeText={cambiarTexto}
          onSubmitEditing={agregar}
          placeholder="Escribe un dato y toca +"
          placeholderTextColor={colors.textMuted}
          keyboardType={TECLADO_CON_SIGNO}
          returnKeyType="done"
          blurOnSubmit={false}
          style={[styles.input, { color: colors.text, borderColor: error ? colors.danger : colors.border }]}
        />
        <Pressable
          onPress={agregar}
          accessibilityLabel="Agregar dato"
          style={({ pressed }) => [styles.botonMas, { opacity: pressed ? 0.8 : 1 }]}>
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      </View>

      {error && <Text style={[styles.mensaje, { color: colors.danger }]}>{error}</Text>}

      <View style={styles.cabecera}>
        <Text style={[styles.contador, { color: colors.textMuted }]}>
          {datos.length} {datos.length === 1 ? 'dato' : 'datos'}
          {datos.length > 0 && datos.length < minimo ? ` · mínimo ${minimo}` : ''}
        </Text>
        {datos.length > 0 && (
          <Pressable onPress={() => onCambiar([])} hitSlop={8}>
            <Text style={[styles.borrarTodo, { color: Acento.claro }]}>Borrar todos</Text>
          </Pressable>
        )}
      </View>

      {datos.length > 0 ? (
        <View style={styles.pildoras}>
          {datos.map((d, i) => (
            <Pressable
              key={`${i}-${d}`}
              onPress={() => quitar(i)}
              accessibilityLabel={`Quitar ${d}`}
              style={({ pressed }) => [styles.pildora, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={styles.pildoraTexto}>{fmtNumero(d)}</Text>
              <Ionicons name="close" size={13} color={Acento.claro} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={[styles.mensaje, { color: colors.textMuted }]}>
          También puedes pegar una lista separada por espacios: 4 7 7 9 10
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  entradaFila: {
    flexDirection: 'row',
    gap: 10,
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
  },
  botonMas: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Acento.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mensaje: {
    fontSize: 12,
    fontWeight: '500',
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contador: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  borrarTodo: {
    fontSize: 12,
    fontWeight: '700',
  },
  pildoras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
  },
  pildoraTexto: {
    color: '#e0e7ff',
    fontSize: 14,
    fontWeight: '700',
  },
});
