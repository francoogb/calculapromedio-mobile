import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { marcarOnboardingVisto } from '@/lib/storage';

type Slider = {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  tituloAcento: string;
  texto: string;
  imagen?: ImageSourcePropType;
  /** Ancho / alto de la imagen. Sin valor se muestra cuadrada. */
  imagenAspecto?: number;
};

/** Alto común de las ilustraciones del onboarding. */
const ALTO_IMAGEN = 290;

/** Los 3 pasos del onboarding. */
const SLIDERS: Slider[] = [
  {
    id: 'todo-en-un-lugar',
    icono: 'calculator',
    titulo: 'Aprende y calcula',
    tituloAcento: 'de forma más fácil',
    texto: 'Encuentra herramientas para tus notas, promedios y preparación académica en una sola aplicación.',
    imagen: require('../../assets/images/onboarding-1.webp'),
  },
  {
    id: 'resolver-foto',
    icono: 'camera',
    titulo: 'Escanea y resuelve',
    tituloAcento: 'con una foto',
    texto: 'Toma una foto de tu ejercicio, selecciona el problema y descubre su solución paso a paso.',
    imagen: require('../../assets/images/onboarding-2.webp'),
  },
  {
    id: 'progreso',
    icono: 'trending-up',
    titulo: 'Tu progreso,',
    tituloAcento: 'paso a paso',
    texto: 'Guarda tus calculadoras favoritas, revisa tu historial de cálculos y sigue tu avance a medida que utilizas CalculaPromedio.',
    imagen: require('../../assets/images/onboarding-3.webp'),
  },
];

/** Onboarding de primer uso: 3 pasos, se muestra una vez y se guarda localmente. */
export function Onboarding({ onListo }: { onListo: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // La ilustración se adapta al alto de la pantalla para que el texto de abajo siempre se vea
  const altoImagen = Math.min(ALTO_IMAGEN, Math.max(180, Math.round(height * 0.32)));
  const pagerRef = useRef<ScrollView>(null);
  const [paginaActiva, setPaginaActiva] = useState(0);

  const esUltima = paginaActiva === SLIDERS.length - 1;

  /** Solo se avanza con el botón "Continuar": el deslizamiento con el dedo está desactivado. */
  function continuar() {
    const siguiente = Math.min(paginaActiva + 1, SLIDERS.length - 1);
    pagerRef.current?.scrollTo({ x: width * siguiente, animated: true });
    setPaginaActiva(siguiente);
  }

  async function terminar() {
    await marcarOnboardingVisto();
    onListo();
    router.replace('/');
  }

  /** Cierra el onboarding y abre la pantalla de inicio de sesión (la misma que usa el perfil). */
  async function irALogin() {
    await marcarOnboardingVisto();
    onListo();
    router.push('/login');
  }

  return (
    <View style={[styles.overlay, { backgroundColor: Colors.dark.background }]}>
      {/* Decoraciones flotantes */}
      <Ionicons name="school" size={72} color="#8b5cf6" style={[styles.decor, styles.decorCap]} />
      <Ionicons name="calculator" size={64} color="#8b5cf6" style={[styles.decor, styles.decorCalc]} />
      <Ionicons name="stats-chart" size={60} color="#8b5cf6" style={[styles.decor, styles.decorStats]} />
      <Text style={[styles.decor, styles.decorNota, styles.decorNota1]}>6.5</Text>
      <Text style={[styles.decor, styles.decorNota, styles.decorNota2]}>5.5</Text>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Top: Saltar */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
          <View style={styles.topBarSpacer} />
          <Pressable onPress={terminar} hitSlop={8}>
            <Text style={styles.saltar}>Saltar</Text>
          </Pressable>
        </View>

        {/* Sliders */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}>
          {SLIDERS.map((slider) => (
            <ScrollView
              key={slider.id}
              style={{ width }}
              contentContainerStyle={styles.pagina}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {slider.imagen ? (
                <Image
                  source={slider.imagen}
                  style={[
                    styles.sliderImagen,
                    { width: altoImagen * (slider.imagenAspecto ?? 1), height: altoImagen },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.sliderIconoWrap}>
                  <LinearGradient
                    colors={['#4f46e5', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sliderIcono}>
                    <Ionicons name={slider.icono} size={44} color="#ffffff" />
                  </LinearGradient>
                </View>
              )}
              <Text style={styles.sliderTitulo}>{slider.titulo}</Text>
              <Text style={styles.sliderTituloAcento}>{slider.tituloAcento}</Text>
              <Text style={styles.sliderTexto}>{slider.texto}</Text>
            </ScrollView>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDERS.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === paginaActiva && styles.dotActiva]} />
          ))}
        </View>

        {/* Footer: Continuar/Comenzar + login opcional */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.four }]}>
          <Pressable
            onPress={esUltima ? terminar : continuar}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <LinearGradient
              colors={['#22d3ee', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.boton}>
              <Text style={styles.botonTexto}>{esUltima ? 'Comenzar' : 'Continuar'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </LinearGradient>
          </Pressable>

          <Pressable onPress={irALogin} hitSlop={8} style={styles.loginLink}>
            <Text style={styles.loginLinkTexto}>
              ¿Ya tienes cuenta? <Text style={styles.loginLinkStrong}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  decor: {
    position: 'absolute',
    opacity: 0.22,
  },
  decorCap: {
    top: 70,
    left: 24,
    transform: [{ rotate: '-12deg' }],
  },
  decorCalc: {
    top: 100,
    right: 32,
    transform: [{ rotate: '10deg' }],
  },
  decorStats: {
    top: 190,
    left: 70,
    transform: [{ rotate: '-8deg' }],
  },
  decorNota: {
    fontSize: 34,
    fontWeight: '800',
    color: '#a78bfa',
  },
  decorNota1: {
    top: 260,
    left: 36,
    transform: [{ rotate: '8deg' }],
  },
  decorNota2: {
    top: 280,
    right: 44,
    transform: [{ rotate: '-10deg' }],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  topBarSpacer: {
    flex: 1,
  },
  saltar: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  pagina: {
    alignItems: 'stretch',
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five + Spacing.two,
    paddingBottom: Spacing.three,
  },
  sliderImagen: {
    alignSelf: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  sliderIconoWrap: {
    alignSelf: 'center',
    marginTop: Spacing.five,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  sliderIcono: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTitulo: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: Spacing.six,
    textAlign: 'left',
  },
  sliderTituloAcento: {
    color: '#38bdf8',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'left',
  },
  sliderTexto: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
    marginTop: Spacing.three,
    maxWidth: 340,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActiva: {
    width: 22,
    backgroundColor: '#ffffff',
  },
  footer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  botonTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkTexto: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loginLinkStrong: {
    color: '#a78bfa',
    fontWeight: '700',
  },
});
