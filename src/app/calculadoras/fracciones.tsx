import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Segmentado, TECLADO_CON_SIGNO } from '@/components/calculadora/campos';
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
import { fmtNumero, leerEntero, mcd } from '@/lib/matematica';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'fracciones';
const colors = Colors.dark;

type Operacion = 'suma' | 'resta' | 'mult' | 'div';

const SIMBOLO: Record<Operacion, string> = { suma: '+', resta: '−', mult: '×', div: '÷' };

const EXPLICACION: Record<Operacion, { texto: string; formula: string }> = {
  suma: {
    texto: 'Para sumar se necesita un denominador común. Multiplicando en cruz se obtiene uno directamente; al final se simplifica.',
    formula: 'a/b + c/d = (a·d + c·b) / (b·d)',
  },
  resta: {
    texto: 'Igual que la suma: denominador común multiplicando en cruz, se restan los numeradores y se simplifica.',
    formula: 'a/b − c/d = (a·d − c·b) / (b·d)',
  },
  mult: {
    texto: 'Se multiplican numerador con numerador y denominador con denominador. No hace falta denominador común.',
    formula: 'a/b × c/d = (a·c) / (b·d)',
  },
  div: {
    texto: 'Se da vuelta la segunda fracción (su recíproco) y se multiplica.',
    formula: 'a/b ÷ c/d = (a·d) / (b·c)',
  },
};

type Fraccion = { num: string; den: string };

