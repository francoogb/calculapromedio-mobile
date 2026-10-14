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
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'factorizacion';
const colors = Colors.dark;

const EJEMPLOS: Record<string, [string, string, string]> = {
  'Dos factores': ['1', '-5', '6'],
  'Cuadrado perfecto': ['1', '-6', '9'],
  'Dif. de cuadrados': ['1', '0', '-16'],
  'Con a ≠ 1': ['2', '7', '3'],
  'Factor común': ['2', '8', '0'],
  'Sin raíces reales': ['1', '2', '5'],
};

function mcd(x: number, y: number): number {
  let a = Math.abs(Math.round(x));
  let b = Math.abs(Math.round(y));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/** Formatea término de polinomio con signo (ej. +3x, −5) */
function formatoTermino(coef: number, variable: string, primero: boolean): string {
  if (coef === 0) return '';
  const signo = coef < 0 ? '−' : primero ? '' : '+';
  const abs = Math.abs(coef);
  const numero = variable && abs === 1 ? '' : fmtNumero(abs);
  return `${primero ? signo : ` ${signo} `}${numero}${variable}`;
}

function polinomioTexto(a: number, b: number, c: number): string {
  const partes = [
    formatoTermino(a, 'x²', true),
    formatoTermino(b, 'x', a === 0),
    formatoTermino(c, '', a === 0 && b === 0),
  ];
  return partes.filter(Boolean).join('') || '0';
}

/** Convierte una raíz r = p/q en el binomio (qx - p) simplificado */
function formatearBinomio(r: number, maxDenom: number = 100): { binomio: string; q: number; p: number } {
  let mejorP = Math.round(r);
  let mejorQ = 1;
  let minError = Math.abs(r - mejorP);

  for (let q = 1; q <= Math.max(1, Math.abs(maxDenom)); q++) {
    const p = Math.round(r * q);
    const err = Math.abs(r - p / q);
    if (err < minError && err < 1e-7) {
      minError = err;
      mejorP = p;
      mejorQ = q;
      break;
    }
  }

  const d = mcd(mejorP, mejorQ);
  let p = mejorP / d;
  let q = mejorQ / d;
  if (q < 0) {
    q = -q;
    p = -p;
  }

  const parteX = q === 1 ? 'x' : `${q}x`;
  if (p === 0) {
    return { binomio: parteX, q, p };
  }
  const signo = p > 0 ? '−' : '+';
  const valP = Math.abs(p);
  return {
    binomio: `(${parteX} ${signo} ${fmtNumero(valP)})`,
    q,
    p,
  };
}

export default function FactorizacionScreen() {
  const [a, setA] = useState('1');
  const [b, setB] = useState('-5');
  const [c, setC] = useState('6');
  const [ejemploActivo, setEjemploActivo] = useState('Dos factores');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [a, b, c]);

  const na = leerNumero(a);
  const nb = leerNumero(b);
  const nc = leerNumero(c);
  const errorA = a.trim() !== '' && na === 0 ? 'Si a = 0 no es un trinomio cuadrático' : null;

  const calculo = useMemo(() => {
    if (![na, nb, nc].every(Number.isFinite) || errorA) return null;

    const delta = nb * nb - 4 * na * nc;
    const filas: FilaDetalle[] = [
      {
        key: 'expresion',
        label: 'Expresión original',
        valor: polinomioTexto(na, nb, nc),
      },
      {
        key: 'delta',
        label: 'Discriminante Δ = b² − 4ac',
        operacion: `(${fmtNumero(nb)})² − 4·(${fmtNumero(na)})·(${fmtNumero(nc)})`,
        valor: fmtNumero(delta),
      },
    ];

    let formaFactorizada: string;
    let badge: string;
    let tono: Tono;
    let descripcion: string;

    // Caso 1: Factor común cuando c = 0
    if (nc === 0) {
      const g = mcd(na, nb);
      const coefComun = na < 0 ? -g : g;
      const signoComun = coefComun === 1 ? '' : coefComun === -1 ? '−' : fmtNumero(coefComun);
      const restoA = na / coefComun;
      const restoB = nb / coefComun;

      const terminoA = restoA === 1 ? 'x' : restoA === -1 ? '−x' : `${fmtNumero(restoA)}x`;
      const signoB = restoB >= 0 ? '+' : '−';
      const terminoB = Math.abs(restoB);

      formaFactorizada = `${signoComun}x(${terminoA} ${signoB} ${fmtNumero(terminoB)})`;
      badge = 'Factor común monomio';
      tono = 'ok';
      descripcion = 'Se extrajo la variable x y el máximo común divisor de los coeficientes.';
      filas.push({
        key: 'factorComun',
        label: 'Factor común extraído',
        operacion: `MCD(${fmtNumero(na)}, ${fmtNumero(nb)})·x`,
        valor: `${signoComun}x`,
      });
      filas.push({
        key: 'resultado',
        label: 'Forma factorizada',
        valor: formaFactorizada,
      });
    }
    // Caso 2: Sin raíces reales (Δ < 0)
    else if (delta < 0) {
      formaFactorizada = 'Irreducible en ℝ';
      badge = 'Sin raíces reales';
      tono = 'warning';
      descripcion = 'El discriminante es negativo (Δ < 0). No se puede factorizar en binomios con números reales.';
      filas.push({
        key: 'raices',
        label: 'Raíces en ℝ',
        valor: 'No existen (raíces complejas)',
        tono: 'warning',
      });
    }
    // Caso 3: Trinomio cuadrado perfecto (Δ = 0)
    else if (delta === 0) {
      const r = -nb / (2 * na);
      const binomioObj = formatearBinomio(r, Math.abs(na));
      const q = binomioObj.q;
      const coefSobrante = Math.round(na / (q * q));
      const prefijo = coefSobrante === 1 ? '' : coefSobrante === -1 ? '−' : `${fmtNumero(coefSobrante)}`;

      formaFactorizada = `${prefijo}${binomioObj.binomio}²`;
      badge = 'Trinomio cuadrado perfecto';
      tono = 'ok';
      descripcion = 'Tiene una raíz doble. El polinomio equivale al cuadrado de un binomio.';
      filas.push({
        key: 'raiz',
        label: 'Raíz doble r = −b ÷ 2a',
        operacion: `${fmtNumero(-nb)} ÷ ${fmtNumero(2 * na)}`,
        valor: fmtNumero(r),
      });
      filas.push({
        key: 'factor',
        label: 'Factorización',
        valor: formaFactorizada,
      });
    }
    // Caso 4: Dos raíces distintas (Δ > 0)
    else {
      const raizDelta = Math.sqrt(delta);
      const r1 = (-nb + raizDelta) / (2 * na);
      const r2 = (-nb - raizDelta) / (2 * na);
      const esDifCuadrados = nb === 0 && nc < 0;

      filas.push({
        key: 'raices',
        label: 'Raíces x₁, x₂',
        operacion: `(${fmtNumero(-nb)} ± ${fmtNumero(raizDelta)}) ÷ ${fmtNumero(2 * na)}`,
        valor: `x₁ = ${fmtNumero(r1)}, x₂ = ${fmtNumero(r2)}`,
      });

      const esCuadradoExacto = Number.isInteger(raizDelta);
      if (esCuadradoExacto) {
        const f1 = formatearBinomio(r1, Math.abs(na));
        const remA = Math.round(na / f1.q);
        const f2 = formatearBinomio(r2, Math.abs(remA));
        const remTotal = Math.round(remA / f2.q);

        const prefijo = remTotal === 1 ? '' : remTotal === -1 ? '−' : `${fmtNumero(remTotal)}`;
        formaFactorizada = `${prefijo}${f1.binomio}${f2.binomio}`;
      } else {
        const prefijo = na === 1 ? '' : na === -1 ? '−' : `${fmtNumero(na)}·`;
        const f1 = r1 >= 0 ? `(x − ${fmtNumero(r1)})` : `(x + ${fmtNumero(Math.abs(r1))})`;
        const f2 = r2 >= 0 ? `(x − ${fmtNumero(r2)})` : `(x + ${fmtNumero(Math.abs(r2))})`;
        formaFactorizada = `${prefijo}${f1}${f2}`;
      }

      badge = esDifCuadrados ? 'Diferencia de cuadrados' : 'Dos factores lineales';
      tono = 'ok';
      descripcion = esDifCuadrados
        ? 'Diferencia de cuadrados: (qx − p)(qx + p).'
        : 'Trinomio factorizable en dos factores lineales.';

      filas.push({
        key: 'resultado',
        label: 'Forma factorizada final',
        valor: formaFactorizada,
      });
    }

    const resumen = `${polinomioTexto(na, nb, nc)} = ${formaFactorizada}`;

    return {
      valor: formaFactorizada,
      badge,
      tono,
      descripcion,
      resumen,
      filas,
    };
  }, [na, nb, nc, errorA]);

  const cargarEjemplo = (nombre: string) => {
    const ej = EJEMPLOS[nombre];
    if (!ej) return;
    const [ea, eb, ec] = ej;
    setEjemploActivo(nombre);
    setA(ea);
    setB(eb);
    setC(ec);
    setCalculado(true);
  };

  const limpiar = () => {
    setA('');
    setB('');
    setC('');
    setEjemploActivo('');
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
      resultado: calculo.valor,
      resumen: calculo.resumen,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const vistaPrevia =
    [na, nb, nc].every(Number.isFinite) && !errorA
      ? polinomioTexto(na, nb, nc)
      : 'ax² + bx + c';

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
            Descompone trinomios cuadráticos en sus factores primos irreducibles (binomios con término en x).
          </AvisoInfo>

          <Seccion titulo="Tu trinomio">
            <View style={[styles.vistaPrevia, { borderColor: Acento.borde, backgroundColor: Acento.fondo }]}>
              <Text style={styles.vistaPreviaTexto} numberOfLines={1} adjustsFontSizeToFit>
                {vistaPrevia}
              </Text>
            </View>

            <View style={styles.fila3}>
              <View style={styles.col}>
                <CampoNumero
                  label="a (x²)"
                  value={a}
                  onChangeText={(val) => {
                    setA(val);
                    setEjemploActivo('');
                  }}
                  placeholder="1"
                  error={errorA}
                  permiteNegativo
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label="b (x)"
                  value={b}
                  onChangeText={(val) => {
                    setB(val);
                    setEjemploActivo('');
                  }}
                  placeholder="-5"
                  permiteNegativo
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label="c"
                  value={c}
                  onChangeText={(val) => {
                    setC(val);
                    setEjemploActivo('');
                  }}
                  placeholder="6"
                  permiteNegativo
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>EJEMPLOS RÁPIDOS</Text>
            <ChipsRapidos
              opciones={Object.keys(EJEMPLOS)}
              valorActual={ejemploActivo}
              onElegir={cargarEjemplo}
            />
          </Seccion>

          <BotonPrimario
            label="Factorizar polinomio"
            icono="extension-puzzle-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Forma factorizada"
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
            titulo="¿Cómo funciona la factorización?"
            texto="Factorizar consiste en transformar una suma o resta de términos algebraicos en una multiplicación de factores más simples. El discriminante Δ = b² − 4ac determina el tipo de factorización posible en ℝ."
            formula="ax² + bx + c = a(x − x₁)(x − x₂)"
            tip="En la PAES M1/M2, si a = 1, busca dos números que multiplicados den c y sumados den b. Por ejemplo en x² − 5x + 6: (−2)·(−3) = 6 y (−2) + (−3) = −5, por ende los factores son (x − 2)(x − 3)."
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
