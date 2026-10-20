import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Line, Path, Polygon } from 'react-native-svg';

import { useSesion } from '@/context/sesion';

/** Colores de la identidad: fondo oscuro, índigo y cian. */
const FONDO = '#070B1A';
const INDIGO = '#6366F1';
const CIAN = '#0891B2';
const TEXTO_SUAVE = '#94A3B8';
const FORMULA = '#A5B4FC';

const DURACION_SALIDA_MS = 450;
/**
 * Tiempo mínimo que se ve la pantalla, para apreciar la animación aunque la sesión
 * se restaure muy rápido. Se puede bajar a 0 para quitar la espera.
 */
const TIEMPO_MINIMO_MS = 2500;

type Formula = {
  texto: string;
  /** Posición como fracción de la pantalla (0 a 1). */
  x: number;
  y: number;
  giro: string;
  tamano: number;
};

/** Expresiones matemáticas correctas, distribuidas alrededor del centro. */
const FORMULAS: Formula[] = [
  { texto: 'x = (−b ± √(b² − 4ac)) / 2a', x: -0.08, y: 0.1, giro: '-8deg', tamano: 15 },
  { texto: 'a² + b² = c²', x: 0.58, y: 0.2, giro: '6deg', tamano: 17 },
  { texto: 'y = ax² + bx + c', x: -0.04, y: 0.66, giro: '-5deg', tamano: 15 },
  { texto: 'lím x→0  sen x / x = 1', x: 0.5, y: 0.56, giro: '4deg', tamano: 14 },
  { texto: 'Σ aᵢ   (i = 1 … n)', x: 0.6, y: 0.82, giro: '-4deg', tamano: 16 },
];

/** Símbolos sueltos: π, raíz, operaciones. */
const SIMBOLOS: { texto: string; x: number; y: number; color: string; tamano: number }[] = [
  { texto: 'π', x: 0.1, y: 0.4, color: INDIGO, tamano: 44 },
  { texto: '√', x: 0.86, y: 0.42, color: CIAN, tamano: 30 },
  { texto: '+', x: 0.14, y: 0.8, color: CIAN, tamano: 26 },
  { texto: '÷', x: 0.5, y: 0.9, color: INDIGO, tamano: 24 },
];

