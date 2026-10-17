import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Segmentado } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonPildora,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import {
  DetalleCalculo,
  TarjetaResultado,
  TONOS,
  type Tono,
} from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';
import { puntajeNEM, redondearNEM, type GrupoNEM } from '@/lib/tablas-nem';

const CALC_ID = 'nem';
const colors = Colors.dark;

// Medidas compartidas para alinear filas y encabezados
const ANCHO_ETIQUETA_NOTA = 76;
const ALTO_INPUT = 50;
const GAP = 10;

const CURSOS = ['1° Medio', '2° Medio', '3° Medio', '4° Medio'];

const GRUPOS: { id: GrupoNEM; texto: string; descripcion: string }[] = [
  { id: 'A', texto: 'A', descripcion: 'Científico-Humanista diurno' },
  { id: 'B', texto: 'B', descripcion: 'C-H adultos / vespertino' },
  { id: 'C', texto: 'C', descripcion: 'Técnico Profesional' },
];

type ClavePrueba = 'nem' | 'ranking' | 'cl' | 'm1' | 'm2' | 'hist' | 'cien';

const PRUEBAS: { clave: ClavePrueba; nombre: string }[] = [
  { clave: 'nem', nombre: 'NEM' },
  { clave: 'ranking', nombre: 'Ranking' },
  { clave: 'cl', nombre: 'C. Lectora' },
  { clave: 'm1', nombre: 'Matemática M1' },
  { clave: 'm2', nombre: 'Matemática M2' },
  { clave: 'hist', nombre: 'Historia' },
  { clave: 'cien', nombre: 'Ciencias' },
];

type FilaPrueba = { puntaje: string; pond: string };
type Pruebas = Record<ClavePrueba, FilaPrueba>;

function pruebasVacias(): Pruebas {
  return {
    nem: { puntaje: '', pond: '' },
    ranking: { puntaje: '', pond: '' },
    cl: { puntaje: '', pond: '' },
    m1: { puntaje: '', pond: '' },
    m2: { puntaje: '', pond: '' },
    hist: { puntaje: '', pond: '' },
    cien: { puntaje: '', pond: '' },
  };
}

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

/** Nota de enseñanza media válida: 1.0–7.0 con hasta 2 decimales. */
function notaValida(txt: string): boolean {
  const limpio = txt.trim().replace(',', '.');
  const n = parseFloat(limpio);
  const decimales = limpio.split('.')[1] ?? '';
  return Number.isFinite(n) && n >= 1 && n <= 7 && decimales.length <= 2;
}

function fmt(n: number, decimales = 2): string {
  return String(parseFloat(n.toFixed(decimales)));
}

