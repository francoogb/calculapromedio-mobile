import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CALCULADORAS } from '@/constants/calculadoras';
import { Colors, Spacing } from '@/constants/theme';

type Categoria = 'todas' | 'escolares' | 'paes' | 'universitarias';

const CATEGORIAS: { id: Categoria; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'escolares', label: 'Escolares' },
  { id: 'paes', label: 'PAES' },
  { id: 'universitarias', label: 'Universidad' },
];

export default function CalculadorasScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  const [categoria, setCategoria] = useState<Categoria>('todas');
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    return CALCULADORAS.filter((c) => {
      const matchCat = categoria === 'todas' || c.categoria === categoria;
      const matchBusq =
        busqueda.trim() === '' ||
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusq;
    });
  }, [categoria, busqueda]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* HERO NAVY compacto */}
      <View
        style={[
          styles.hero,
          { backgroundColor: '#1b1844', paddingTop: insets.top + Spacing.two },
        ]}>
        <View style={styles.heroTitleRow}>
          <View>
            <Text style={styles.heroTitle}>Calculadoras</Text>
            <Text style={styles.heroSubtitle}>Todas las herramientas en un solo lugar</Text>
          </View>
          <View style={styles.heroCount}>
            <Text style={styles.heroCountText}>{CALCULADORAS.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchPill}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar calculadora..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Chips categorías */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
          {CATEGORIAS.map((cat) => {
            const activo = cat.id === categoria;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoria(cat.id)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: activo ? '#4f46e5' : colors.surface,
                    borderColor: activo ? '#4f46e5' : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: activo ? '#ffffff' : colors.textSecondary },
                  ]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: Spacing.two,
          paddingBottom: Spacing.four,
          gap: 10,
        }}
        showsVerticalScrollIndicator={false}>
        {filtradas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No encontramos calculadoras con "{busqueda}"
            </Text>
          </View>
        ) : (
          filtradas.map((calc) => {
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
                    opacity: !disponible ? 0.65 : pressed ? 0.9 : 1,
                  },
                ]}>
                <View style={[styles.cardIcon, { backgroundColor: calc.colorBg }]}>
                  <Ionicons name={calc.icono} size={22} color={calc.colorIcon} />
                </View>
                <View style={styles.cardTextCol}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{calc.nombre}</Text>
                    {!disponible && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Pronto</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.cardDesc, { color: colors.textMuted }]}
                    numberOfLines={2}>
                    {calc.descripcion}
                  </Text>
                </View>
                {disponible && (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })
        )}
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
    paddingBottom: Spacing.three,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: Spacing.three,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 2,
  },
  heroCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  chipsRow: {
    paddingVertical: Spacing.two,
  },
  chipsContent: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
});
