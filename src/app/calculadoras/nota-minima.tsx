import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function NotaMinimaScreen() {
  const colors = Colors.dark;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nota Mínima',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.accentTipBg }]}>
          <Ionicons name="locate" size={36} color={colors.accentTip} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Nota Mínima para Aprobar</Text>
        <Text style={[styles.desc, { color: colors.textMuted }]}>
          Esta calculadora te permitirá ingresar tus notas actuales y la ponderación del examen o
          evaluación final para saber exactamente qué calificación necesitas.
        </Text>
        <View style={[styles.pill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Ionicons name="construct" size={14} color={colors.textMuted} />
          <Text style={[styles.pillText, { color: colors.textSecondary }]}>
            En construcción para Fase 2
          </Text>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
});
