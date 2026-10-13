import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCalculadora, type Calculadora } from '@/constants/calculadoras';
import { Colors, Spacing } from '@/constants/theme';

/** Calculadoras destacadas en el home (íconos y colores vienen del catálogo único). */
const PRINCIPALES: Calculadora[] = ['promedio-ponderado', 'nota-minima', 'nem', 'porcentajes']
  .map(getCalculadora)
  .filter((c): c is Calculadora => c !== undefined);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* HERO superior con decoradores + header + saludo + search */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: '#1b1844',
            paddingTop: insets.top + Spacing.two,
          },
        ]}>
        {/* Decoradores flotantes */}
        <View pointerEvents="none" style={styles.decorContainer}>
          <View style={[styles.decorIcon, { top: 50, left: 14 }]}>
            <Ionicons name="school" size={48} color="#ffffff" />
          </View>
          <View style={[styles.decorIcon, { top: 120, right: 18 }]}>
            <Ionicons name="calculator" size={56} color="#ffffff" />
          </View>
          <Text style={[styles.decorNumber, { bottom: 60, left: 32 }]}>6.5</Text>
        </View>

        {/* Header: logo + nombre + settings */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <LinearGradient
              colors={['#22d3ee', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandMark}>
              <Text style={styles.brandMarkText}>CP</Text>
            </LinearGradient>
            <Text style={styles.brandText}>CalculaPromedio</Text>
          </View>

          <Pressable
            onPress={() => {}}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="settings-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Saludo */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>¡Hola!</Text>
          <Text style={styles.greetingSubtitle}>
            Todas tus calculadoras académicas{'\n'}en un solo lugar.
          </Text>
        </View>

        {/* Search pill */}
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Buscar calculadora..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            onFocus={() => router.push('/calculadoras')}
          />
        </View>
      </View>

      {/* CONTENIDO DARK */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.four,
          paddingBottom: Spacing.four,
          gap: Spacing.three,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calculadoras principales</Text>
          <Pressable onPress={() => router.push('/calculadoras')} hitSlop={10}>
            <View style={styles.verTodasRow}>
              <Text style={styles.verTodasText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={14} color="#a78bfa" />
            </View>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          {PRINCIPALES.map((calc) => {
            const disponible = calc.ruta !== null;
            return (
              <Pressable
                key={calc.id}
                disabled={!disponible}
                onPress={() => disponible && calc.ruta && router.push(calc.ruta)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: !disponible ? 0.6 : pressed ? 0.85 : 1,
                  },
                ]}>
                <View style={[styles.cardIcon, { backgroundColor: calc.colorBg }]}>
                  <Ionicons name={calc.icono} size={22} color={calc.colorIcon} />
                </View>
                <View style={styles.cardTextCol}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{calc.nombre}</Text>
                  <Text
                    style={[styles.cardDesc, { color: colors.textMuted }]}
                    numberOfLines={2}>
                    {calc.descripcion}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        {/* CTA Premium */}
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.premiumWrap, { opacity: pressed ? 0.92 : 1 }]}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premium}>
            <View style={styles.premiumIconBg}>
              <Ionicons name="star" size={20} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Desbloquea todas las calculadoras</Text>
              <Text style={styles.premiumSubtitle}>
                Sin límites y con funciones avanzadas.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorContainer: {
    ...StyleSheet.absoluteFill,
  },
  decorIcon: {
    position: 'absolute',
    opacity: 0.08,
    transform: [{ rotate: '-12deg' }],
  },
  decorNumber: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '800',
    opacity: 0.07,
    letterSpacing: -2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  greetingBlock: {
    marginBottom: Spacing.three,
  },
  greetingTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  greetingSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  verTodasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verTodasText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a78bfa',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  premiumWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: Spacing.two,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  premiumIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
});
