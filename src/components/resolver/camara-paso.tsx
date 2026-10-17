import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export type FotoCapturada = { uri: string; width: number; height: number };

type Props = {
  onCapturada: (foto: FotoCapturada) => void;
  onGaleria: () => void;
  onSalir: () => void;
};

/** Paso 1: cámara con marco guía para fotografiar un ejercicio de una guía o libro. */
export function CamaraPaso({ onCapturada, onGaleria, onSalir }: Props) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const camara = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [tomando, setTomando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function tomarFoto() {
    if (tomando || !camara.current) return;
    setTomando(true);
    setError(null);
    try {
      const foto = await camara.current.takePictureAsync({ quality: 0.8 });
      onCapturada({ uri: foto.uri, width: foto.width, height: foto.height });
    } catch {
      setError('No se pudo tomar la foto. Inténtalo de nuevo.');
    } finally {
      setTomando(false);
    }
  }

  // Sin permiso: pantalla explicativa con las dos salidas posibles
  if (!permiso?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Pressable onPress={onSalir} hitSlop={12} style={styles.atrasSolo}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.sinPermiso}>
          <View style={styles.sinPermisoIcono}>
            <Ionicons name="camera" size={34} color="#22d3ee" />
          </View>
          <Text style={[styles.sinPermisoTitulo, { color: colors.text }]}>
            Necesitamos tu cámara
          </Text>
          <Text style={[styles.sinPermisoTexto, { color: colors.textMuted }]}>
            Para fotografiar el ejercicio de tu guía o libro. La foto no se guarda.
          </Text>
          {permiso && !permiso.canAskAgain ? (
            <Text style={[styles.sinPermisoTexto, { color: colors.textMuted }]}>
              Activa el permiso de cámara desde los ajustes del teléfono.
            </Text>
          ) : (
            <Pressable onPress={pedirPermiso} style={styles.botonPrincipal}>
              <Text style={styles.botonPrincipalTexto}>Permitir cámara</Text>
            </Pressable>
          )}
          <Pressable onPress={onGaleria} hitSlop={10}>
            <Text style={styles.enlace}>Elegir de la galería</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={camara}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={linterna}
      />

      {/* Barra superior */}
      <View style={[styles.superior, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onSalir} hitSlop={12} style={styles.botonCircular}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </Pressable>
        <Pressable
          onPress={() => setLinterna((v) => !v)}
          hitSlop={12}
          style={[styles.botonCircular, linterna && styles.botonCircularActivo]}>
          <Ionicons name={linterna ? 'flash' : 'flash-off'} size={20} color="#ffffff" />
        </Pressable>
      </View>

      {/* Instrucción */}
      <View style={[styles.pista, { top: insets.top + 70 }]}>
        <Ionicons name="camera-outline" size={22} color="#22d3ee" />
        <Text style={styles.pistaTexto}>Enfoca un ejercicio de tu guía o libro de PAES.</Text>
      </View>

      {/* Marco guía */}
      <View pointerEvents="none" style={styles.marco}>
        <View style={[styles.esquina, styles.esquinaArribaIzq]} />
        <View style={[styles.esquina, styles.esquinaArribaDer]} />
        <View style={[styles.esquina, styles.esquinaAbajoIzq]} />
        <View style={[styles.esquina, styles.esquinaAbajoDer]} />
      </View>

      {error && (
        <Text style={[styles.error, { bottom: insets.bottom + 190 }]}>{error}</Text>
      )}

      {/* Barra inferior */}
      <View style={[styles.inferior, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable onPress={onGaleria} style={styles.lateral} hitSlop={10}>
          <Ionicons name="images-outline" size={28} color="#ffffff" />
          <Text style={styles.lateralTexto}>Galería</Text>
        </Pressable>

        <Pressable
          onPress={tomarFoto}
          disabled={tomando}
          style={[styles.obturadorAro, { opacity: tomando ? 0.6 : 1 }]}>
          <View style={styles.obturador} />
        </Pressable>

        {/* Espaciador para centrar el obturador */}
        <View style={styles.lateral} />
      </View>
    </View>
  );
}

const ESQUINA = 34;
const GROSOR = 4;
const COLOR_MARCO = '#6366f1';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  superior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  botonCircular: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(7,11,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCircularActivo: {
    backgroundColor: '#4f46e5',
  },
  pista: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(7,11,26,0.82)',
  },
  pistaTexto: {
    flexShrink: 1,
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 19,
  },
  marco: {
    position: 'absolute',
    top: '24%',
    bottom: '26%',
    left: '9%',
    right: '9%',
  },
  esquina: {
    position: 'absolute',
    width: ESQUINA,
    height: ESQUINA,
    borderColor: COLOR_MARCO,
  },
  esquinaArribaIzq: {
    top: 0,
    left: 0,
    borderTopWidth: GROSOR,
    borderLeftWidth: GROSOR,
    borderTopLeftRadius: 14,
  },
  esquinaArribaDer: {
    top: 0,
    right: 0,
    borderTopWidth: GROSOR,
    borderRightWidth: GROSOR,
    borderTopRightRadius: 14,
  },
  esquinaAbajoIzq: {
    bottom: 0,
    left: 0,
    borderBottomWidth: GROSOR,
    borderLeftWidth: GROSOR,
    borderBottomLeftRadius: 14,
  },
  esquinaAbajoDer: {
    bottom: 0,
    right: 0,
    borderBottomWidth: GROSOR,
    borderRightWidth: GROSOR,
    borderBottomRightRadius: 14,
  },
  error: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fecaca',
    backgroundColor: 'rgba(127,29,29,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    fontSize: 13,
  },
  inferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 26,
    paddingHorizontal: 34,
    backgroundColor: '#070B1A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  lateral: {
    width: 64,
    alignItems: 'center',
    gap: 6,
  },
  lateralTexto: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  obturadorAro: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  obturador: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  atrasSolo: {
    width: 42,
    height: 42,
    marginLeft: 20,
    marginTop: 8,
    justifyContent: 'center',
  },
  sinPermiso: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  sinPermisoIcono: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22d3ee1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinPermisoTitulo: {
    fontSize: 20,
    fontWeight: '700',
  },
  sinPermisoTexto: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  botonPrincipal: {
    alignSelf: 'stretch',
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonPrincipalTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  enlace: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
  },
});