export default function FraccionesScreen() {
  const [f1, setF1] = useState<Fraccion>({ num: '', den: '' });
  const [f2, setF2] = useState<Fraccion>({ num: '', den: '' });
  const [op, setOp] = useState<Operacion>('suma');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Al abrir desde "Cálculos guardados": llena los campos y muestra el resultado
  useRestaurarEntrada<{ f1: Fraccion; f2: Fraccion; op: Operacion }>((d) => { setF1(d.f1); setF2(d.f2); setOp(d.op); setCalculado(true); });

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [f1, f2, op]);

  const a = leerEntero(f1.num);
  const b = leerEntero(f1.den);
  const c = leerEntero(f2.num);
  const d = leerEntero(f2.den);

  const error =
    b === 0 || d === 0 ? 'El denominador no puede ser 0.'
    : op === 'div' && c === 0 ? 'No se puede dividir por una fracción igual a 0.'
    : [f1.num, f1.den, f2.num, f2.den].some((t) => t.trim() !== '' && Number.isNaN(leerEntero(t)))
      ? 'Usa solo números enteros.'
      : null;

  const calculo = useMemo(() => {
    if (![a, b, c, d].every(Number.isFinite) || error) return null;

    let num: number;
    let den: number;
    const filas: FilaDetalle[] = [];

    if (op === 'suma' || op === 'resta') {
      const signo = op === 'suma' ? '+' : '−';
      num = op === 'suma' ? a * d + c * b : a * d - c * b;
      den = b * d;
      filas.push({ key: 'num', label: 'Numerador (en cruz)', operacion: `${a}·${d} ${signo} ${c}·${b}`, valor: String(num) });
      filas.push({ key: 'den', label: 'Denominador común', operacion: `${b}·${d}`, valor: String(den) });
    } else if (op === 'mult') {
      num = a * c;
      den = b * d;
      filas.push({ key: 'num', label: 'Numeradores', operacion: `${a}·${c}`, valor: String(num) });
      filas.push({ key: 'den', label: 'Denominadores', operacion: `${b}·${d}`, valor: String(den) });
    } else {
      num = a * d;
      den = b * c;
      filas.push({ key: 'rec', label: 'Recíproco de la 2ª fracción', operacion: `${c}/${d} → ${d}/${c}`, valor: `${d}/${c}` });
      filas.push({ key: 'num', label: 'Numerador', operacion: `${a}·${d}`, valor: String(num) });
      filas.push({ key: 'den', label: 'Denominador', operacion: `${b}·${c}`, valor: String(den) });
    }

    // Signo siempre en el numerador
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const divisor = mcd(num, den) || 1;
    const numS = num / divisor;
    const denS = den / divisor;

    if (divisor > 1) {
      filas.push({
        key: 'simp',
        label: `Simplificar (÷ ${divisor}, el MCD)`,
        operacion: `${num}/${den}`,
        valor: `${numS}/${denS}`,
      });
    }

    const decimal = numS / denS;
    const entero = Math.trunc(numS / denS);
    const resto = Math.abs(numS % denS);
    const mixto = denS !== 1 && Math.abs(numS) > denS ? `${entero} ${resto}/${denS}` : null;

    filas.push({ key: 'dec', label: 'En decimal', valor: fmtNumero(decimal) });
    if (mixto) filas.push({ key: 'mixto', label: 'Número mixto', valor: mixto });

    const texto = denS === 1 ? String(numS) : `${numS}/${denS}`;
    return { texto, filas, sinSimplificar: `${num}/${den}` };
  }, [a, b, c, d, op, error]);

  const cargarEjemplo = () => {
    setF1({ num: '3', den: '4' });
    setF2({ num: '5', den: '6' });
    setOp('suma');
    setCalculado(false);
  };

  const limpiar = () => {
    setF1({ num: '', den: '' });
    setF2({ num: '', den: '' });
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
      resultado: calculo.texto,
      resumen: `${a}/${b} ${SIMBOLO[op]} ${c}/${d}`,
      datos: { f1, f2, op },
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
          contentContainerStyle={[styles.scrollContent, ContenidoCentrado]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <AvisoInfo>
            Suma, resta, multiplica o divide dos fracciones. El resultado se entrega simplificado,
            en decimal y como número mixto.
          </AvisoInfo>

          <Seccion
            titulo="Tus fracciones"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <Segmentado
              label="Operación"
              opciones={(Object.keys(SIMBOLO) as Operacion[]).map((id) => ({ id, texto: SIMBOLO[id] }))}
              valor={op}
              onCambiar={setOp}
            />

            <View style={styles.operacionFila}>
              <EntradaFraccion valor={f1} onCambiar={setF1} />
              <View style={styles.simboloBox}>
                <Text style={styles.simbolo}>{SIMBOLO[op]}</Text>
              </View>
              <EntradaFraccion valor={f2} onCambiar={setF2} />
            </View>

            {error && <Text style={[styles.errorTexto, { color: colors.danger }]}>{error}</Text>}
          </Seccion>

          <BotonPrimario
            label="Calcular"
            icono="calculator-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Resultado"
              valor={calculo.texto}
              tono="info"
              badge={calculo.texto === calculo.sinSimplificar ? 'Irreducible' : 'Simplificada'}
              descripcion={`${a}/${b} ${SIMBOLO[op]} ${c}/${d} = ${calculo.texto}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={calculo.filas}
                total={{ label: 'Resultado', valor: calculo.texto }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo={`¿Cómo se ${op === 'suma' ? 'suman' : op === 'resta' ? 'restan' : op === 'mult' ? 'multiplican' : 'dividen'} fracciones?`}
            texto={EXPLICACION[op].texto}
            formula={EXPLICACION[op].formula}
            tip="En la PAES conviene simplificar antes de multiplicar: si un numerador y un denominador tienen un factor común, divídelos primero y trabajarás con números más chicos."
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

/** Fracción escrita "como en el cuaderno": numerador, línea, denominador. */
function EntradaFraccion({ valor, onCambiar }: { valor: Fraccion; onCambiar: (f: Fraccion) => void }) {
  const estilo = [styles.fraccionInput, { color: colors.text, borderColor: colors.border }];
  return (
    <View style={styles.fraccion}>
      <TextInput
        value={valor.num}
        onChangeText={(t) => onCambiar({ ...valor, num: t })}
        placeholder="a"
        placeholderTextColor={colors.textMuted}
        keyboardType={TECLADO_CON_SIGNO}
        maxLength={6}
        style={estilo}
      />
      <View style={[styles.rayaFraccion, { backgroundColor: colors.text }]} />
      <TextInput
        value={valor.den}
        onChangeText={(t) => onCambiar({ ...valor, den: t })}
        placeholder="b"
        placeholderTextColor={colors.textMuted}
        keyboardType={TECLADO_CON_SIGNO}
        maxLength={6}
        style={estilo}
      />
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
  operacionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fraccion: {
    flex: 1,
    gap: 8,
    alignItems: 'stretch',
  },
  fraccionInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  rayaFraccion: {
    height: 2,
    borderRadius: 1,
    marginHorizontal: 6,
  },
  simboloBox: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simbolo: {
    color: Acento.claro,
    fontSize: 22,
    fontWeight: '800',
  },
  errorTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
});
