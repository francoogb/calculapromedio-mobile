import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import type { ResultadoResolverFoto } from '@/lib/api';

import { IndicadorPasos } from './indicador-pasos';

/**
 * Muestra al pie el modelo y el costo de cada consulta. Es información interna para probar
 * modelos: se deja en false para los usuarios y se activa solo mientras se evalúan.
 */
const MOSTRAR_DATOS_DE_PRUEBA = false;

type Pestana = 'pasos' | 'respuesta' | 'conceptos';

const PESTANAS: { clave: Pestana; texto: string; icono: keyof typeof Ionicons.glyphMap }[] = [
  { clave: 'pasos', texto: 'Solución paso a paso', icono: 'list-outline' },
  { clave: 'respuesta', texto: 'Respuesta', icono: 'checkmark-circle-outline' },
  { clave: 'conceptos', texto: 'Conceptos', icono: 'book-outline' },
];

type Props = {
  imagenUri: string;
  resultado: ResultadoResolverFoto;
  /** true mientras se recalcula con una expresión corregida. */
  recalculando: boolean;
  /** Mensaje de error de la última acción (por ejemplo, un recálculo fallido). */
  error?: string | null;
  onEditarRecorte: () => void;
  onEscanearOtro: () => void;
  onRecalcular: (expresion: string) => void;
};

/** Texto de la respuesta: "A) 5" si hay alternativas, o solo el resultado. */
function textoRespuesta(r: ResultadoResolverFoto): string {
  if (r.alternativa) return `${r.alternativa}) ${r.resultado ?? ''}`.trim();
  return r.resultado ?? 'Sin resultado';
}

