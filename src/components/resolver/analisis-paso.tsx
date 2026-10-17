import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path, Polygon, Rect } from 'react-native-svg';

const ETAPAS = [
  'Reconociendo texto',
  'Interpretando figuras',
  'Identificando el problema',
  'Preparando la solución',
];

const CIAN = '#22d3ee';
const AZUL = '#2f55ff';
const LAVANDA = '#c7d2fe';

type Props = {
  /** Cancela la espera y vuelve al recorte. */
  onCancelar: () => void;
};

/** Tarjeta de vidrio decorativa del fondo. */
function Vidrio({ estilo, children }: { estilo: ViewStyle; children: ReactNode }) {
  return (
    <View pointerEvents="none" style={[styles.vidrio, estilo]}>
      {children}
    </View>
  );
}

/** Paso 3: preloader mientras el modelo lee y resuelve el ejercicio recortado. */
export function AnalisisPaso({ onCancelar }: Props) {
  const insets = useSafeAreaInsets();
  const [etapa, setEtapa] = useState(0);
  const [punto, setPunto] = useState(0);

  // Las etapas avanzan por tiempo: es una animación de espera, no el progreso real del servidor
  useEffect(() => {
    const etapas = setInterval(
      () => setEtapa((actual) => Math.min(actual + 1, ETAPAS.length - 1)),
      1800
    );
    const puntos = setInterval(() => setPunto((actual) => (actual + 1) % 3), 450);
    return () => {
      clearInterval(etapas);
      clearInterval(puntos);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Fondo decorativo */}
      <Vidrio estilo={{ left: -22, top: 80, width: 118, height: 96, transform: [{ rotate: '-12deg' }] }}>
        <Text style={[styles.simboloGrande, { color: AZUL }]}>π</Text>
      </Vidrio>

      <Vidrio estilo={{ right: -26, top: 62, width: 132, height: 150, transform: [{ rotate: '6deg' }] }}>
        <Svg width={92} height={104} viewBox="0 0 92 104">
          <Polygon points="14,92 14,14 78,92" fill="none" stroke="#6b8cff" strokeWidth={2} />
          <Rect x={14} y={80} width={12} height={12} fill="none" stroke="#6b8cff" strokeWidth={2} />
        </Svg>
      </Vidrio>

      <Vidrio estilo={{ left: -16, bottom: 36, width: 156, height: 132, transform: [{ rotate: '5deg' }] }}>
        <Svg width={110} height={96} viewBox="0 0 110 96">
          <Line x1={55} y1={4} x2={55} y2={92} stroke="#6b8cff" strokeWidth={1.5} />
          <Line x1={6} y1={64} x2={104} y2={64} stroke="#6b8cff" strokeWidth={1.5} />
          <Path d="M16 10 Q55 140 94 10" fill="none" stroke={CIAN} strokeWidth={2.5} />
        </Svg>
      </Vidrio>

      <Vidrio estilo={{ right: -18, bottom: 52, width: 124, height: 112, transform: [{ rotate: '-8deg' }] }}>
        <Text style={[styles.simboloGrande, { color: '#6b8cff', fontSize: 52 }]}>Σ</Text>
      </Vidrio>

      <Text pointerEvents="none" style={[styles.flotante, { right: '14%', top: '36%', color: '#3b6bff', fontSize: 34 }]}>
        √
      </Text>
      <Text pointerEvents="none" style={[styles.flotante, { left: '5%', top: '44%', color: '#3b6bff', fontSize: 34 }]}>
        +
      </Text>
      <Text pointerEvents="none" style={[styles.flotante, { left: '44%', bottom: '17%', color: '#3b6bff', fontSize: 30 }]}>
        ÷
      </Text>
      <Text pointerEvents="none" style={[styles.flotante, { right: '4%', bottom: '38%', color: '#3b6bff', fontSize: 30 }]}>
        ×
      </Text>

      {/* Contenido */}
      <View style={styles.centro}>
        <View style={styles.icono}>
          <Ionicons name="document-text-outline" size={96} color={LAVANDA} />
          <View style={styles.lupa}>
            <Ionicons name="search" size={46} color={CIAN} />
          </View>
        </View>

        <Text style={styles.titulo}>Analizando ejercicio...</Text>

        <View style={styles.puntos}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.punto, { backgroundColor: i === punto ? CIAN : '#2a3fd6' }]}
            />
          ))}
        </View>

        <View style={styles.lista}>
          {ETAPAS.map((nombre, i) => {
            const lista = i < etapa;
            const actual = i === etapa;
            return (
              <View key={nombre} style={styles.etapa}>
                {lista ? (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={16} color="#06202c" />
                  </View>
                ) : actual ? (
                  <View style={styles.check}>
                    <ActivityIndicator size="small" color="#60a5fa" />
                  </View>
                ) : (
                  <View style={[styles.check, styles.pendiente]} />
                )}
                <Text style={[styles.etapaTexto, { opacity: i <= etapa ? 1 : 0.55 }]}>
                  {nombre}
                  {actual ? '...' : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={onCancelar}
        hitSlop={12}
        style={[styles.cancelar, { bottom: insets.bottom + 18 }]}>
        <Text style={styles.cancelarTexto}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B1A',
    overflow: 'hidden',
  },
  vidrio: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  simboloGrande: {
    fontSize: 46,
    fontWeight: '600',
  },
  flotante: {
    position: 'absolute',
    fontWeight: '700',
    opacity: 0.5,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icono: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  lupa: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    padding: 3,
    borderRadius: 30,
    backgroundColor: '#070B1A',
  },
  titulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  puntos: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 30,
    marginBottom: 34,
  },
  punto: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  lista: {
    alignSelf: 'stretch',
    gap: 20,
    paddingLeft: 24,
  },
  etapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CIAN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendiente: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#475569',
  },
  etapaTexto: {
    flex: 1,
    color: LAVANDA,
    fontSize: 17,
  },
  cancelar: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelarTexto: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
