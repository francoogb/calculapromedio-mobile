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

import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonAgregar,
  BotonPildora,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type FilaDetalle } from '@/components/calculadora/resultado';
import { Acento, Colors, Spacing } from '@/constants/theme';
import { factoresATexto, factoresPrimos, fmtNumero, leerEntero, mcd, mcm } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'mcm-mcd';
const colors = Colors.dark;

const ANCHO_NUMERO = 44;
const ANCHO_ACCION = 36;
const ALTO_INPUT = 50;
const GAP = 10;
const MAXIMO = 1_000_000;

type Fila = { id: string; valor: string };

function nuevaFila(valor = ''): Fila {
  return { id: Math.random().toString(36).slice(2, 9), valor };
}

export default function McmMcdScreen() {
  const [filas, setFilas] = useState<Fila[]>(() => [nuevaFila(), nuevaFila()]);
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [filas]);

  const esValido = (txt: string) => {
    const n = leerEntero(txt);
    return n >= 1 && n <= MAXIMO;
  };

  const calculo = useMemo(() => {
    const numeros = filas.filter((f) => esValido(f.valor)).map((f) => leerEntero(f.valor));
    if (numeros.length < 2) return null;

    const resultadoMcm = numeros.reduce(mcm);
    const resultadoMcd = numeros.reduce(mcd);

    // Factores de cada número y combinación para MCM (mayor exponente) y MCD (menor exponente, solo comunes)
    const factorizaciones = numeros.map((n) => ({ n, f: factoresPrimos(n) }));
    const factoresMcm = new Map<number, number>();
    for (const { f } of factorizaciones) {
      for (const [p, e] of f) factoresMcm.set(p, Math.max(factoresMcm.get(p) ?? 0, e));
    }
    const factoresMcd = new Map<number, number>();
    for (const [p] of factoresMcm) {
      const exps = factorizaciones.map(({ f }) => f.get(p) ?? 0);
      const min = Math.min(...exps);
      if (min > 0) factoresMcd.set(p, min);
    }

    const filasDetalle: FilaDetalle[] = [
      ...factorizaciones.map(({ n, f }, i) => ({
        key: `f-${i}`,
        label: `${fmtNumero(n)} =`,
        operacion: n === 1 ? '1 no tiene factores primos' : undefined,
        valor: factoresATexto(f),
      })),
      {
        key: 'mcm',
        label: 'MCM: todos los primos, mayor exponente',
        operacion: factoresATexto(factoresMcm),
        valor: fmtNumero(resultadoMcm),
      },
      {
        key: 'mcd',
        label: 'MCD: solo primos comunes, menor exponente',
        operacion: factoresMcd.size ? factoresATexto(factoresMcd) : 'Sin factores comunes',
        valor: fmtNumero(resultadoMcd),
      },
    ];

    return { numeros, resultadoMcm, resultadoMcd, filasDetalle };
  }, [filas]);

  const actualizar = (id: string, valor: string) => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, valor } : f)));
  };

  const agregar = () => setFilas((prev) => [...prev, nuevaFila()]);

  const eliminar = (id: string) => {
    setFilas((prev) => (prev.length <= 2 ? prev : prev.filter((f) => f.id !== id)));
  };

  const cargarEjemplo = () => {
    setFilas(['12', '18', '30'].map((v) => nuevaFila(v)));
    setCalculado(false);
  };

  const limpiar = () => {
    setFilas([nuevaFila(), nuevaFila()]);
    setCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const calcular = () => {
    setCalculado(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(resultadoY.current - Spacing.three, 0), animated: true });
    }, 80);
  };

  const guardar = async () => {
    if (!calculo) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: fmtNumero(calculo.resultadoMcm),
      resumen: `MCM de ${calculo.numeros.join(', ')} · MCD ${calculo.resultadoMcd}`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderCalculadora calculadoraId={CALC_ID} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <AvisoInfo>
            Ingresa dos o más números enteros positivos. Obtendrás el mínimo común múltiplo, el máximo
            común divisor y la factorización de cada uno.
          </AvisoInfo>

          <Seccion
            titulo="Números"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.encabezados}>
              <Text style={[styles.encabezado, styles.colValor, { color: colors.textMuted }]}>
                NÚMERO ENTERO
              </Text>
              <View style={styles.colAccion} />
            </View>

            {filas.map((fila, index) => {
              const error = fila.valor.trim() !== '' && !esValido(fila.valor);
              const minimo = filas.length <= 2;
              return (
                <View key={fila.id} style={styles.fila}>
                  <View style={styles.filaLinea}>
                    <View style={styles.numero}>
                      <Text style={styles.numeroTexto}>{index + 1}</Text>
                    </View>
                    <TextInput
                      value={fila.valor}
                      onChangeText={(t) => actualizar(fila.id, t)}
                      placeholder="Ej: 12"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={7}
                      style={[
                        styles.input,
                        styles.colValor,
                        { color: colors.text, borderColor: error ? colors.danger : colors.border },
                      ]}
                    />
                    <Pressable
                      disabled={minimo}
                      onPress={() => eliminar(fila.id)}
                      hitSlop={6}
                      accessibilityLabel="Eliminar número"
                      style={({ pressed }) => [
                        styles.colAccion,
                        styles.eliminar,
                        { opacity: minimo ? 0.3 : pressed ? 0.6 : 1 },
                      ]}>
                      <Ionicons name="trash-outline" size={20} color={Acento.claro} />
                    </Pressable>
                  </View>
                  {error && (
                    <Text style={[styles.errorTexto, { color: colors.danger }]}>
                      Debe ser un entero entre 1 y {fmtNumero(MAXIMO)}
                    </Text>
                  )}
                </View>
              );
            })}

            <BotonAgregar label="Agregar número" onPress={agregar} />
          </Seccion>

          <BotonPrimario
            label="Calcular MCM y MCD"
            icono="grid-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Mínimo común múltiplo"
              valor={fmtNumero(calculo.resultadoMcm)}
              tono="info"
              badge={`MCD = ${fmtNumero(calculo.resultadoMcd)}`}
              descripcion={`MCM(${calculo.numeros.join(', ')}) = ${fmtNumero(calculo.resultadoMcm)} · MCD = ${fmtNumero(calculo.resultadoMcd)}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={calculo.filasDetalle}
                total={{
                  label: 'MCM / MCD',
                  valor: `${fmtNumero(calculo.resultadoMcm)} / ${fmtNumero(calculo.resultadoMcd)}`,
                }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calculan?"
            texto="Se descompone cada número en factores primos. El MCM usa todos los primos con su mayor exponente; el MCD usa solo los primos que aparecen en todos los números, con su menor exponente."
            formula="MCM(a, b) × MCD(a, b) = a × b"
            tip="MCM sirve para encontrar cuándo coinciden eventos que se repiten (buses, alarmas). MCD sirve para repartir en partes iguales lo más grandes posible."
          />
        </ScrollView>

        <BarraAcciones
          onLimpiar={limpiar}
          onGuardar={guardar}
          guardarDeshabilitado={!mostrarResultado}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
    paddingLeft: ANCHO_NUMERO + GAP,
    marginBottom: -6,
  },
  encabezado: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  colValor: {
    flex: 1,
  },
  colAccion: {
    width: ANCHO_ACCION,
  },
  fila: {
    gap: 6,
  },
  filaLinea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  numero: {
    width: ANCHO_NUMERO,
    height: ALTO_INPUT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    color: Acento.claro,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    height: ALTO_INPUT,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  eliminar: {
    height: ALTO_INPUT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTexto: {
    marginLeft: ANCHO_NUMERO + GAP,
    fontSize: 12,
    fontWeight: '600',
  },
});
