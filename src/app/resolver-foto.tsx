import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { AnalisisPaso } from '@/components/resolver/analisis-paso';
import { CamaraPaso, type FotoCapturada } from '@/components/resolver/camara-paso';
import { RecortePaso, type FotoRecortada } from '@/components/resolver/recorte-paso';
import { RequiereSesion } from '@/components/resolver/requiere-sesion';
import { SolucionPaso } from '@/components/resolver/solucion-paso';
import { useSesion } from '@/context/sesion';
import { ApiError, resolverFoto, type ResultadoResolverFoto } from '@/lib/api';
import { borrarTemporales } from '@/lib/archivos-temporales';
import { incrementarEjerciciosResueltos } from '@/lib/user';

type Paso = 'camara' | 'recorte' | 'analisis' | 'solucion';

/**
 * "Resolver con foto": cámara → recorte → análisis → solución.
 * La foto recortada se envía a la API (POST /resolver-foto), que lee el ejercicio con un
 * modelo de visión. Si leyó mal, el estudiante corrige el texto y se recalcula sin imagen.
 */
export default function ResolverFotoScreen() {
  const { usuario, cargando } = useSesion();
  const [paso, setPaso] = useState<Paso>('camara');
  const [foto, setFoto] = useState<FotoCapturada | null>(null);
  const [recortada, setRecortada] = useState<FotoRecortada | null>(null);
  const [resultado, setResultado] = useState<ResultadoResolverFoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recalculando, setRecalculando] = useState(false);

  // Identifica la consulta vigente para ignorar respuestas de una que el usuario canceló
  const consulta = useRef(0);

  // Fotos temporales de esta sesión (original y recorte). Se borran al terminar: no se guardan
  const temporales = useRef(new Set<string>());
  useEffect(() => {
    const guardadas = temporales.current;
    return () => borrarTemporales(guardadas);
  }, []);

  function olvidarTemporales() {
    borrarTemporales(temporales.current);
    temporales.current.clear();
  }

  function mensajeDe(e: unknown): string {
    return e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.';
  }

  async function abrirGaleria() {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso necesario', 'Necesitamos tu permiso para acceder a la galería.');
        return;
      }
      const elegida = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      });
      if (!elegida.canceled && elegida.assets.length > 0) {
        const { uri, width, height } = elegida.assets[0];
        temporales.current.add(uri);
        setFoto({ uri, width, height });
        setError(null);
        setPaso('recorte');
      }
    } catch {
      Alert.alert('Galería', 'No se pudo abrir la galería.');
    }
  }

  async function analizar(imagen: FotoRecortada) {
    const id = ++consulta.current;
    // El recorte anterior (si lo hay) ya no se usa
    if (recortada) {
      borrarTemporales([recortada.uri]);
      temporales.current.delete(recortada.uri);
    }
    temporales.current.add(imagen.uri);
    setRecortada(imagen);
    setError(null);
    setPaso('analisis');
    try {
      const respuesta = await resolverFoto({ imagen: imagen.base64 });
      // Cuenta como ejercicio resuelto aunque el estudiante haya salido de la pantalla
      incrementarEjerciciosResueltos();
      if (id !== consulta.current) return;
      setResultado(respuesta);
      setPaso('solucion');
    } catch (e) {
      if (id !== consulta.current) return;
      setError(mensajeDe(e));
      setPaso('recorte');
    }
  }

  async function recalcular(expresion: string) {
    setRecalculando(true);
    setError(null);
    try {
      setResultado(await resolverFoto({ expresion }));
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setRecalculando(false);
    }
  }

  function volverARecortar() {
    consulta.current++;
    setError(null);
    setPaso('recorte');
  }

  function escanearOtro() {
    consulta.current++;
    olvidarTemporales();
    setFoto(null);
    setRecortada(null);
    setResultado(null);
    setError(null);
    setPaso('camara');
  }

  // Invitados: cada análisis tiene un costo, así que se pide cuenta antes de abrir la cámara
  if (!cargando && !usuario) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <RequiereSesion
          onIniciarSesion={() => router.push('/login')}
          onVolver={() => router.back()}
        />
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#070B1A' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {paso === 'camara' && (
        <CamaraPaso
          onCapturada={(f) => {
            temporales.current.add(f.uri);
            setFoto(f);
            setError(null);
            setPaso('recorte');
          }}
          onGaleria={abrirGaleria}
          onSalir={() => router.back()}
        />
      )}

      {paso === 'recorte' && foto && (
        <RecortePaso
          key={foto.uri}
          foto={foto}
          error={error}
          onSiguiente={analizar}
          onVolver={escanearOtro}
        />
      )}

      {paso === 'analisis' && <AnalisisPaso onCancelar={volverARecortar} />}

      {paso === 'solucion' && recortada && resultado && (
        <SolucionPaso
          imagenUri={recortada.uri}
          resultado={resultado}
          recalculando={recalculando}
          error={error}
          onEditarRecorte={volverARecortar}
          onEscanearOtro={escanearOtro}
          onRecalcular={recalcular}
        />
      )}
    </View>
  );
}
