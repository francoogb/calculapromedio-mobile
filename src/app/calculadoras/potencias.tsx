import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { DetalleCalculo, TarjetaResultado, type FilaDetalle } from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { fmtNumero, leerEntero, leerNumero, superindice } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'potencias';
const colors = Colors.dark;

type Modo = 'simple' | 'mult' | 'div' | 'pot';

const MODOS: Record<Modo, { tab: string; aviso: string; propiedad: string; ejemplo: [string, string, string] }> = {
  simple: {
    tab: 'aⁿ',
    aviso: 'Calcula una potencia: la base multiplicada por sí misma tantas veces como indica el exponente.',
    propiedad: 'aⁿ = a × a × … × a (n veces)',
    ejemplo: ['2', '5', ''],
  },
  mult: {
    tab: 'aᵐ · aⁿ',
    aviso: 'Multiplicación de potencias de igual base: se conserva la base y se suman los exponentes.',
    propiedad: 'aᵐ · aⁿ = aᵐ⁺ⁿ',
    ejemplo: ['3', '2', '4'],
  },
  div: {
    tab: 'aᵐ ÷ aⁿ',
    aviso: 'División de potencias de igual base: se conserva la base y se restan los exponentes.',
    propiedad: 'aᵐ ÷ aⁿ = aᵐ⁻ⁿ',
    ejemplo: ['2', '3', '5'],
  },
  pot: {
    tab: '(aᵐ)ⁿ',
    aviso: 'Potencia de una potencia: se conserva la base y se multiplican los exponentes.',
    propiedad: '(aᵐ)ⁿ = aᵐ·ⁿ',
    ejemplo: ['2', '3', '2'],
  },
};

const ORDEN: Modo[] = ['simple', 'mult', 'div', 'pot'];

/** Base entre paréntesis si es negativa o decimal: (−2)³ */
function baseTexto(a: number): string {
  const t = fmtNumero(a);
  return a < 0 || !Number.isInteger(a) ? `(${t})` : t;
}