/** Anima un valor entre 0 y 1 en bucle, con retraso inicial opcional. */
function bucle(valor: Animated.Value, duracion: number, retraso = 0): Animated.CompositeAnimation {
  return Animated.loop(
    Animated.sequence([
      Animated.delay(retraso),
      Animated.timing(valor, { toValue: 1, duration: duracion, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(valor, { toValue: 0, duration: duracion, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])
  );
}

function FormulaFlotante({
  formula,
  indice,
  reducirMovimiento,
  ancho,
  alto,
}: {
  formula: Formula;
  indice: number;
  reducirMovimiento: boolean;
  ancho: number;
  alto: number;
}) {
  const entrada = useState(() => new Animated.Value(0))[0];
  const flotar = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const entra = Animated.timing(entrada, {
      toValue: 1,
      duration: 900,
      delay: 150 + indice * 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    entra.start();
    if (reducirMovimiento) return () => entra.stop();

    const movimiento = bucle(flotar, 4200 + indice * 500, indice * 200);
    movimiento.start();
    return () => {
      entra.stop();
      movimiento.stop();
    };
  }, [entrada, flotar, indice, reducirMovimiento]);

  const translateY = flotar.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] });

  return (
    <Animated.Text
      style={[
        styles.formula,
        {
          left: formula.x * ancho,
          top: formula.y * alto,
          fontSize: formula.tamano,
          opacity: Animated.multiply(entrada, 0.55),
          transform: [{ translateY }, { rotate: formula.giro }],
        },
      ]}>
      {formula.texto}
    </Animated.Text>
  );
}

function PuntosCarga({ reducirMovimiento }: { reducirMovimiento: boolean }) {
  const valores = [useState(() => new Animated.Value(0))[0], useState(() => new Animated.Value(0))[0], useState(() => new Animated.Value(0))[0]];

  useEffect(() => {
    if (reducirMovimiento) return;
    const animaciones = valores.map((v, i) => bucle(v, 600, i * 200));
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
    // Los valores son refs estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducirMovimiento]);

  return (
    <View style={styles.puntos}>
      {valores.map((v, i) => {
        const color = v.interpolate({ inputRange: [0, 1], outputRange: [INDIGO, CIAN] });
        return <Animated.View key={i} style={[styles.punto, { backgroundColor: reducirMovimiento ? INDIGO : color }]} />;
      })}
    </View>
  );
}

/** Gráfica de parábola y ejes, dibujada con SVG (sin animación de trazo, para mantener el consumo bajo). */
function GraficaParabola() {
  return (
    <Svg width={150} height={110} viewBox="0 0 150 110">
      <Line x1="10" y1="90" x2="140" y2="90" stroke={FORMULA} strokeWidth="1" opacity={0.5} />
      <Line x1="75" y1="8" x2="75" y2="104" stroke={FORMULA} strokeWidth="1" opacity={0.5} />
      <Path d="M 14 14 Q 75 170 136 14" fill="none" stroke={CIAN} strokeWidth="2" opacity={0.85} />
    </Svg>
  );
}

/** Triángulo rectángulo con sus lados, como en la imagen de referencia. */
function TrianguloRectangulo() {
  return (
    <Svg width={92} height={72} viewBox="0 0 92 72">
      <Polygon points="6,66 6,8 86,66" fill="none" stroke={INDIGO} strokeWidth="1.5" opacity={0.7} />
      <Path d="M 6 56 L 16 56 L 16 66" fill="none" stroke={INDIGO} strokeWidth="1" opacity={0.7} />
    </Svg>
  );
}

/**
 * Pantalla de carga de la app: aparece mientras se restaura la sesión y se va
 * cuando la app está lista, sin esperas artificiales.
 */
export function PantallaCarga() {
  const { cargando } = useSesion();
  const { width: ancho, height: alto } = useWindowDimensions();
  const [visible, setVisible] = useState(true);
  // Momento en que aparece la pantalla, para respetar el tiempo mínimo
  const [inicio] = useState(() => ({ current: Date.now() }));
  const [reducirMovimiento, setReducirMovimiento] = useState(false);

  const salida = useState(() => new Animated.Value(1))[0];
  const aparicionLogo = useState(() => new Animated.Value(0))[0];
  const aparicionTexto = useState(() => new Animated.Value(0))[0];

  // Respeta la preferencia de reducir animaciones del sistema
  useEffect(() => {
    let activo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (activo) setReducirMovimiento(valor);
    });
    return () => {
      activo = false;
    };
  }, []);

  // Entrada del logo y del texto
  useEffect(() => {
    Animated.parallel([
      Animated.timing(aparicionLogo, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(aparicionTexto, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
    ]).start();
  }, [aparicionLogo, aparicionTexto]);

  // Cuando la sesión está restaurada y pasó el tiempo mínimo, se desvanece y se retira
  useEffect(() => {
    if (cargando) return;
    const transcurrido = Date.now() - inicio.current;
    const espera = Math.max(TIEMPO_MINIMO_MS - transcurrido, 0);
    const temporizador = setTimeout(() => {
      Animated.timing(salida, { toValue: 0, duration: DURACION_SALIDA_MS, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }, espera);
    return () => clearTimeout(temporizador);
  }, [cargando, salida, inicio]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={cargando ? 'auto' : 'none'}
      onLayout={() => {
        // La pantalla nativa se oculta solo cuando esta ya se pinta, para evitar un destello
        SplashScreen.hideAsync().catch(() => {});
      }}
      style={[styles.contenedor, { opacity: salida }]}>
      {/* Formas de fondo, muy sutiles */}
      <View style={[styles.circulo, styles.circuloIndigo]} />
      <View style={[styles.circulo, styles.circuloCian]} />

      {FORMULAS.map((f, i) => (
        <FormulaFlotante key={f.texto} formula={f} indice={i} reducirMovimiento={reducirMovimiento} ancho={ancho} alto={alto} />
      ))}

      {SIMBOLOS.map((s) => (
        <Text key={s.texto + s.x} style={[styles.simbolo, { left: s.x * ancho, top: s.y * alto, color: s.color, fontSize: s.tamano }]}>
          {s.texto}
        </Text>
      ))}

      <View style={[styles.grafica, { left: 0.02 * ancho, top: 0.38 * alto }]}>
        <GraficaParabola />
      </View>
      <View style={[styles.triangulo, { left: 0.7 * ancho, top: 0.3 * alto }]}>
        <TrianguloRectangulo />
      </View>

      {/* Centro: isotipo, indicador y texto */}
      <View style={styles.centro}>
        <Animated.View
          style={{
            opacity: aparicionLogo,
            transform: [{ scale: aparicionLogo.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
          }}>
          <Image source={require('@/assets/images/icon1.png')} style={styles.logo} />
        </Animated.View>

        <PuntosCarga reducirMovimiento={reducirMovimiento} />

        <Animated.Text style={[styles.texto, { opacity: aparicionTexto }]}>
          Preparando tu espacio{'\n'}de estudio…
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: FONDO,
    zIndex: 100,
    overflow: 'hidden',
  },
  circulo: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  circuloIndigo: {
    width: 320,
    height: 320,
    bottom: -150,
    left: -120,
    backgroundColor: INDIGO,
  },
  circuloCian: {
    width: 300,
    height: 300,
    bottom: -140,
    right: -130,
    backgroundColor: CIAN,
  },
  formula: {
    position: 'absolute',
    color: FORMULA,
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  simbolo: {
    position: 'absolute',
    fontWeight: '300',
    opacity: 0.6,
  },
  grafica: {
    position: 'absolute',
    opacity: 0.5,
  },
  triangulo: {
    position: 'absolute',
    opacity: 0.6,
  },
  centro: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  logo: {
    width: 104,
    height: 104,
  },
  puntos: {
    flexDirection: 'row',
    gap: 10,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  texto: {
    color: TEXTO_SUAVE,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
