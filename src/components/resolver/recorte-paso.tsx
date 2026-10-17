import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Action, SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { StatusBar } from 'expo-status-bar';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { borrarTemporales } from '@/lib/archivos-temporales';

import type { FotoCapturada } from './camara-paso';

export type FotoRecortada = { uri: string; base64: string };

type Props = {
  foto: FotoCapturada;
  /** Error del intento anterior (por ejemplo, falla del servicio de análisis). */
  error?: string | null;
  onSiguiente: (recortada: FotoRecortada) => void;
  onVolver: () => void;
};

type Rect = { x: number; y: number; w: number; h: number };
type Modo = 'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r' | 't' | 'b' | 'mover';

const MIN = 70;
const ANCHO_MAXIMO = 1600;

const clamp = (valor: number, min: number, max: number) => Math.min(Math.max(valor, min), max);

const rectInicial = (ancho: number, alto: number): Rect => ({
  x: ancho * 0.07,
  y: alto * 0.18,
  w: ancho * 0.86,
  h: alto * 0.55,
});

/** Aplica un arrastre (dx, dy) al rectángulo según el asa que se mueve. */
function arrastrar(inicio: Rect, modo: Modo, dx: number, dy: number, ancho: number, alto: number): Rect {
  if (modo === 'mover') {
    return {
      ...inicio,
      x: clamp(inicio.x + dx, 0, ancho - inicio.w),
      y: clamp(inicio.y + dy, 0, alto - inicio.h),
    };
  }

  let x1 = inicio.x;
  let y1 = inicio.y;
  let x2 = inicio.x + inicio.w;
  let y2 = inicio.y + inicio.h;

  if (modo === 'tl' || modo === 'bl' || modo === 'l') x1 = clamp(x1 + dx, 0, x2 - MIN);
  if (modo === 'tr' || modo === 'br' || modo === 'r') x2 = clamp(x2 + dx, x1 + MIN, ancho);
  if (modo === 'tl' || modo === 'tr' || modo === 't') y1 = clamp(y1 + dy, 0, y2 - MIN);
  if (modo === 'bl' || modo === 'br' || modo === 'b') y2 = clamp(y2 + dy, y1 + MIN, alto);

  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Recorte actual junto con el tamaño (en pantalla) de la imagen sobre la que se define. */
type EstadoCrop = { rect: Rect; w: number; h: number };

/**
 * Un PanResponder por asa. Trabajan solo con actualizaciones funcionales del estado,
 * así no necesitan leer refs ni valores de renderizado.
 */
function crearResponders(setCrop: Dispatch<SetStateAction<EstadoCrop | null>>) {
  const crear = (modo: Modo) => {
    let inicio: Rect = { x: 0, y: 0, w: 0, h: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setCrop((c) => {
          if (c) inicio = c.rect;
          return c;
        });
      },
      onPanResponderMove: (_, g) => {
        // dx/dy se leen ahora: RN reutiliza `g` y lo pone en cero al soltar, antes de que
        // React ejecute la actualización de estado (el recuadro volvería a su sitio)
        const { dx, dy } = g;
        setCrop((c) => (c ? { ...c, rect: arrastrar(inicio, modo, dx, dy, c.w, c.h) } : c));
      },
    });
  };
  const modos: Modo[] = ['tl', 'tr', 'bl', 'br', 'l', 'r', 't', 'b', 'mover'];
  return Object.fromEntries(modos.map((m) => [m, crear(m)])) as Record<
    Modo,
    ReturnType<typeof PanResponder.create>
  >;
}