export default function NemScreen() {
  // Paso 1
  const [notas, setNotas] = useState<string[]>(['', '', '', '']);
  const [grupo, setGrupo] = useState<GrupoNEM>('A');
  const [nemCalculado, setNemCalculado] = useState(false);

  // Paso 2
  const [pruebas, setPruebas] = useState<Pruebas>(pruebasVacias);
  const [pondCalculado, setPondCalculado] = useState(false);

  const [guardado, setGuardado] = useState(false);

  // Si se abrió desde "Cálculos guardados": llena ambos pasos y muestra los resultados
  useRestaurarEntrada<{ notas: string[]; grupo: GrupoNEM; pruebas: Pruebas; conPonderado: boolean }>((datos) => {
    setNotas(datos.notas);
    setGrupo(datos.grupo);
    setPruebas(datos.pruebas);
    setNemCalculado(true);
    setPondCalculado(datos.conPonderado);
  });

  const scrollRef = useRef<ScrollView>(null);
  const resultadoNemY = useRef(0);
  const paso2Y = useRef(0);
  const resultadoPondY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [notas, grupo, pruebas]);

  const scrollA = (y: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(y - Spacing.three, 0), animated: true });
    }, 80);
  };

  // ── Paso 1: NEM ──────────────────────────────────────────

  const nem = useMemo(() => {
    const completas = notas.every((n) => n.trim() !== '');
    if (!completas || !notas.every(notaValida)) return null;

    const valores = notas.map(aNumero);
    const suma = valores.reduce((a, v) => a + v, 0);
    const promedio = suma / 4;
    const redondeado = redondearNEM(promedio);
    return { valores, suma, promedio, redondeado, puntaje: puntajeNEM(redondeado, grupo) };
  }, [notas, grupo]);

  const actualizarNota = (i: number, valor: string) => {
    setNotas((prev) => prev.map((n, idx) => (idx === i ? valor : n)));
  };

  const calcularNem = () => {
    setNemCalculado(true);
    scrollA(resultadoNemY.current);
  };

  const usarEnPonderado = () => {
    if (!nem || nem.puntaje === null) return;
    const p = String(nem.puntaje);
    setPruebas((prev) => ({
      ...prev,
      nem: { ...prev.nem, puntaje: p },
      // El ranking nunca es menor que el puntaje NEM: sirve de valor inicial
      ranking: { ...prev.ranking, puntaje: prev.ranking.puntaje || p },
    }));
    scrollA(paso2Y.current);
  };

  // ── Paso 2: Ponderado PAES ───────────────────────────────

  const ponderado = useMemo(() => {
    let total = 0;
    let sumaPond = 0;
    const detalle: { clave: ClavePrueba; nombre: string; puntaje: number; pond: number; aporte: number }[] = [];
    let hayError = false;

    for (const { clave, nombre } of PRUEBAS) {
      const pt = aNumero(pruebas[clave].puntaje);
      const pd = aNumero(pruebas[clave].pond);
      if (Number.isFinite(pd) && pd > 0) {
        sumaPond += pd;
        if (!Number.isFinite(pt) || pt < 100 || pt > 1000) {
          hayError = true;
          continue;
        }
        const aporte = (pt * pd) / 100;
        total += aporte;
        detalle.push({ clave, nombre, puntaje: pt, pond: pd, aporte });
      }
    }

    if (detalle.length === 0 || hayError) return { total: null, sumaPond, detalle, hayError };
    return { total, sumaPond, detalle, hayError };
  }, [pruebas]);

  const actualizarPrueba = (clave: ClavePrueba, campo: keyof FilaPrueba, valor: string) => {
    setPruebas((prev) => ({ ...prev, [clave]: { ...prev[clave], [campo]: valor } }));
  };

  const calcularPonderado = () => {
    setPondCalculado(true);
    scrollA(resultadoPondY.current);
  };

  const sumaOk = Math.abs(ponderado.sumaPond - 100) < 0.01;
  const tonoSuma: Tono = ponderado.sumaPond === 0 ? 'info' : sumaOk ? 'ok' : ponderado.sumaPond < 100 ? 'warning' : 'error';

  // ── Acciones generales ───────────────────────────────────

  const cargarEjemplo = () => {
    setNotas(['6.2', '5.8', '6.5', '6.1']);
    setGrupo('A');
    setPruebas({
      nem: { puntaje: '850', pond: '10' },
      ranking: { puntaje: '870', pond: '20' },
      cl: { puntaje: '720', pond: '25' },
      m1: { puntaje: '780', pond: '35' },
      m2: { puntaje: '', pond: '' },
      hist: { puntaje: '', pond: '' },
      cien: { puntaje: '650', pond: '10' },
    });
    setNemCalculado(false);
    setPondCalculado(false);
  };

  const limpiar = () => {
    setNotas(['', '', '', '']);
    setPruebas(pruebasVacias());
    setNemCalculado(false);
    setPondCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const mostrarNem = nemCalculado && nem !== null;
  const mostrarPond = pondCalculado && ponderado.total !== null;

  const guardar = async () => {
    // Guarda el resultado más completo disponible
    if (mostrarPond && ponderado.total !== null) {
      await guardarEnHistorial({
        calculadoraId: CALC_ID,
        resultado: fmt(ponderado.total),
        resumen: `Puntaje ponderado · ${ponderado.detalle.length} factores · ${fmt(ponderado.sumaPond)}%`,
        datos: { notas, grupo, pruebas, conPonderado: true },
      });
    } else if (mostrarNem && nem && nem.puntaje !== null) {
      await guardarEnHistorial({
        calculadoraId: CALC_ID,
        resultado: String(nem.puntaje),
        resumen: `Puntaje NEM · promedio ${nem.redondeado.toFixed(2)} · grupo ${grupo}`,
        datos: { notas, grupo, pruebas, conPonderado: false },
      });
    } else {
      return;
    }
    setGuardado(true);
  };

  const puedeGuardar = mostrarPond || (mostrarNem && nem?.puntaje !== null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderCalculadora calculadoraId={CALC_ID} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, ContenidoCentrado]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <AvisoInfo>
            Paso 1: calcula tu puntaje NEM con tus notas de enseñanza media. Paso 2: combínalo con
            tus puntajes PAES según las ponderaciones de la carrera.
          </AvisoInfo>

          {/* ── PASO 1 ── */}
          <Seccion
            titulo="Paso 1 · Tu NEM"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.encabezados}>
              <Text style={[styles.encabezado, { color: colors.textMuted }]}>
                PROMEDIO ANUAL (1.0 – 7.0)
              </Text>
            </View>

            {CURSOS.map((curso, i) => {
              const error = notas[i].trim() !== '' && !notaValida(notas[i]);
              return (
                <View key={curso} style={styles.filaNota}>
                  <View style={styles.etiquetaCurso}>
                    <Text style={styles.etiquetaCursoTexto}>{curso}</Text>
                  </View>
                  <TextInput
                    value={notas[i]}
                    onChangeText={(t) => actualizarNota(i, t)}
                    placeholder="Ej: 6.2"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    style={[
                      styles.input,
                      styles.inputNota,
                      { color: colors.text, borderColor: error ? colors.danger : colors.border },
                    ]}
                  />
                </View>
              );
            })}

            {notas.some((n) => n.trim() !== '' && !notaValida(n)) && (
              <Text style={[styles.errorTexto, { color: colors.danger }]}>
                Las notas deben estar entre 1.0 y 7.0, con máximo 2 decimales.
              </Text>
            )}

            <Segmentado
              label="Tipo de establecimiento"
              opciones={GRUPOS.map((g) => ({ id: g.id, texto: `Grupo ${g.texto}` }))}
              valor={grupo}
              onCambiar={setGrupo}
            />
            <Text style={[styles.ayuda, { color: colors.textMuted }]}>
              {GRUPOS.find((g) => g.id === grupo)?.descripcion}
            </Text>
          </Seccion>

          <BotonPrimario
            label="Calcular NEM"
            icono="school-outline"
            onPress={calcularNem}
            deshabilitado={nem === null}
          />

          {mostrarNem && nem && (
            <TarjetaResultado
              titulo="Tu puntaje NEM"
              valor={nem.puntaje === null ? 'Fuera de tabla' : String(nem.puntaje)}
              tono={nem.puntaje === null ? 'warning' : 'ok'}
              badge={nem.puntaje === null ? 'Bajo 4.0' : `Grupo ${grupo}`}
              descripcion={
                nem.puntaje === null
                  ? `Tu NEM es ${nem.redondeado.toFixed(2)}. La tabla oficial parte en 4.00.`
                  : `NEM ${nem.redondeado.toFixed(2)} en escala PAES (100 – 1000)`
              }
              onLayout={(e) => {
                resultadoNemY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  {
                    key: 'suma',
                    label: 'Suma de los 4 promedios',
                    operacion: nem.valores.map((v) => fmt(v)).join(' + '),
                    valor: fmt(nem.suma),
                  },
                  {
                    key: 'prom',
                    label: 'Promedio NEM',
                    operacion: `${fmt(nem.suma)} ÷ 4 = ${fmt(nem.promedio, 4)}`,
                    valor: nem.redondeado.toFixed(2),
                  },
                  {
                    key: 'tabla',
                    label: `Tabla oficial DEMRE · Grupo ${grupo}`,
                    operacion: `NEM ${nem.redondeado.toFixed(2)} →`,
                    valor: nem.puntaje === null ? '—' : String(nem.puntaje),
                  },
                ]}
                total={{ label: 'Puntaje NEM', valor: nem.puntaje === null ? '—' : String(nem.puntaje) }}
                tonoTotal={nem.puntaje === null ? 'warning' : 'ok'}
              />

              {nem.puntaje !== null && (
                <Pressable
                  onPress={usarEnPonderado}
                  style={({ pressed }) => [styles.usarBoton, { opacity: pressed ? 0.8 : 1 }]}>
                  <Text style={styles.usarTexto}>Usar en el puntaje ponderado</Text>
                  <Ionicons name="arrow-down" size={18} color={Acento.claro} />
                </Pressable>
              )}
            </TarjetaResultado>
          )}

          {/* ── PASO 2 ── */}
          <View
            onLayout={(e) => {
              paso2Y.current = e.nativeEvent.layout.y;
            }}>
            <Seccion titulo="Paso 2 · Puntaje ponderado">
              <View style={styles.encabezadosPrueba}>
                <Text style={[styles.encabezado, styles.colNombre, { color: colors.textMuted, textAlign: 'left' }]}>
                  PRUEBA
                </Text>
                <Text style={[styles.encabezado, styles.colPuntaje, { color: colors.textMuted }]}>
                  PUNTAJE
                </Text>
                <Text style={[styles.encabezado, styles.colPond, { color: colors.textMuted }]}>
                  PESO
                </Text>
              </View>

              {PRUEBAS.map(({ clave, nombre }) => {
                const pt = pruebas[clave].puntaje;
                const errorPt =
                  pt.trim() !== '' && (!(aNumero(pt) >= 100) || aNumero(pt) > 1000);
                return (
                  <View key={clave} style={styles.filaPrueba}>
                    <Text style={[styles.colNombre, styles.nombrePrueba, { color: colors.text }]} numberOfLines={2}>
                      {nombre}
                    </Text>
                    <TextInput
                      value={pt}
                      onChangeText={(t) => actualizarPrueba(clave, 'puntaje', t)}
                      placeholder="—"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={[
                        styles.input,
                        styles.colPuntaje,
                        styles.inputCentro,
                        { color: colors.text, borderColor: errorPt ? colors.danger : colors.border },
                      ]}
                    />
                    <View style={[styles.input, styles.colPond, styles.pondWrap, { borderColor: colors.border }]}>
                      <TextInput
                        value={pruebas[clave].pond}
                        onChangeText={(t) => actualizarPrueba(clave, 'pond', t)}
                        placeholder="—"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        maxLength={4}
                        style={[styles.inputPond, { color: colors.text }]}
                      />
                      <Text style={[styles.sufijo, { color: colors.textMuted }]}>%</Text>
                    </View>
                  </View>
                );
              })}

              {ponderado.hayError && (
                <Text style={[styles.errorTexto, { color: colors.danger }]}>
                  Cada prueba con peso necesita un puntaje entre 100 y 1000.
                </Text>
              )}

              <View
                style={[
                  styles.suma,
                  { backgroundColor: TONOS[tonoSuma].bg, borderColor: TONOS[tonoSuma].borde },
                ]}>
                <Text style={[styles.sumaLabel, { color: colors.textSecondary }]}>
                  Suma de ponderaciones
                </Text>
                <Text style={[styles.sumaValor, { color: TONOS[tonoSuma].texto }]}>
                  {fmt(ponderado.sumaPond)}%
                </Text>
              </View>
            </Seccion>
          </View>

          <BotonPrimario
            label="Calcular puntaje ponderado"
            icono="calculator-outline"
            onPress={calcularPonderado}
            deshabilitado={ponderado.total === null}
          />

          {mostrarPond && ponderado.total !== null && (
            <TarjetaResultado
              titulo="Tu puntaje ponderado"
              valor={fmt(ponderado.total)}
              tono={sumaOk ? 'ok' : 'warning'}
              badge={sumaOk ? 'Pesos 100%' : `Pesos ${fmt(ponderado.sumaPond)}%`}
              descripcion={
                sumaOk
                  ? 'Compáralo con el puntaje de corte de la carrera que te interesa.'
                  : 'Las ponderaciones no suman 100%: revisa los pesos de la carrera.'
              }
              onLayout={(e) => {
                resultadoPondY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={ponderado.detalle.map((d) => ({
                  key: d.clave,
                  label: d.nombre,
                  operacion: `${fmt(d.puntaje)} × ${fmt(d.pond)}%`,
                  valor: fmt(d.aporte),
                }))}
                total={{ label: 'Puntaje ponderado', valor: fmt(ponderado.total) }}
                tonoTotal={sumaOk ? 'ok' : 'warning'}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo funciona el NEM y el ponderado?"
            texto="El NEM es el promedio de tus notas de 1° a 4° medio. Se convierte a puntaje (100 a 1000) con la tabla oficial del DEMRE según tu tipo de establecimiento. Luego cada carrera pondera NEM, Ranking y pruebas PAES con sus propios porcentajes."
            formula="Ponderado = Σ (Puntaje × Peso%)"
            tip="El Ranking nunca es menor que tu puntaje NEM: si no lo conoces, usar el mismo valor te da una estimación conservadora."
          />
        </ScrollView>

        <BarraAcciones
          onLimpiar={limpiar}
          onGuardar={guardar}
          guardarDeshabilitado={!puedeGuardar}
          guardado={guardado}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  encabezados: {
    paddingLeft: ANCHO_ETIQUETA_NOTA + GAP,
    marginBottom: -6,
  },
  encabezado: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  filaNota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  etiquetaCurso: {
    width: ANCHO_ETIQUETA_NOTA,
    height: ALTO_INPUT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiquetaCursoTexto: {
    color: Acento.claro,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    height: ALTO_INPUT,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  inputNota: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  ayuda: {
    fontSize: 12,
    marginTop: -8,
  },
  usarBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
  },
  usarTexto: {
    color: Acento.claro,
    fontSize: 14,
    fontWeight: '700',
  },
  encabezadosPrueba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    marginBottom: -6,
  },
  colNombre: {
    flex: 1,
  },
  colPuntaje: {
    width: 84,
  },
  colPond: {
    width: 78,
  },
  filaPrueba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  nombrePrueba: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputCentro: {
    paddingHorizontal: 6,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  pondWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  inputPond: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 6,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  sufijo: {
    fontSize: 14,
    fontWeight: '600',
  },
  suma: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sumaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sumaValor: {
    fontSize: 22,
    fontWeight: '900',
  },
});
