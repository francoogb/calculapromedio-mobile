import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

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
import { Acento, Colors, Spacing } from '@/constants/theme';
import { fmtNumero, leerNumero } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'pitagoras';
const colors = Colors.dark;

type Incognita = 'c' | 'cateto';

export default function PitagorasScreen() {
  const [incognita, setIncognita] = useState<Incognita>('c');
  const [lado1, setLado1] = useState('');
  const [lado2, setLado2] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [incognita, lado1, lado2]);

  const n1 = leerNumero(lado1);
  const n2 = leerNumero(lado2);

  const errorPositivo = (txt: string, n: number) => (txt.trim() !== '' && !(n > 0) ? 'Debe ser mayor a 0' : null);
  const error1 = errorPositivo(lado1, n1);
  const error2 =
    errorPositivo(lado2, n2) ??
    (incognita === 'cateto' && n1 > 0 && n2 > 0 && n2 <= n1 ? 'La hipotenusa debe ser mayor que el cateto' : null);

  const calculo = useMemo(() => {
    if (!(n1 > 0) || !(n2 > 0) || error1 || error2) return null;

    if (incognita === 'c') {
      const suma = n1 * n1 + n2 * n2;
      const c = Math.sqrt(suma);
      return {
        a: n1, b: n2, c, resultado: c,
        filas: [
          { key: 'cuad', label: 'Cuadrados de los catetos', operacion: `${fmtNumero(n1)}² + ${fmtNumero(n2)}²`, valor: `${fmtNumero(n1 * n1)} + ${fmtNumero(n2 * n2)}` },
          { key: 'suma', label: 'Suma', operacion: 'c² = a² + b²', valor: fmtNumero(suma) },
          { key: 'raiz', label: 'Raíz cuadrada', operacion: `√${fmtNumero(suma)}`, valor: fmtNumero(c) },
        ],
      };
    }

    // n1 = cateto conocido, n2 = hipotenusa
    const resta = n2 * n2 - n1 * n1;
    const b = Math.sqrt(resta);
    return {
      a: n1, b, c: n2, resultado: b,
      filas: [
        { key: 'cuad', label: 'Cuadrados', operacion: `${fmtNumero(n2)}² − ${fmtNumero(n1)}²`, valor: `${fmtNumero(n2 * n2)} − ${fmtNumero(n1 * n1)}` },
        { key: 'resta', label: 'Resta', operacion: 'b² = c² − a²', valor: fmtNumero(resta) },
        { key: 'raiz', label: 'Raíz cuadrada', operacion: `√${fmtNumero(resta)}`, valor: fmtNumero(b) },
      ],
    };
  }, [n1, n2, incognita, error1, error2]);

  const esTrio =
    calculo !== null && [calculo.a, calculo.b, calculo.c].every((x) => Math.abs(x - Math.round(x)) < 1e-9);

  const cambiarIncognita = (i: Incognita) => {
    setIncognita(i);
    setLado1('');
    setLado2('');
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    if (incognita === 'c') {
      setLado1('3');
      setLado2('4');
    } else {
      setLado1('5');
      setLado2('13');
    }
    setCalculado(false);
  };

  const limpiar = () => {
    setLado1('');
    setLado2('');
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
      resultado: fmtNumero(calculo.resultado),
      resumen: `a = ${fmtNumero(calculo.a)}, b = ${fmtNumero(calculo.b)}, c = ${fmtNumero(calculo.c)}`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const nombreIncognita = incognita === 'c' ? 'hipotenusa (c)' : 'cateto (b)';

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

          <Segmentado
            opciones={[
              { id: 'c', texto: 'Hipotenusa' },
              { id: 'cateto', texto: 'Cateto' },
            ]}
            valor={incognita}
            onCambiar={cambiarIncognita}
          />

          <AvisoInfo>
            Solo sirve para triángulos rectángulos. La hipotenusa (c) es el lado opuesto al ángulo
            recto y siempre es el lado más largo.
          </AvisoInfo>

          <Seccion
            titulo="Tu triángulo"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <TrianguloRectangulo resaltado={incognita === 'c' ? 'c' : 'b'} />

            <View style={styles.fila2}>
              <View style={styles.col}>
                <CampoNumero
                  label={incognita === 'c' ? 'Cateto a' : 'Cateto a (conocido)'}
                  value={lado1}
                  onChangeText={setLado1}
                  placeholder={incognita === 'c' ? 'Ej: 3' : 'Ej: 5'}
                  error={error1}
                  maxLength={10}
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label={incognita === 'c' ? 'Cateto b' : 'Hipotenusa c'}
                  value={lado2}
                  onChangeText={setLado2}
                  placeholder={incognita === 'c' ? 'Ej: 4' : 'Ej: 13'}
                  error={error2}
                  maxLength={10}
                />
              </View>
            </View>
          </Seccion>

          <BotonPrimario
            label={`Calcular ${incognita === 'c' ? 'hipotenusa' : 'cateto'}`}
            icono="triangle-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo={`La ${nombreIncognita} mide`}
              valor={fmtNumero(calculo.resultado)}
              tono={esTrio ? 'ok' : 'info'}
              badge={esTrio ? 'Trío pitagórico' : 'Resultado'}
              descripcion={
                esTrio
                  ? `${fmtNumero(calculo.a)}, ${fmtNumero(calculo.b)} y ${fmtNumero(calculo.c)} son enteros: es un trío pitagórico.`
                  : `Lados: a = ${fmtNumero(calculo.a)}, b = ${fmtNumero(calculo.b)}, c = ${fmtNumero(calculo.c)}`
              }
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  ...calculo.filas,
                  {
                    key: 'area',
                    label: 'Área del triángulo',
                    operacion: `(${fmtNumero(calculo.a)} × ${fmtNumero(calculo.b)}) ÷ 2`,
                    valor: fmtNumero((calculo.a * calculo.b) / 2),
                  },
                  {
                    key: 'perimetro',
                    label: 'Perímetro',
                    operacion: 'a + b + c',
                    valor: fmtNumero(calculo.a + calculo.b + calculo.c),
                  },
                ]}
                total={{ label: incognita === 'c' ? 'Hipotenusa c' : 'Cateto b', valor: fmtNumero(calculo.resultado) }}
                tonoTotal={esTrio ? 'ok' : 'info'}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Qué dice el teorema?"
            texto="En todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos. Para obtener un cateto, se despeja restando."
            formula="c² = a² + b²"
            tip="Memoriza los tríos más comunes: 3-4-5, 5-12-13, 8-15-17 y sus múltiplos (6-8-10, 9-12-15). En la PAES te ahorran el cálculo."
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