/** Paso 2: el estudiante recorta un solo ejercicio (enunciado, figura y alternativas). */
export function RecortePaso({ foto, error, onSiguiente, onVolver }: Props) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;

  // `base` es la foto con la orientación ya aplicada; `imagen` suma las rotaciones
  const [base, setBase] = useState<FotoCapturada | null>(null);
  const [imagen, setImagen] = useState<FotoCapturada | null>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<EstadoCrop | null>(null);
  const [responders] = useState(() => crearResponders(setCrop));
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Normaliza la orientación EXIF para que ancho/alto coincidan con lo que se ve
  useEffect(() => {
    let activo = true;
    manipulateAsync(foto.uri, [], { compress: 1, format: SaveFormat.JPEG })
      .then((r) => {
        if (!activo) return;
        const normalizada = { uri: r.uri, width: r.width, height: r.height };
        setBase(normalizada);
        setImagen(normalizada);
      })
      .catch(() => {
        if (!activo) return;
        setBase(foto);
        setImagen(foto);
      });
    return () => {
      activo = false;
    };
  }, [foto]);

  // Borra los archivos temporales propios de este paso (la foto original la maneja el padre)
  useEffect(() => {
    return () => {
      if (base && base.uri !== foto.uri) borrarTemporales([base.uri]);
    };
  }, [base, foto.uri]);

  useEffect(() => {
    return () => {
      if (imagen && imagen !== base) borrarTemporales([imagen.uri]);
    };
  }, [imagen, base]);

  // Geometría: la imagen se muestra "contain" dentro del área medida
  const escala = imagen && area.w > 0 ? Math.min(area.w / imagen.width, area.h / imagen.height) : 0;
  const dw = imagen ? imagen.width * escala : 0;
  const dh = imagen ? imagen.height * escala : 0;
  const ox = (area.w - dw) / 2;
  const oy = (area.h - dh) / 2;

  // Cuando cambia el tamaño mostrado (primera medida o rotación) se reinicia el recorte
  if (dw > 0 && dh > 0 && (!crop || crop.w !== dw || crop.h !== dh)) {
    setCrop({ rect: rectInicial(dw, dh), w: dw, h: dh });
  }
  const rect = crop?.rect ?? null;

  function alMedir(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: width, h: height });
  }

  async function rotar() {
    if (!imagen || procesando) return;
    setProcesando(true);
    setErrorLocal(null);
    try {
      const r = await manipulateAsync(imagen.uri, [{ rotate: 90 }], {
        compress: 1,
        format: SaveFormat.JPEG,
      });
      setImagen({ uri: r.uri, width: r.width, height: r.height });
    } catch {
      setErrorLocal('No se pudo rotar la imagen.');
    } finally {
      setProcesando(false);
    }
  }

  function restablecer() {
    if (!base || area.w === 0) return;
    setErrorLocal(null);
    setImagen(base);
    const s = Math.min(area.w / base.width, area.h / base.height);
    const w = base.width * s;
    const h = base.height * s;
    setCrop({ rect: rectInicial(w, h), w, h });
  }

  /** Centra el recorte actual dentro de la foto sin cambiar su tamaño. */
  function ajustar() {
    setCrop((c) =>
      c
        ? {
            ...c,
            rect: {
              ...c.rect,
              x: (c.w - c.rect.w) / 2,
              y: (c.h - c.rect.h) / 2,
            },
          }
        : c
    );
  }

  async function siguiente() {
    if (!imagen || !rect || escala === 0 || procesando) return;
    setProcesando(true);
    setErrorLocal(null);
    try {
      const k = 1 / escala;
      const originX = Math.round(clamp(rect.x * k, 0, imagen.width - 1));
      const originY = Math.round(clamp(rect.y * k, 0, imagen.height - 1));
      const width = Math.round(clamp(rect.w * k, 1, imagen.width - originX));
      const height = Math.round(clamp(rect.h * k, 1, imagen.height - originY));

      const acciones: Action[] = [{ crop: { originX, originY, width, height } }];
      if (width > ANCHO_MAXIMO) acciones.push({ resize: { width: ANCHO_MAXIMO } });

      const r = await manipulateAsync(imagen.uri, acciones, {
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!r.base64) throw new Error('Sin datos de imagen');
      onSiguiente({ uri: r.uri, base64: r.base64 });
    } catch {
      setErrorLocal('No se pudo preparar el recorte. Inténtalo de nuevo.');
      setProcesando(false);
    }
  }

  const mensajeError = errorLocal ?? error ?? null;

  /** Asa arrastrable: zona táctil de 44 px con una forma visible en el centro. */
  function asa(modo: Modo, cx: number, cy: number, forma: 'punto' | 'vertical' | 'horizontal') {
    return (
      <View
        key={modo}
        {...responders[modo].panHandlers}
        style={[styles.zonaAsa, { left: cx - 22, top: cy - 22 }]}>
        <View
          style={
            forma === 'punto'
              ? styles.asaPunto
              : forma === 'vertical'
                ? styles.asaVertical
                : styles.asaHorizontal
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#070B1A' }]}>
      <StatusBar style="light" />

      {/* Encabezado */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onVolver} hitSlop={12} style={styles.lado}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.titulo, { color: colors.text }]}>Selecciona el ejercicio</Text>
        <Pressable onPress={siguiente} hitSlop={12} style={[styles.lado, { alignItems: 'flex-end' }]}>
          <Text style={styles.siguienteTexto}>Siguiente</Text>
        </Pressable>
      </View>

      {/* Instrucción */}
      <View style={[styles.pista, { borderColor: colors.border }]}>
        <View style={styles.pistaIcono}>
          <Ionicons name="crop" size={20} color="#a5b4fc" />
        </View>
        <Text style={[styles.pistaTexto, { color: colors.text }]}>
          Ajusta el recorte para incluir todo el ejercicio (enunciado, figura y alternativas).
        </Text>
      </View>

      {mensajeError && <Text style={styles.error}>{mensajeError}</Text>}

      {/* Imagen con recorte */}
      <View style={styles.area} onLayout={alMedir}>
        {!imagen ? (
          <ActivityIndicator color="#a5b4fc" style={StyleSheet.absoluteFill} />
        ) : (
          dw > 0 &&
          rect && (
            <View style={{ position: 'absolute', left: ox, top: oy, width: dw, height: dh }}>
              <Image source={{ uri: imagen.uri }} style={{ width: dw, height: dh }} contentFit="fill" />

              {/* Zona fuera del recorte, oscurecida */}
              <View style={[styles.sombra, { left: 0, top: 0, width: dw, height: rect.y }]} />
              <View
                style={[
                  styles.sombra,
                  { left: 0, top: rect.y + rect.h, width: dw, height: dh - rect.y - rect.h },
                ]}
              />
              <View style={[styles.sombra, { left: 0, top: rect.y, width: rect.x, height: rect.h }]} />
              <View
                style={[
                  styles.sombra,
                  { left: rect.x + rect.w, top: rect.y, width: dw - rect.x - rect.w, height: rect.h },
                ]}
              />

              {/* Borde y zona para mover el recorte completo */}
              <View
                {...responders.mover.panHandlers}
                style={[
                  styles.borde,
                  { left: rect.x, top: rect.y, width: rect.w, height: rect.h },
                ]}
              />

              {asa('t', rect.x + rect.w / 2, rect.y, 'horizontal')}
              {asa('b', rect.x + rect.w / 2, rect.y + rect.h, 'horizontal')}
              {asa('l', rect.x, rect.y + rect.h / 2, 'vertical')}
              {asa('r', rect.x + rect.w, rect.y + rect.h / 2, 'vertical')}
              {asa('tl', rect.x, rect.y, 'punto')}
              {asa('tr', rect.x + rect.w, rect.y, 'punto')}
              {asa('bl', rect.x, rect.y + rect.h, 'punto')}
              {asa('br', rect.x + rect.w, rect.y + rect.h, 'punto')}
            </View>
          )
        )}
      </View>

      {/* Herramientas */}
      <View style={styles.herramientas}>
        <Pressable onPress={ajustar} style={styles.herramienta} hitSlop={8}>
          <Ionicons name="scan-outline" size={26} color="#6366f1" />
          <Text style={[styles.herramientaTexto, { color: colors.text }]}>Ajustar</Text>
        </Pressable>
        <Pressable onPress={rotar} style={styles.herramienta} hitSlop={8}>
          <Ionicons name="refresh-outline" size={26} color={colors.text} />
          <Text style={[styles.herramientaTexto, { color: colors.text }]}>Rotar</Text>
        </Pressable>
        <Pressable onPress={restablecer} style={styles.herramienta} hitSlop={8}>
          <Ionicons name="arrow-undo-outline" size={26} color={colors.text} />
          <Text style={[styles.herramientaTexto, { color: colors.text }]}>Restablecer</Text>
        </Pressable>
      </View>

      <View style={[styles.pie, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={siguiente}
          disabled={procesando || !rect}
          style={({ pressed }) => [
            styles.boton,
            { opacity: procesando || !rect ? 0.6 : pressed ? 0.92 : 1 },
          ]}>
          {procesando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.botonTexto}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  lado: {
    width: 84,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
  },
  siguienteTexto: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '600',
  },
  pista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(21,29,48,0.85)',
  },
  pistaIcono: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4f46e540',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pistaTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginHorizontal: 20,
    marginTop: 8,
    color: '#fecaca',
    backgroundColor: 'rgba(127,29,29,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  area: {
    flex: 1,
    marginVertical: 12,
  },
  sombra: {
    position: 'absolute',
    backgroundColor: 'rgba(7,11,26,0.62)',
  },
  borde: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  zonaAsa: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asaPunto: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4f46e5',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  asaVertical: {
    width: 7,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  asaHorizontal: {
    width: 38,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  herramientas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  herramienta: {
    alignItems: 'center',
    gap: 6,
    minWidth: 76,
  },
  herramientaTexto: {
    fontSize: 13,
  },
  pie: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4f46e5',
    borderRadius: 18,
    paddingVertical: 16,
  },
  botonTexto: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
