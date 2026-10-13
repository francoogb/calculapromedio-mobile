import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonPildora,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Colors, Spacing } from '@/constants/theme';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'nota-escala';
const colors = Colors.dark;

const NOTA_MIN = 1;
const NOTA_APROB = 4;
const NOTA_MAX = 7;

type Exigencia = '50' | '60' | '70';

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

function fmt(n: number, decimales = 2): string {
  return String(parseFloat(n.toFixed(decimales)));
}

/** Redondeo chileno a un decimal (3.95 → 4.0). */
function redondearNota(n: number): number {
  return Math.round(n * 10 + 1e-9) / 10;
}

/** Puntaje necesario para una nota dada (inverso de la escala). */
function puntajeParaNota(nota: number, total: number, pMin: number): number {
  if (nota >= NOTA_APROB) {
    return pMin + ((nota - NOTA_APROB) / (NOTA_MAX - NOTA_APROB)) * (total - pMin);
  }
  return ((nota - NOTA_MIN) / (NOTA_APROB - NOTA_MIN)) * pMin;
}

export default function NotaEscalaScreen() {
  const [total, setTotal] = useState('');
  const [obtenido, setObtenido] = useState('');
  const [exigencia, setExigencia] = useState<Exigencia>('60');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [total, obtenido, exigencia]);

  const nTotal = aNumero(total);
  const nObtenido = aNumero(obtenido);

  const errorTotal = total.trim() !== '' && !(nTotal > 0) ? 'Debe ser mayor a 0' : null;
  const errorObtenido =
    obtenido.trim() === '' ? null
    : !(nObtenido >= 0) ? 'No puede ser negativo'
    : Number.isFinite(nTotal) && nObtenido > nTotal ? 'No puede superar el puntaje total'
    : null;

  const calculo = useMemo(() => {
    if (!Number.isFinite(nTotal) || !Number.isFinite(nObtenido) || errorTotal || errorObtenido) return null;

    const exig = Number(exigencia) / 100;
    const pMin = nTotal * exig;
    const aprueba = nObtenido >= pMin;

    const notaExacta = aprueba
      ? NOTA_APROB + (NOTA_MAX - NOTA_APROB) * ((nObtenido - pMin) / (nTotal - pMin))
      : NOTA_MIN + (NOTA_APROB - NOTA_MIN) * (nObtenido / pMin);
    const nota = Math.max(NOTA_MIN, Math.min(notaExacta, NOTA_MAX));

    return {
      pMin,
      aprueba,
      nota,
      notaRedondeada: redondearNota(nota),
      logro: (nObtenido / nTotal) * 100,
      tramo: aprueba
        ? `4.0 + 3.0 × (${fmt(nObtenido)} − ${fmt(pMin)}) ÷ (${fmt(nTotal)} − ${fmt(pMin)})`
        : `1.0 + 3.0 × ${fmt(nObtenido)} ÷ ${fmt(pMin)}`,
    };
  }, [nTotal, nObtenido, exigencia, errorTotal, errorObtenido]);

  const cargarEjemplo = () => {
    setTotal('50');
    setObtenido('35');
    setExigencia('60');
    setCalculado(false);
  };

  const limpiar = () => {
    setTotal('');
    setObtenido('');
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
      resultado: calculo.notaRedondeada.toFixed(1),
      resumen: `${fmt(nObtenido)} de ${fmt(nTotal)} pts · exigencia ${exigencia}%`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const aprobado = calculo !== null && calculo.notaRedondeada >= NOTA_APROB;

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
            Convierte el puntaje de una prueba en nota de 1.0 a 7.0. La exigencia es el porcentaje
            del puntaje que necesitas para el 4.0.
          </AvisoInfo>

          <Seccion
            titulo="Tu prueba"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.fila2}>
              <View style={styles.col}>
                <CampoNumero
                  label="Puntaje total"
                  value={total}
                  onChangeText={setTotal}
                  placeholder="Ej: 50"
                  error={errorTotal}
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label="Tu puntaje"
                  value={obtenido}
                  onChangeText={setObtenido}
                  placeholder="Ej: 35"
                  error={errorObtenido}
                />
              </View>
            </View>

            <Segmentado
              label="Exigencia"
              opciones={[
                { id: '50', texto: '50%' },
                { id: '60', texto: '60% · usual' },
                { id: '70', texto: '70%' },
              ]}
              valor={exigencia}
              onCambiar={setExigencia}
            />
          </Seccion>

          <BotonPrimario
            label="Calcular nota"
            icono="document-text-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Tu nota es"
              valor={calculo.notaRedondeada.toFixed(1)}
              tono={aprobado ? 'ok' : 'error'}
              badge={aprobado ? 'Aprobado' : 'Reprobado'}
              descripcion={`Lograste el ${fmt(calculo.logro, 1)}% del puntaje · nota exacta ${fmt(calculo.nota)}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  {
                    key: 'pmin',
                    label: 'Puntaje para el 4.0',
                    operacion: `${fmt(nTotal)} × ${exigencia}%`,
                    valor: `${fmt(calculo.pMin)} pts`,
                  },
                  {
                    key: 'tramo',
                    label: calculo.aprueba ? 'Tramo de aprobación (4.0 a 7.0)' : 'Tramo de reprobación (1.0 a 3.9)',
                    operacion: calculo.tramo,
                    valor: fmt(calculo.nota),
                  },
                  ...[5, 6, 7].map((n) => ({
                    key: `para-${n}`,
                    label: `Para un ${n}.0 necesitas`,
                    valor: `${fmt(Math.ceil(puntajeParaNota(n, nTotal, calculo.pMin) * 10) / 10, 1)} pts`,
                  })),
                ]}
                total={{ label: 'Nota (redondeada)', valor: calculo.notaRedondeada.toFixed(1) }}
                tonoTotal={aprobado ? 'ok' : 'error'}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo funciona la escala?"
            texto="La escala tiene dos tramos. Bajo el puntaje de exigencia, la nota va de 1.0 a 4.0; sobre él, de 4.0 a 7.0. Por eso con 60% de exigencia necesitas el 60% del puntaje para el 4.0, pero el 40% restante te lleva de 4.0 a 7.0."
            formula="Nota = 4.0 + 3.0 × (Puntaje − P.mín) ÷ (Total − P.mín)"
            tip="Con más exigencia, el 4.0 cuesta más puntos. Pregúntale a tu profe qué exigencia usa: en Chile lo más común es 60%."
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
  fila2: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
});
