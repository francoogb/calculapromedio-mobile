import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Onboarding } from '@/components/onboarding';
import { ESTILO_CARD, getCalculadora, type Calculadora } from '@/constants/calculadoras';
import { Colors, Spacing } from '@/constants/theme';
import { getOnboardingVisto } from '@/lib/storage';

/** Calculadoras destacadas en el home (nombre/descripción/ruta vienen del catálogo único). */
const PRINCIPALES: Calculadora[] = ['promedio-ponderado', 'nota-minima', 'nem', 'porcentajes']
  .map(getCalculadora)
  .filter((c): c is Calculadora => c !== undefined);

type BannerIcono = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  top: number;
  right: number;
  rotate: string;
  size: number;
};

type Banner = {
  id: string;
  gradient: [string, string];
  titulo: string;
  tituloAcento: string;
  subtitulo: string;
  boton: string;
  ruta: Href;
  iconos: BannerIcono[];
};

const BANNERS: Banner[] = [
  {
    id: 'catalogo',
    gradient: ['#1e1b4b', '#4c1d95'],
    titulo: 'Calculadoras académicas',
    tituloAcento: 'en un solo lugar',
    subtitulo: 'Notas, porcentajes, PAES y más. Rápido, simple y confiable.',
    boton: 'Ver más',
    ruta: '/calculadoras',
    iconos: [
      { name: 'school', color: '#a78bfa', top: 10, right: 78, rotate: '-12deg', size: 26 },
      { name: 'flash', color: '#22d3ee', top: 44, right: 108, rotate: '8deg', size: 22 },
      { name: 'pricetag', color: '#fb923c', top: 6, right: 22, rotate: '10deg', size: 24 },
      { name: 'calculator', color: '#c4b5fd', top: 52, right: 34, rotate: '-6deg', size: 32 },
    ],
  },
  {
    id: 'paes',
    gradient: ['#0c2a4a', '#312e81'],
    titulo: 'Prepárate para la PAES',
    tituloAcento: 'con simulaciones reales',
    subtitulo: 'Estima tu NEM, tu puntaje ponderado y tu ranking de postulación.',
    boton: 'Ver más',
    ruta: '/calculadoras/nem',
    iconos: [
      { name: 'school', color: '#38bdf8', top: 14, right: 70, rotate: '-10deg', size: 26 },
      { name: 'sparkles', color: '#a78bfa', top: 48, right: 26, rotate: '8deg', size: 24 },
      { name: 'clipboard', color: '#c4b5fd', top: 8, right: 20, rotate: '6deg', size: 26 },
    ],
  },
  {
    id: 'favoritos',
    gradient: ['#3b0764', '#701a75'],
    titulo: 'Tus favoritas',
    tituloAcento: 'siempre a mano',
    subtitulo: 'Guarda las calculadoras que más usas y accede a ellas al instante.',
    boton: 'Ver favoritos',
    ruta: '/favoritos',
    iconos: [
      { name: 'heart', color: '#f472b6', top: 14, right: 80, rotate: '-8deg', size: 24 },
      { name: 'star', color: '#fbbf24', top: 46, right: 34, rotate: '10deg', size: 24 },
      { name: 'bookmark', color: '#e9d5ff', top: 8, right: 22, rotate: '-6deg', size: 22 },
    ],
  },
];