export default function PotenciasScreen() {
  const [modo, setModo] = useState<Modo>('simple');
  const [base, setBase] = useState('');
  const [exp1, setExp1] = useState('');
  const [exp2, setExp2] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  const config = MODOS[modo];
  const usaExp2 = modo !== 'simple';

  useEffect(() => {
    setGuardado(false);
  }, [modo, base, exp1, exp2]);

  const a = leerNumero(base);
  const m = leerEntero(exp1);
  const n = leerEntero(exp2);

  const errorExp = (txt: string, v: number) =>
    txt.trim() !== '' && Number.isNaN(v) ? 'Debe ser un número entero' : null;
  const errorExp1 = errorExp(exp1, m);
  const errorExp2 = usaExp2 ? errorExp(exp2, n) : null;

  const calculo = useMemo(() => {
    if (!Number.isFinite(a) || !Number.isFinite(m) || (usaExp2 && !Number.isFinite(n))) return null;
    if (errorExp1 || errorExp2) return null;

    const b = baseTexto(a);
    let expFinal: number;
    let expresion: string;
    const filas: FilaDetalle[] = [];

    if (modo === 'simple') {
      expFinal = m;
      expresion = `${b}${superindice(m)}`;
    } else if (modo === 'mult') {
      expFinal = m + n;
      expresion = `${b}${superindice(m)} · ${b}${superindice(n)}`;
      filas.push({ key: 'prop', label: 'Se suman los exponentes', operacion: `${m} + ${n}`, valor: `${b}${superindice(expFinal)}` });
    } else if (modo === 'div') {
      expFinal = m - n;
      expresion = `${b}${superindice(m)} ÷ ${b}${superindice(n)}`;
      filas.push({ key: 'prop', label: 'Se restan los exponentes', operacion: `${m} − ${n}`, valor: `${b}${superindice(expFinal)}` });
    } else {
      expFinal = m * n;
      expresion = `(${b}${superindice(m)})${superindice(n)}`;
      filas.push({ key: 'prop', label: 'Se multiplican los exponentes', operacion: `${m} · ${n}`, valor: `${b}${superindice(expFinal)}` });
    }

    if (a === 0 && expFinal <= 0) {
      return { error: expFinal === 0 ? '0⁰ no está definido.' : 'No se puede dividir por 0 (base 0 con exponente negativo).' };
    }

    const valor = Math.pow(a, expFinal);

    // Desarrollo para exponentes chicos
    if (expFinal >= 2 && expFinal <= 6) {
      filas.push({
        key: 'desarrollo',
        label: 'Desarrollo',
        operacion: Array(expFinal).fill(b).join(' × '),
        valor: fmtNumero(valor),
      });
    }
    if (expFinal === 0) {
      filas.push({ key: 'cero', label: 'Todo número (≠ 0) elevado a 0 es 1', valor: '1' });
    }
    if (expFinal < 0) {
      const positivo = Math.pow(a, -expFinal);
      filas.push({
        key: 'negativo',
        label: 'Exponente negativo: se invierte la base',
        operacion: `${b}${superindice(expFinal)} = 1 ÷ ${b}${superindice(-expFinal)}`,
        valor: Number.isInteger(positivo) && Math.abs(positivo) < 1e12 ? `1/${fmtNumero(positivo)}` : fmtNumero(valor),
      });
    }

    const signoNota =
      a < 0 && Number.isInteger(expFinal) && expFinal !== 0
        ? expFinal % 2 === 0
          ? 'Base negativa con exponente par: resultado positivo.'
          : 'Base negativa con exponente impar: resultado negativo.'
        : null;

    return { expresion, expFinal, valor, filas, signoNota, b };
  }, [a, m, n, modo, usaExp2, errorExp1, errorExp2]);

  const valido = calculo !== null && !('error' in calculo);

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    const [ea, e1, e2] = config.ejemplo;
    setBase(ea);
    setExp1(e1);
    setExp2(e2);
    setCalculado(false);
  };

  const limpiar = () => {
    setBase('');
    setExp1('');
    setExp2('');
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
    if (!calculo || 'error' in calculo) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: fmtNumero(calculo.valor),
      resumen: calculo.expresion,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && valido;

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

          <Segmentado opciones={ORDEN.map((id) => ({ id, texto: MODOS[id].tab }))} valor={modo} onCambiar={cambiarModo} />

          <AvisoInfo>{config.aviso}</AvisoInfo>

          <Seccion
            titulo="Tu potencia"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={[styles.vistaPrevia, { borderColor: Acento.borde, backgroundColor: Acento.fondo }]}>
              <Text style={styles.vistaPreviaTexto} numberOfLines={1} adjustsFontSizeToFit>
                {calculo && !('error' in calculo) ? calculo.expresion : config.propiedad.split(' = ')[0]}
              </Text>
            </View>

            <View style={styles.fila}>
              <View style={styles.col}>
                <CampoNumero label="Base (a)" value={base} onChangeText={setBase} placeholder="2" permiteNegativo maxLength={8} />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label={usaExp2 ? 'Exponente m' : 'Exponente n'}
                  value={exp1}
                  onChangeText={setExp1}
                  placeholder="3"
                  error={errorExp1}
                  permiteNegativo
                  maxLength={4}
                />
              </View>
              {usaExp2 && (
                <View style={styles.col}>
                  <CampoNumero
                    label="Exponente n"
                    value={exp2}
                    onChangeText={setExp2}
                    placeholder="4"
                    error={errorExp2}
                    permiteNegativo
                    maxLength={4}
                  />
                </View>
              )}
            </View>

            {calculo && 'error' in calculo && (
              <Text style={[styles.errorTexto, { color: colors.danger }]}>{calculo.error}</Text>
            )}
          </Seccion>

          <BotonPrimario label="Calcular" icono="calculator-outline" onPress={calcular} deshabilitado={!valido} />

          {mostrarResultado && calculo && !('error' in calculo) && (
            <TarjetaResultado
              titulo={`${calculo.expresion} =`}
              valor={fmtNumero(calculo.valor)}
              tono="info"
              badge={`${calculo.b}${superindice(calculo.expFinal)}`}
              descripcion={calculo.signoNota ?? `Propiedad: ${config.propiedad}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={calculo.filas}
                total={{ label: 'Resultado', valor: fmtNumero(calculo.valor) }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="Propiedades de las potencias"
            texto="Estas propiedades solo funcionan cuando las bases son iguales. Si las bases son distintas, primero hay que calcular cada potencia por separado."
            formula={config.propiedad}
            tip="Ojo con el signo: −2² = −4 (la potencia afecta solo al 2), pero (−2)² = 4. En la PAES esta trampa aparece seguido."
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
    fontSize: 26,
    fontWeight: '800',
  },
  fila: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  errorTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
