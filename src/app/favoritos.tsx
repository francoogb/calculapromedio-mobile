import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

export default function FavoritosScreen() {
  const colors = Colors.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          ]}>
          <Ionicons name="heart-outline" size={40} color="#a78bfa" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Tus favoritas</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Marca tus calculadoras más usadas con el corazón y vuelve a ellas con un solo toque.
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.badgeText, { color: colors.textMuted }]}>Próximamente</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: 14,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