/** Triángulo rectángulo esquemático con el lado buscado resaltado. */
function TrianguloRectangulo({ resaltado }: { resaltado: 'b' | 'c' }) {
  const base = colors.textMuted;
  return (
    <View style={styles.dibujo}>
      <Svg width={220} height={130} viewBox="0 0 220 130">
        <Polygon points="30,110 190,110 30,20" fill="rgba(99,102,241,0.08)" />
        {/* cateto a (vertical) */}
        <Line x1={30} y1={110} x2={30} y2={20} stroke={base} strokeWidth={3} />
        {/* cateto b (horizontal) */}
        <Line x1={30} y1={110} x2={190} y2={110} stroke={resaltado === 'b' ? Acento.claro : base} strokeWidth={resaltado === 'b' ? 5 : 3} />
        {/* hipotenusa c */}
        <Line x1={30} y1={20} x2={190} y2={110} stroke={resaltado === 'c' ? Acento.claro : base} strokeWidth={resaltado === 'c' ? 5 : 3} />
        {/* ángulo recto */}
        <Rect x={30} y={96} width={14} height={14} fill="none" stroke={base} strokeWidth={1.5} />
        <SvgText x={14} y={70} fill={colors.text} fontSize={16} fontWeight="bold">a</SvgText>
        <SvgText x={104} y={127} fill={resaltado === 'b' ? Acento.claro : colors.text} fontSize={16} fontWeight="bold">b</SvgText>
        <SvgText x={118} y={56} fill={resaltado === 'c' ? Acento.claro : colors.text} fontSize={16} fontWeight="bold">c</SvgText>
      </Svg>
      <Text style={[styles.dibujoNota, { color: colors.textMuted }]}>
        Buscas el lado {resaltado} (resaltado)
      </Text>
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
  dibujo: {
    alignItems: 'center',
    gap: 4,
  },
  dibujoNota: {
    fontSize: 12,
    fontWeight: '600',
  },
});