/** Paso 4: solución paso a paso, respuesta y conceptos, con opción de corregir la lectura. */
export function SolucionPaso({
  imagenUri,
  resultado,
  recalculando,
  error,
  onEditarRecorte,
  onEscanearOtro,
  onRecalcular,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = Colors.dark;
  const [pestana, setPestana] = useState<Pestana>('pasos');
  const [corrigiendo, setCorrigiendo] = useState(false);
  const [expresion, setExpresion] = useState(resultado.expresion ?? '');
  const [resultadoPrevio, setResultadoPrevio] = useState(resultado);

  // Cada solución nueva reinicia el texto editable con lo que el modelo leyó
  if (resultadoPrevio !== resultado) {
    setResultadoPrevio(resultado);
    setExpresion(resultado.expresion ?? '');
  }

  const editada =
    expresion.trim().length > 0 && expresion.trim() !== (resultado.expresion ?? '').trim();

  const tarjetaRespuesta = (
    <View style={styles.respuesta}>
      <View style={styles.respuestaCheck}>
        <Ionicons name="checkmark" size={22} color="#064e3b" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.respuestaEtiqueta}>Respuesta</Text>
        <Text style={styles.respuestaValor}>{textoRespuesta(resultado)}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#070B1A' }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onEditarRecorte} hitSlop={12} style={styles.atras}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.titulo, { color: colors.text }]}>Solución del ejercicio</Text>
        <View style={styles.atras} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <IndicadorPasos actual={3} />

        {/* Ejercicio detectado */}
        <View style={[styles.tarjeta, { borderColor: colors.border }]}>
          <View style={styles.tarjetaCabecera}>
            <Ionicons name="scan-outline" size={20} color="#818cf8" />
            <Text style={[styles.tarjetaTitulo, { color: colors.text }]}>Ejercicio detectado</Text>
            <Pressable
              onPress={onEditarRecorte}
              style={[styles.botonChico, { borderColor: colors.border }]}>
              <Ionicons name="crop-outline" size={16} color={colors.text} />
              <Text style={[styles.botonChicoTexto, { color: colors.text }]}>Editar recorte</Text>
            </Pressable>
          </View>
          <Image source={{ uri: imagenUri }} style={styles.imagen} contentFit="contain" />

          <Pressable onPress={() => setCorrigiendo((v) => !v)} hitSlop={8} style={styles.corregirFila}>
            <Ionicons name="create-outline" size={16} color="#a78bfa" />
            <Text style={styles.corregirTexto}>
              {corrigiendo ? 'Ocultar corrección' : '¿Leyó mal el ejercicio? Corregir'}
            </Text>
          </Pressable>

          {corrigiendo && (
            <View style={styles.corregir}>
              <TextInput
                value={expresion}
                onChangeText={setExpresion}
                placeholder="Escribe el ejercicio"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                multiline
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
              <Text style={[styles.pista, { color: colors.textMuted }]}>
                Corrige el texto que leímos y vuelve a calcular. No necesita una foto nueva.
              </Text>
              {editada && (
                <Pressable
                  disabled={recalculando}
                  onPress={() => onRecalcular(expresion.trim())}
                  style={({ pressed }) => [
                    styles.botonPrimario,
                    { opacity: recalculando || pressed ? 0.85 : 1 },
                  ]}>
                  {recalculando ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={18} color="#ffffff" />
                      <Text style={styles.botonPrimarioTexto}>Recalcular con mi corrección</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Pestañas */}
        <View style={[styles.pestanas, { borderColor: colors.border }]}>
          {PESTANAS.map((p) => {
            const activa = p.clave === pestana;
            return (
              <Pressable
                key={p.clave}
                onPress={() => setPestana(p.clave)}
                style={[styles.pestana, activa && styles.pestanaActiva]}>
                <Ionicons name={p.icono} size={17} color={activa ? '#ffffff' : colors.textMuted} />
                <Text
                  numberOfLines={1}
                  style={[styles.pestanaTexto, { color: activa ? '#ffffff' : colors.textMuted }]}>
                  {p.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Contenido de la pestaña */}
        {pestana === 'pasos' && (
          <View style={[styles.tarjeta, { borderColor: colors.border }]}>
            {resultado.pasos.length === 0 ? (
              <Text style={[styles.vacio, { color: colors.textMuted }]}>
                El modelo no entregó pasos para este ejercicio.
              </Text>
            ) : (
              resultado.pasos.map((paso, i) => (
                <View key={i} style={styles.paso}>
                  <View style={styles.pasoColumna}>
                    <View style={styles.pasoNumero}>
                      <Text style={styles.pasoNumeroTexto}>{i + 1}</Text>
                    </View>
                    {i < resultado.pasos.length - 1 && (
                      <View style={[styles.pasoLinea, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                  <Text style={[styles.pasoTexto, { color: colors.text }]}>{paso}</Text>
                </View>
              ))
            )}
            {tarjetaRespuesta}
          </View>
        )}

        {pestana === 'respuesta' && (
          <View style={{ gap: 14 }}>
            {tarjetaRespuesta}
            {resultado.expresion && (
              <View style={[styles.tarjeta, { borderColor: colors.border }]}>
                <Text style={[styles.etiqueta, { color: colors.textMuted }]}>EJERCICIO LEÍDO</Text>
                <Text style={[styles.leido, { color: colors.text }]}>{resultado.expresion}</Text>
              </View>
            )}
          </View>
        )}

        {pestana === 'conceptos' && (
          <View style={[styles.tarjeta, { borderColor: colors.border }]}>
            {resultado.conceptos.length === 0 ? (
              <Text style={[styles.vacio, { color: colors.textMuted }]}>
                No hay conceptos para este ejercicio.
              </Text>
            ) : (
              resultado.conceptos.map((concepto, i) => {
                const corte = concepto.indexOf(':');
                const nombre = corte > 0 ? concepto.slice(0, corte) : null;
                const detalle = corte > 0 ? concepto.slice(corte + 1).trim() : concepto;
                return (
                  <View key={i} style={styles.concepto}>
                    <Ionicons name="book-outline" size={18} color="#a78bfa" />
                    <View style={{ flex: 1 }}>
                      {nombre && (
                        <Text style={[styles.conceptoNombre, { color: colors.text }]}>{nombre}</Text>
                      )}
                      <Text style={[styles.conceptoDetalle, { color: colors.textSecondary }]}>
                        {detalle}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <Pressable
          onPress={onEscanearOtro}
          style={({ pressed }) => [
            styles.botonSecundario,
            { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Ionicons name="scan-outline" size={20} color={colors.text} />
          <Text style={[styles.botonSecundarioTexto, { color: colors.text }]}>Escanear otro</Text>
        </Pressable>

        {resultado.restantes != null && (
          <Text style={[styles.prueba, { color: colors.textMuted }]}>
            {resultado.restantes === 1
              ? 'Te queda 1 foto hoy'
              : `Te quedan ${resultado.restantes} fotos hoy`}
          </Text>
        )}

        {MOSTRAR_DATOS_DE_PRUEBA && (
          <Text style={[styles.prueba, { color: colors.textMuted }]}>
            Prueba · {resultado.modelo}
            {resultado.costo_clp != null
              ? ` · costo ≈ $${resultado.costo_clp.toFixed(2).replace('.', ',')} CLP`
              : ''}
          </Text>
        )}
      </ScrollView>
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
  atras: {
    width: 42,
    height: 42,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
  },
  contenido: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tarjeta: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(21,29,48,0.7)',
    padding: 14,
    gap: 12,
  },
  tarjetaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tarjetaTitulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  botonChico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  botonChicoTexto: {
    fontSize: 12,
  },
  imagen: {
    height: 190,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  corregirFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corregirTexto: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  corregir: {
    gap: 10,
  },
  input: {
    fontSize: 15,
    lineHeight: 21,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  pista: {
    fontSize: 12,
    lineHeight: 17,
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 13,
  },
  botonPrimarioTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: '#fecaca',
    backgroundColor: 'rgba(127,29,29,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  pestanas: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(21,29,48,0.7)',
  },
  pestana: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  pestanaActiva: {
    backgroundColor: '#4f46e5',
  },
  pestanaTexto: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  paso: {
    flexDirection: 'row',
    gap: 14,
  },
  pasoColumna: {
    alignItems: 'center',
  },
  pasoNumero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumeroTexto: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pasoLinea: {
    flex: 1,
    width: 2,
    marginTop: 4,
    marginBottom: -8,
    minHeight: 12,
  },
  pasoTexto: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: 12,
  },
  respuesta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#34d399',
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  respuestaCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  respuestaEtiqueta: {
    color: '#a7f3d0',
    fontSize: 14,
  },
  respuestaValor: {
    color: '#6ee7b7',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  leido: {
    fontSize: 15,
    lineHeight: 22,
  },
  concepto: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  conceptoNombre: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  conceptoDetalle: {
    fontSize: 14,
    lineHeight: 20,
  },
  vacio: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
  },
  botonSecundarioTexto: {
    fontSize: 16,
    fontWeight: '600',
  },
  prueba: {
    fontSize: 12,
    textAlign: 'center',
  },
});
