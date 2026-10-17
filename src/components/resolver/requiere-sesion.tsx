import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Rect } from 'react-native-svg';

import { BotonEnviar } from '@/components/cuenta/campos';
import { Colors } from '@/constants/theme';

import { FondoNeon } from './fondo-neon';

const CIAN = '#38bdf8';

type Props = {
  onIniciarSesion: () => void;
  onVolver: () => void;
};

/** Tarjeta de vidrio de la ilustración. */
function Vidrio({ estilo, children }: { estilo: ViewStyle; children: ReactNode }) {
  return (
    <View pointerEvents="none" style={[styles.vidrio, estilo]}>
      {children}
    </View>
  );
}

/** Aviso para invitados: Resolver con foto necesita una cuenta (cada análisis tiene un costo). */
export function RequiereSesion({ onIniciarSesion, onVolver }: Props) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  return (
    <FondoNeon style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={onVolver} hitSlop={12} style={styles.atras}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        {/* Ilustración */}
        <View style={styles.ilustracion}>
          {/* Órbitas punteadas detrás de las tarjetas */}
          <View pointerEvents="none" style={[styles.orbita, { left: -6, top: 70, width: 130, height: 130 }]} />
          <View pointerEvents="none" style={[styles.orbita, { right: -8, top: 112, width: 150, height: 150 }]} />

          <Vidrio estilo={{ left: '2%', top: 18, width: 150, height: 108, transform: [{ rotate: '-8deg' }] }}>
            <Svg width={96} height={72} viewBox="0 0 96 72">
              <Polygon points="12,62 12,10 84,62" fill="none" stroke="#6b8cff" strokeWidth={2} />
              <Rect x={12} y={52} width={10} height={10} fill="none" stroke="#6b8cff" strokeWidth={2} />
            </Svg>
            <Text style={[styles.etiquetaFigura, { left: 14, top: 40 }]}>3</Text>
            <Text style={[styles.etiquetaFigura, { left: 62, top: 82 }]}>4</Text>
            <Text style={[styles.etiquetaFigura, { left: 84, top: 28, fontStyle: 'italic' }]}>x</Text>
          </Vidrio>

          <Vidrio estilo={{ right: '2%', top: 4, width: 176, height: 64, transform: [{ rotate: '5deg' }] }}>
            <Text style={styles.formula}>x = −b ± √(b² − 4ac)</Text>
            <View style={styles.formulaLinea} />
            <Text style={styles.formula}>2a</Text>
          </Vidrio>

          <Vidrio estilo={{ left: '27%', top: 92, width: 176, height: 150, transform: [{ rotate: '4deg' }] }}>
            <View style={[styles.esquina, styles.esquinaArribaIzq]} />
            <View style={[styles.esquina, styles.esquinaArribaDer]} />
            <View style={[styles.esquina, styles.esquinaAbajoIzq]} />
            <View style={[styles.esquina, styles.esquinaAbajoDer]} />
            <View style={styles.camara}>
              <Ionicons name="camera" size={44} color="#e0e7ff" />
            </View>
          </Vidrio>

          <Vidrio estilo={{ left: '6%', top: 186, width: 58, height: 58, borderRadius: 18 }}>
            <Text style={styles.simbolo}>π</Text>
          </Vidrio>

          <Vidrio estilo={{ right: '8%', top: 140, width: 56, height: 66, borderRadius: 18 }}>
            <Text style={styles.simbolo}>√</Text>
          </Vidrio>

          <Ionicons name="sparkles" size={22} color={CIAN} style={[styles.brillo, { left: '47%', top: 52 }]} />
          <Ionicons name="sparkles" size={20} color={CIAN} style={[styles.brillo, { right: '6%', top: 92 }]} />
        </View>

        {/* Tarjeta principal */}
        <View style={styles.tarjeta}>
          <Text style={[styles.titulo, { color: colors.text }]}>
            Inicia sesión para <Text style={{ color: CIAN }}>continuar</Text>
          </Text>
          <Text style={[styles.texto, { color: colors.textMuted }]}>
            Necesitas tener una cuenta gratuita para acceder a esta herramienta.
          </Text>

          {/* Mismo botón que la pantalla de login, para mantener la coherencia visual */}
          <View style={styles.botonContenedor}>
            <BotonEnviar label="Iniciar sesión" onPress={onIniciarSesion} />
          </View>

          <Pressable onPress={onVolver} hitSlop={10}>
            <Text style={styles.enlace}>Volver</Text>
          </Pressable>
        </View>

      </ScrollView>
    </FondoNeon>
  );
}

const ESQUINA = 26;
const GROSOR = 4;

const styles = StyleSheet.create({
  contenido: {
    paddingHorizontal: 20,
    gap: 20,
  },
  atras: {
    width: 42,
    height: 42,
    marginTop: 8,
    justifyContent: 'center',
  },
  ilustracion: {
    height: 260,
  },
  orbita: {
    position: 'absolute',
    borderRadius: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(96,165,250,0.35)',
  },
  vidrio: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
    backgroundColor: 'rgba(37,99,235,0.14)',
  },
  etiquetaFigura: {
    position: 'absolute',
    color: '#c7d2fe',
    fontSize: 14,
  },
  formula: {
    color: '#c7d2fe',
    fontSize: 13,
    fontStyle: 'italic',
  },
  formulaLinea: {
    width: 120,
    height: 1,
    backgroundColor: '#6b8cff',
    marginVertical: 2,
  },
  camara: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  esquina: {
    position: 'absolute',
    width: ESQUINA,
    height: ESQUINA,
    borderColor: CIAN,
  },
  esquinaArribaIzq: {
    top: 18,
    left: 18,
    borderTopWidth: GROSOR,
    borderLeftWidth: GROSOR,
    borderTopLeftRadius: 10,
  },
  esquinaArribaDer: {
    top: 18,
    right: 18,
    borderTopWidth: GROSOR,
    borderRightWidth: GROSOR,
    borderTopRightRadius: 10,
  },
  esquinaAbajoIzq: {
    bottom: 18,
    left: 18,
    borderBottomWidth: GROSOR,
    borderLeftWidth: GROSOR,
    borderBottomLeftRadius: 10,
  },
  esquinaAbajoDer: {
    bottom: 18,
    right: 18,
    borderBottomWidth: GROSOR,
    borderRightWidth: GROSOR,
    borderBottomRightRadius: 10,
  },
  simbolo: {
    color: '#a5b4fc',
    fontSize: 30,
    fontWeight: '700',
  },
  brillo: {
    position: 'absolute',
  },
  tarjeta: {
    alignItems: 'center',
    gap: 14,
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
    backgroundColor: 'rgba(15,23,48,0.75)',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  botonContenedor: {
    alignSelf: 'stretch',
    marginTop: 6,
  },
  enlace: {
    color: '#818cf8',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 6,
  },
});
