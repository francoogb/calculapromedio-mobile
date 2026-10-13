import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCalculadora } from '@/constants/calculadoras';
import { Colors, Spacing } from '@/constants/theme';
import { useFavorito } from '@/hooks/use-favorito';

type Props = {
  calculadoraId: string;
};

/** Header propio de cada calculadora: volver, ícono, título, descripción y favorito. */
export function HeaderCalculadora({ calculadoraId }: Props) {
  const colors = Colors.dark;
  const insets = useSafeAreaInsets();
  const calc = getCalculadora(calculadoraId);
  const { esFavorito, alternar } = useFavorito(calculadoraId);

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={styles.iconButton}
        accessibilityLabel="Volver">
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      {calc && (
        <View style={[styles.tile, { backgroundColor: calc.colorIcon }]}>
          <Ionicons name={calc.icono} size={26} color="#ffffff" />
        </View>
      )}

      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={1}>
          {calc?.nombre ?? 'Calculadora'}
        </Text>
        {calc && (
          <Text style={[styles.descripcion, { color: colors.textSecondary }]} numberOfLines={2}>
            {calc.descripcion}.
          </Text>
        )}
      </View>

      <Pressable
        onPress={alternar}
        hitSlop={10}
        style={styles.iconButton}
        accessibilityLabel={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
        <Ionicons
          name={esFavorito ? 'heart' : 'heart-outline'}
          size={26}
          color={esFavorito ? '#f472b6' : colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 17,
  },
});
