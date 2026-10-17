import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type FilaDetalle, type Tono } from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { fmtNumero, leerNumero } from '@/lib/matematica';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'ecuacion-cuadratica';
const colors = Colors.dark;

const EJEMPLOS: Record<string, [string, string, string]> = {
  '2 soluciones': ['1', '-5', '6'],
  '1 solución': ['1', '-4', '4'],
  'Sin solución real': ['1', '2', '5'],
};

/** Coeficiente con signo para mostrar la ecuación: +3x, −x, etc. */
function termino(coef: number, variable: string, primero: boolean): string {
  if (coef === 0) return '';
  const signo = coef < 0 ? '−' : primero ? '' : '+';
  const abs = Math.abs(coef);
  const numero = variable && abs === 1 ? '' : fmtNumero(abs);
  return `${primero ? signo : ` ${signo} `}${numero}${variable}`;
}

function ecuacionTexto(a: number, b: number, c: number): string {
  const partes = [termino(a, 'x²', true), termino(b, 'x', a === 0), termino(c, '', a === 0 && b === 0)];
  return `${partes.join('')} = 0`;
}

export default function EcuacionCuadraticaScreen() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Al abrir desde "Cálculos guardados": llena los campos y muestra el resultado
  useRestaurarEntrada<{ a: string; b: string; c: string }>((d) => { setA(d.a); setB(d.b); setC(d.c); setCalculado(true); });

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [a, b, c]);

  const na = leerNumero(a);
  const nb = leerNumero(b);
  const nc = leerNumero(c);
  const errorA = a.trim() !== '' && na === 0 ? 'Si a = 0 no es cuadrática' : null;

  const calculo = useMemo(() => {
    if (![na, nb, nc].every(Number.isFinite) || errorA) return null;

    const delta = nb * nb - 4 * na * nc;
    const h = -nb / (2 * na);
    const k = na * h * h + nb * h + nc;

    const filas: FilaDetalle[] = [
      {
        key: 'delta',
        label: 'Discriminante Δ = b² − 4ac',
        operacion: `(${fmtNumero(nb)})² − 4·(${fmtNumero(na)})·(${fmtNumero(nc)})`,
        valor: fmtNumero(delta),
      },
    ];

    let valor: string;
    let badge: string;
    let tono: Tono;
    let descripcion: string;
    let resumen: string;

    if (delta > 0) {
      const raiz = Math.sqrt(delta);
      const x1 = (-nb + raiz) / (2 * na);
      const x2 = (-nb - raiz) / (2 * na);
      filas.push({ key: 'raiz', label: '√Δ', valor: fmtNumero(raiz) });
      filas.push({
        key: 'x1',
        label: 'x₁ = (−b + √Δ) ÷ 2a',
        operacion: `(${fmtNumero(-nb)} + ${fmtNumero(raiz)}) ÷ ${fmtNumero(2 * na)}`,
        valor: fmtNumero(x1),
      });
      filas.push({
        key: 'x2',
        label: 'x₂ = (−b − √Δ) ÷ 2a',
        operacion: `(${fmtNumero(-nb)} − ${fmtNumero(raiz)}) ÷ ${fmtNumero(2 * na)}`,
        valor: fmtNumero(x2),
      });
      valor = `${fmtNumero(x1)} y ${fmtNumero(x2)}`;
      badge = '2 soluciones';
      tono = 'ok';
      descripcion = 'Δ > 0: la parábola corta el eje X en dos puntos.';
      resumen = `x₁ = ${fmtNumero(x1)}, x₂ = ${fmtNumero(x2)}`;
    } else if (delta === 0) {
      const x = -nb / (2 * na);
      filas.push({ key: 'x', label: 'x = −b ÷ 2a', operacion: `${fmtNumero(-nb)} ÷ ${fmtNumero(2 * na)}`, valor: fmtNumero(x) });
      valor = fmtNumero(x);
      badge = '1 solución';
      tono = 'info';
      descripcion = 'Δ = 0: la parábola toca el eje X en un solo punto (el vértice).';
      resumen = `x = ${fmtNumero(x)}`;
    } else {
      const real = -nb / (2 * na);
      const imag = Math.sqrt(-delta) / (2 * Math.abs(na));
      filas.push({
        key: 'complejas',
        label: 'Soluciones complejas',
        operacion: 'Parte real ± parte imaginaria',
        valor: `${fmtNumero(real)} ± ${fmtNumero(imag)}i`,
      });
      valor = 'Sin solución real';
      badge = 'Δ < 0';
      tono = 'warning';
      descripcion = 'Δ < 0: la parábola no corta el eje X. Las soluciones son números complejos.';
      resumen = 'Sin solución real';
    }

    filas.push({
      key: 'vertice',
      label: 'Vértice de la parábola',
      operacion: `h = −b ÷ 2a, k = f(h)`,
      valor: `(${fmtNumero(h)}, ${fmtNumero(k)})`,
    });
    filas.push({
      key: 'concavidad',
      label: 'Concavidad',
      operacion: na > 0 ? 'a > 0: abre hacia arriba (mínimo)' : 'a < 0: abre hacia abajo (máximo)',
      valor: na > 0 ? '∪' : '∩',
    });

    return { delta, valor, badge, tono, descripcion, filas, resumen };
  }, [na, nb, nc, errorA]);

  const cargarEjemplo = (nombre: string) => {
    const [ea, eb, ec] = EJEMPLOS[nombre];
    setA(ea);
    setB(eb);
    setC(ec);
    setCalculado(false);
  };

  const limpiar = () => {
    setA('');
    setB('');
    setC('');
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
      resultado: calculo.delta < 0 ? 'Sin sol. real' : calculo.valor,
      resumen: ecuacionTexto(na, nb, nc),
      datos: { a, b, c },
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const vistaPrevia = [na, nb, nc].every(Number.isFinite) && !errorA ? ecuacionTexto(na, nb, nc) : 'ax² + bx + c = 0';

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
            Escribe los coeficientes de tu ecuación de la forma ax² + bx + c = 0. Si falta un
            término, su coeficiente es 0.
          </AvisoInfo>

          <Seccion titulo="Tu ecuación">
            <View style={[styles.vistaPrevia, { borderColor: Acento.borde, backgroundColor: Acento.fondo }]}>
              <Text style={styles.vistaPreviaTexto} numberOfLines={1} adjustsFontSizeToFit>
                {vistaPrevia}
              </Text>
            </View>

            <View style={styles.fila3}>
              <View style={styles.col}>
                <CampoNumero label="a (x²)" value={a} onChangeText={setA} placeholder="1" error={errorA} permiteNegativo />
              </View>
              <View style={styles.col}>
                <CampoNumero label="b (x)" value={b} onChangeText={setB} placeholder="-5" permiteNegativo />
              </View>
              <View style={styles.col}>
                <CampoNumero label="c" value={c} onChangeText={setC} placeholder="6" permiteNegativo />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>EJEMPLOS</Text>
            <ChipsRapidos opciones={Object.keys(EJEMPLOS)} valorActual="" onElegir={cargarEjemplo} />
          </Seccion>

          <BotonPrimario
            label="Resolver"
            icono="git-branch-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo={calculo.delta === 0 ? 'La solución es' : 'Las soluciones son'}
              valor={calculo.valor}
              tono={calculo.tono}
              badge={calculo.badge}
              descripcion={calculo.descripcion}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={calculo.filas}
                total={{ label: 'Resultado', valor: calculo.resumen }}
                tonoTotal={calculo.tono}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se resuelve?"
            texto="Con la fórmula general. El discriminante (Δ) indica cuántas soluciones reales hay: positivo → dos, cero → una, negativo → ninguna."
            formula="x = (−b ± √(b² − 4ac)) ÷ 2a"
            tip="Antes de usar la fórmula, prueba factorizar: x² − 5x + 6 = (x − 2)(x − 3), así que x = 2 o x = 3. En la PAES suele ser más rápido."
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
  vistaPrevia: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  vistaPreviaTexto: {
    color: '#e0e7ff',
    fontSize: 22,
    fontWeight: '800',
  },
  fila3: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: -6,
  },
});
