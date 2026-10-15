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
  TextInput,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError } from '@/lib/api';
import { marcarOnboardingVisto } from '@/lib/storage';
import { esCorreoValido, sugerirCorreo } from '@/lib/validacion';

type Slider = {
  id: string;
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  tituloAcento: string;
  texto: string;
  imagen?: ImageSourcePropType;
};

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
    id: 'tutor-ia',
    icono: 'chatbubbles',
    titulo: 'Entiende, no solo',
    tituloAcento: 'memorices',
    texto: 'Practica ejercicios, recibe explicaciones paso a paso y utiliza el Tutor IA para comprender los temas que más te cuestan.',
    imagen: require('../../assets/images/onboarding-2.webp'),
  },
  {
    id: 'progreso',
    icono: 'trending-up',
    titulo: 'Tu progreso,',
    tituloAcento: 'paso a paso',
    texto: 'Practica para la PAES, organiza tus estudios y sigue tu avance a medida que utilizas CalculaPromedio.',
    imagen: require('../../assets/images/onboarding-3.webp'),
  },
];

/** Onboarding de primer uso: 3 pasos, se muestra una vez y se guarda localmente. */
export function Onboarding({ onListo }: { onListo: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { iniciarSesion } = useSesion();
  const pagerRef = useRef<ScrollView>(null);
  const [paginaActiva, setPaginaActiva] = useState(0);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensajeLogin, setMensajeLogin] = useState<string | null>(null);
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const esUltima = paginaActiva === SLIDERS.length - 1;

  const alCambiarPagina = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPaginaActiva(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  function continuar() {
    pagerRef.current?.scrollTo({ x: width * (paginaActiva + 1), animated: true });
  }

  async function terminar() {
    await marcarOnboardingVisto();
    onListo();
    router.replace('/');
  }

  async function enviarLogin() {
    if (cargandoLogin) return;
    setMensajeLogin(null);
    const correo = email.trim();
    if (!correo || !password) {
      setMensajeLogin('Ingresa tu correo y tu contraseña.');
      return;
    }
    if (!esCorreoValido(correo)) {
      const sugerencia = sugerirCorreo(correo);
      if (sugerencia) {
        // Dominio con typo probable: corregirlo en el campo y pedir confirmación
        setEmail(sugerencia);
        setMensajeLogin(`¿Tenías un error de tipeo? Corregimos el dominio a ${sugerencia}. Revisa y vuelve a intentar.`);
      } else {
        setMensajeLogin('La dirección de correo no parece válida. Revisa que el dominio exista (ej: nombre@correo.com).');
      }
      return;
    }
    setCargandoLogin(true);
    try {
      await iniciarSesion({ email: correo, password });
      await terminar();
    } catch (e) {
      setMensajeLogin(
        e instanceof ApiError ? e.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.'
      );
    } finally {
      setCargandoLogin(false);
    }
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
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={alCambiarPagina}>
          {SLIDERS.map((slider) => (
            <View key={slider.id} style={[styles.pagina, { width }]}>
              {slider.imagen ? (
                <Image source={slider.imagen} style={styles.sliderImagen} resizeMode="cover" />
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
            </View>
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

          <Pressable onPress={() => setMostrarLogin(true)} hitSlop={8} style={styles.loginLink}>
            <Text style={styles.loginLinkTexto}>
              ¿Ya tienes cuenta? <Text style={styles.loginLinkStrong}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de inicio de sesión (opcional) */}
      {mostrarLogin && (
        <View style={styles.modalFondo}>
          <KeyboardAvoidingView behavior="padding" style={{ alignSelf: 'stretch' }}>
            <View style={[styles.modalCard, { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitulo, { color: Colors.dark.text }]}>Bienvenido de nuevo</Text>
                <Pressable onPress={() => setMostrarLogin(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={Colors.dark.textMuted} />
                </Pressable>
              </View>
              <Text style={[styles.modalSubtitulo, { color: Colors.dark.textMuted }]}>
                Inicia sesión para sincronizar tu progreso entre dispositivos.
              </Text>

              <Pressable
                onPress={() => setMensajeLogin('La autenticación con Google estará disponible próximamente.')}
                style={({ pressed }) => [styles.socialBtnGoogle, { opacity: pressed ? 0.9 : 1 }]}>
                <Ionicons name="logo-google" size={18} color="#1f2937" />
                <Text style={styles.socialBtnGoogleTexto}>Continuar con Google</Text>
              </Pressable>
              <Pressable
                onPress={() => setMensajeLogin('La autenticación con Apple estará disponible próximamente.')}
                style={({ pressed }) => [styles.socialBtnApple, { opacity: pressed ? 0.9 : 1 }]}>
                <Ionicons name="logo-apple" size={20} color="#ffffff" />
                <Text style={styles.socialBtnAppleTexto}>Continuar con Apple</Text>
              </Pressable>

              <View style={styles.divisorRow}>
                <View style={[styles.divisorLinea, { backgroundColor: Colors.dark.border }]} />
                <Text style={[styles.divisorTexto, { color: Colors.dark.textMuted }]}>o con tu correo</Text>
                <View style={[styles.divisorLinea, { backgroundColor: Colors.dark.border }]} />
              </View>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { borderColor: Colors.dark.border, color: Colors.dark.text }]}
              />
              <View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!mostrarPass}
                  returnKeyType="done"
                  onSubmitEditing={enviarLogin}
                  style={[
                    styles.input,
                    { borderColor: Colors.dark.border, color: Colors.dark.text, paddingRight: 44 },
                  ]}
                />
                <Pressable
                  onPress={() => setMostrarPass((v) => !v)}
                  hitSlop={10}
                  accessibilityLabel={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={styles.ojoBtnModal}>
                  <Ionicons
                    name={mostrarPass ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={enviarLogin}
                disabled={cargandoLogin}
                style={({ pressed }) => [
                  styles.boton,
                  { opacity: cargandoLogin ? 0.6 : pressed ? 0.92 : 1, backgroundColor: '#4f46e5' },
                ]}>
                <Text style={styles.botonTexto}>{cargandoLogin ? 'Iniciando sesión…' : 'Iniciar sesión'}</Text>
              </Pressable>

              {mensajeLogin && (
                <Text style={[styles.modalMensaje, { color: Colors.dark.textMuted }]}>{mensajeLogin}</Text>
              )}

              <Pressable onPress={() => setMostrarLogin(false)} hitSlop={8}>
                <Text style={[styles.modalSaltar, { color: '#a78bfa' }]}>Continuar sin cuenta</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.six * 1.5,
  },
  sliderImagen: {
    width: 280,
    height: 280,
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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: Spacing.six,
    textAlign: 'center',
  },
  sliderTituloAcento: {
    color: '#38bdf8',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sliderTexto: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: Spacing.three,
    maxWidth: 320,
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
  modalFondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    alignSelf: 'stretch',
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitulo: {
    fontSize: 13,
    lineHeight: 19,
  },
  socialBtnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 13,
  },
  socialBtnGoogleTexto: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '700',
  },
  socialBtnApple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 13,
  },
  socialBtnAppleTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divisorLinea: {
    flex: 1,
    height: 1,
  },
  divisorTexto: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  ojoBtnModal: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  modalMensaje: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalSaltar: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
