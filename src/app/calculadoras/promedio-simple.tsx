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
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'promedio-simple';
const colors = Colors.dark;

// Medidas compartidas para que número, input y encabezado queden alineados
const ANCHO_NUMERO = 44;
const ANCHO_ACCION = 36;
const ALTO_INPUT = 50;
const GAP = 10;

type Nota = {
  id: string;
  valor: string;
};

function nuevaNota(valor = ''): Nota {
  return { id: Math.random().toString(36).slice(2, 9), valor };
}

function notasIniciales(): Nota[] {
  return [nuevaNota(), nuevaNota(), nuevaNota()];
}

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

function notaValida(n: number): boolean {
  return Number.isFinite(n) && n >= 1 && n <= 7;
}

// 5.0 → "5.0", 6.25 → "6.25" (las notas siempre con al menos un decimal)
function fmtNota(n: number): string {
  const r = parseFloat(n.toFixed(2));
  return Number.isInteger(r) ? r.toFixed(1) : String(r);
}

export default function PromedioSimpleScreen() {
  const [notas, setNotas] = useState<Nota[]>(notasIniciales);
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [notas]);

  // Si se abrió desde "Cálculos guardados": llena las notas y muestra el resultado
  useRestaurarEntrada<{ notas: string[] }>((datos) => {
    setNotas(datos.notas.map((valor) => nuevaNota(valor)));
    setCalculado(true);
  });

  const calculo = useMemo(() => {
    const validas = notas.map((n) => aNumero(n.valor)).filter(notaValida);
    if (validas.length === 0) return null;

    const suma = validas.reduce((acc, v) => acc + v, 0);
    return {
      validas,
      suma,
      cantidad: validas.length,
      promedio: suma / validas.length,
      maxima: Math.max(...validas),
      minima: Math.min(...validas),
    };
  }, [notas]);

  const actualizar = (id: string, valor: string) => {
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, valor } : n)));
  };

  const agregar = () => {
    setNotas((prev) => [...prev, nuevaNota()]);
  };

  const eliminar = (id: string) => {
    setNotas((prev) => (prev.length <= 1 ? prev : prev.filter((n) => n.id !== id)));
  };

  const limpiar = () => {
    setNotas(notasIniciales());
    setCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const cargarEjemplo = () => {
    setNotas(['5.5', '6.2', '4.8', '6.5'].map((v) => nuevaNota(v)));
    setCalculado(false);
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
      resultado: calculo.promedio.toFixed(2),
      resumen: `${calculo.cantidad} ${calculo.cantidad === 1 ? 'nota' : 'notas'}`,
      datos: { notas: notas.map((n) => n.valor) },
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const aprobado = calculo !== null && calculo.promedio >= 4;
  // Redondeo chileno a un decimal (3.95 → 4.0); el epsilon evita errores de coma flotante
  const redondeado = calculo ? (Math.round(calculo.promedio * 10 + 1e-9) / 10).toFixed(1) : '';

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
            Todas las notas valen lo mismo. Si tus evaluaciones tienen distinto porcentaje, usa
            Promedio Ponderado.
          </AvisoInfo>

          {/* NOTAS */}
          <Seccion
            titulo="Notas"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.encabezados}>
              <Text style={[styles.encabezado, styles.colNota, { color: colors.textMuted }]}>
                NOTA (1.0 – 7.0)
              </Text>
              <View style={styles.colAccion} />
            </View>

            {notas.map((nota, index) => {
              const fueraDeRango = nota.valor.trim() !== '' && !notaValida(aNumero(nota.valor));
              const unica = notas.length <= 1;

              return (
                <View key={nota.id} style={styles.fila}>
                  <View style={styles.filaLinea}>
                    <View style={styles.numero}>
                      <Text style={styles.numeroTexto}>{index + 1}</Text>
                    </View>

                    <TextInput
                      value={nota.valor}
                      onChangeText={(t) => actualizar(nota.id, t)}
                      placeholder="Ej: 5.5"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      maxLength={4}
                      style={[
                        styles.input,
                        styles.colNota,
                        {
                          color: colors.text,
                          borderColor: fueraDeRango ? colors.danger : colors.border,
                        },
                      ]}
                    />

                    <Pressable
                      disabled={unica}
                      onPress={() => eliminar(nota.id)}
                      hitSlop={6}
                      accessibilityLabel="Eliminar nota"
                      style={({ pressed }) => [
                        styles.colAccion,
                        styles.eliminar,
                        { opacity: unica ? 0.3 : pressed ? 0.6 : 1 },
                      ]}>
                      <Ionicons name="trash-outline" size={20} color={Acento.claro} />
                    </Pressable>
                  </View>

                  {fueraDeRango && (
                    <Text style={[styles.errorTexto, { color: colors.danger }]}>
                      La nota debe estar entre 1.0 y 7.0
                    </Text>
                  )}
                </View>
              );
            })}

            <BotonAgregar label="Agregar nota" onPress={agregar} />
          </Seccion>

          <BotonPrimario
            label="Calcular promedio"
            icono="calculator-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {/* RESULTADO */}
          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Tu promedio es"
              valor={calculo.promedio.toFixed(2)}
              tono={aprobado ? 'ok' : 'error'}
              badge={aprobado ? 'Aprobado' : 'Bajo 4.0'}
              descripcion={`Redondeado a un decimal: ${redondeado}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  {
                    key: 'suma',
                    label: 'Suma de las notas',
                    operacion: calculo.validas.map(fmtNota).join(' + '),
                    valor: fmtNota(calculo.suma),
                  },
                  {
                    key: 'division',
                    label: `Dividido por ${calculo.cantidad} ${calculo.cantidad === 1 ? 'nota' : 'notas'}`,
                    operacion: `${fmtNota(calculo.suma)} ÷ ${calculo.cantidad}`,
                    valor: calculo.promedio.toFixed(2),
                  },
                  {
                    key: 'extremos',
                    label: 'Nota más alta / más baja',
                    valor: `${fmtNota(calculo.maxima)} / ${fmtNota(calculo.minima)}`,
                  },
                ]}
                total={{ label: 'Promedio final', valor: calculo.promedio.toFixed(2) }}
                tonoTotal={aprobado ? 'ok' : 'error'}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula el promedio simple?"
            texto="Se suman todas las notas y el total se divide por la cantidad de notas. Cada evaluación tiene exactamente el mismo valor."
            formula="Promedio = Suma de notas ÷ Cantidad de notas"
            tip="En Chile las notas se redondean a un decimal: 3.95 sube a 4.0, pero 3.94 queda en 3.9. Revisa siempre la regla de tu colegio."
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
  colNota: {
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