/** Funciones en camino (tarjeta informativa al final del home). */
const NOVEDADES: { icono: keyof typeof Ionicons.glyphMap; texto: string }[] = [
  { icono: 'camera-outline', texto: 'Resolver con una foto' },
  { icono: 'book-outline', texto: 'Teoría PAES' },
  { icono: 'timer-outline', texto: 'Simulacros y banco de preguntas' },
  { icono: 'chatbubbles-outline', texto: 'Tutor IA' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const { width } = useWindowDimensions();
  const [bannerActivo, setBannerActivo] = useState(0);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // __DEV__: forzar siempre para poder revisarlo; en producción solo la primera vez.
    getOnboardingVisto().then((visto) => setMostrarOnboarding(__DEV__ || !visto));
  }, []);

  // Ocultar la tab bar mientras el onboarding cubre la pantalla
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: mostrarOnboarding
        ? { display: 'none' }
        : {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingTop: 6,
            paddingBottom: Math.max(insets.bottom, 8),
          },
    });
  }, [mostrarOnboarding, navigation, insets.bottom, colors]);

  const bannerWidth = width - Spacing.four * 2;

  const alCambiarBanner = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
    setBannerActivo(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {mostrarOnboarding && <Onboarding onListo={() => setMostrarOnboarding(false)} />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: Spacing.four,
          gap: Spacing.three,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Header compacto: logo + nombre + settings */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/icon1.png')}
              style={styles.brandMark}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>CalculaPromedio</Text>
          </View>

          <Pressable
            onPress={() => {}}
            hitSlop={10}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="settings-outline" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Carrusel de banners */}
        <FlatList
          data={BANNERS}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={bannerWidth}
          decelerationRate="fast"
          onMomentumScrollEnd={alCambiarBanner}
          renderItem={({ item }) => (
            <View style={{ width: bannerWidth }}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.banner}>
                {/* Iconos decorativos */}
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {item.iconos.map((icono) => (
                    <View
                      key={`${item.id}-${icono.name}`}
                      style={[
                        styles.bannerDecor,
                        {
                          top: icono.top,
                          right: icono.right,
                          transform: [{ rotate: icono.rotate }],
                        },
                      ]}>
                      <Ionicons name={icono.name} size={icono.size} color={icono.color} />
                    </View>
                  ))}
                </View>

                <View style={styles.bannerTextCol}>
                  <Text style={styles.bannerTitle}>
                    {item.titulo}{' '}
                    <Text style={styles.bannerTitleAccent}>{item.tituloAcento}</Text>
                  </Text>
                  <Text style={styles.bannerSubtitle} numberOfLines={2}>
                    {item.subtitulo}
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push(item.ruta)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.bannerBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <Text style={styles.bannerBtnText}>{item.boton}</Text>
                  <Ionicons name="chevron-forward" size={13} color="#ffffff" />
                </Pressable>
              </LinearGradient>
            </View>
          )}
        />

        {/* Dots del carrusel */}
        <View style={styles.dotsRow}>
          {BANNERS.map((banner, index) => (
            <View
              key={banner.id}
              style={[
                styles.dot,
                {
                  width: index === bannerActivo ? 18 : 6,
                  backgroundColor:
                    index === bannerActivo ? '#ffffff' : 'rgba(255,255,255,0.30)',
                },
              ]}
            />
          ))}
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
            const estilo = ESTILO_CARD[calc.id];
            return (
              <View key={calc.id} style={{ gap: 10 }}>
                <Pressable
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
                  <View
                    style={[
                      styles.cardIcon,
                      { backgroundColor: `${estilo.color}2e`, borderColor: `${estilo.color}59` },
                    ]}>
                    <Ionicons name={estilo.icono} size={22} color={estilo.color} />
                  </View>
                  <View style={styles.cardTextCol}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{calc.nombre}</Text>
                    <Text
                      style={[styles.cardDesc, { color: colors.textMuted }]}
                      numberOfLines={2}>
                      {calc.descripcion.endsWith('.') ? calc.descripcion : `${calc.descripcion}.`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Novedades: informativo, sin botón (no hay funciones pendientes "clicables") */}
        <View style={styles.novedades}>
          <View style={styles.novedadesHeader}>
            <View style={styles.novedadesIcono}>
              <Ionicons name="sparkles" size={18} color="#fbbf24" />
            </View>
            <Text style={styles.novedadesTitulo}>Se vienen novedades</Text>
          </View>
          {NOVEDADES.map((n) => (
            <View key={n.texto} style={styles.novedadFila}>
              <Ionicons name={n.icono} size={18} color="#a5b4fc" />
              <Text style={styles.novedadTexto}>{n.texto}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  banner: {
    borderRadius: 20,
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerDecor: {
    position: 'absolute',
    opacity: 0.9,
  },
  bannerTextCol: {
    maxWidth: '62%',
    gap: 6,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  bannerTitleAccent: {
    color: '#a78bfa',
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  bannerBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#7c3aed',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bannerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacing.two,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
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
    paddingHorizontal: 14,
    height: 84,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  novedades: {
    marginTop: Spacing.two,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.30)',
    backgroundColor: 'rgba(99,102,241,0.10)',
  },
  novedadesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  novedadesIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  novedadesTitulo: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  novedadFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  novedadTexto: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
});
