import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

const NOMBRES = ['Foto', 'Recorte', 'Análisis', 'Solución'];

/** Indicador de 4 pasos del flujo "Resolver con foto": 0 = Foto … 3 = Solución. */
export function IndicadorPasos({ actual }: { actual: 0 | 1 | 2 | 3 }) {
  const colors = Colors.dark;

  return (
    <View style={styles.fila}>
      {NOMBRES.map((nombre, i) => {
        const hecho = i < actual;
        const activo = i === actual;

        return (
          <View key={nombre} style={styles.item}>
            {i > 0 && (
              <View
                style={[
                  styles.linea,
                  { backgroundColor: i <= actual ? '#4f46e5' : colors.border },
                ]}
              />
            )}
            <View
              style={[
                styles.punto,
                { borderColor: hecho || activo ? '#6366f1' : colors.border },
                hecho && styles.puntoHecho,
              ]}>
              {hecho && <Ionicons name="checkmark" size={13} color="#ffffff" />}
              {activo && <View style={styles.puntoInterior} />}
            </View>
            <Text
              style={[
                styles.nombre,
                {
                  color: activo ? colors.text : colors.textMuted,
                  fontWeight: activo ? '700' : '400',
                },
              ]}>
              {nombre}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  linea: {
    position: 'absolute',
    top: 10,
    left: '-50%',
    width: '100%',
    height: 2,
  },
  punto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.background,
  },
  puntoHecho: {
    backgroundColor: '#4f46e5',
  },
  puntoInterior: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  nombre: {
    fontSize: 12,
  },
});
