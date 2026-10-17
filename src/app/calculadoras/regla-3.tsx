import Ionicons from '@expo/vector-icons/Ionicons';
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
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'regla-3';
const colors = Colors.dark;

// Medidas compartidas para alinear las dos filas de la proporción
const ANCHO_CONECTOR = 44;
const ALTO_INPUT = 52;
const GAP = 10;

type Tipo = 'directa' | 'inversa';

const TIPOS: Record<Tipo, { aviso: string; ejemplo: [string, string, string]; formula: string; tip: string }> = {
  directa: {
    aviso: 'Directa: si una magnitud aumenta, la otra también. Ej: más kilos, más precio.',
    ejemplo: ['3', '6000', '5'],
    formula: 'X = (B × C) ÷ A',
    tip: 'Si 3 kg cuestan $6.000, 5 kg cuestan (6.000 × 5) ÷ 3 = $10.000.',
  },
  inversa: {
    aviso: 'Inversa: si una magnitud aumenta, la otra disminuye. Ej: más trabajadores, menos días.',
    ejemplo: ['4', '6', '8'],
    formula: 'X = (A × B) ÷ C',
    tip: 'Si 4 obreros tardan 6 días, 8 obreros tardan (4 × 6) ÷ 8 = 3 días.',
  },
};

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

// 10000 → "10.000", 2.5 → "2,5"
function fmt(n: number): string {
  return parseFloat(n.toFixed(2)).toLocaleString('es-CL');
}

export default function ReglaDeTresScreen() {
  const [tipo, setTipo] = useState<Tipo>('directa');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  // Si se abrió desde "Cálculos guardados": llena los campos y muestra el resultado
  useRestaurarEntrada<{ tipo: Tipo; a: string; b: string; c: string }>((datos) => {
    setTipo(datos.tipo);
    setA(datos.a);
    setB(datos.b);
    setC(datos.c);
    setCalculado(true);
  });

  const config = TIPOS[tipo];

  useEffect(() => {
    setGuardado(false);
  }, [tipo, a, b, c]);

  // El divisor no puede ser 0: A en directa, C en inversa
  const errorA = tipo === 'directa' && a.trim() !== '' && aNumero(a) === 0;
  const errorC = tipo === 'inversa' && c.trim() !== '' && aNumero(c) === 0;

  const calculo = useMemo(() => {
    const na = aNumero(a);
    const nb = aNumero(b);
    const nc = aNumero(c);
    if (![na, nb, nc].every(Number.isFinite) || errorA || errorC) return null;

    if (tipo === 'directa') {
      const producto = nb * nc;
      return { na, nb, nc, producto, divisor: na, x: producto / na, opProducto: `${fmt(nb)} × ${fmt(nc)}` };
    }
    const producto = na * nb;
    return { na, nb, nc, producto, divisor: nc, x: producto / nc, opProducto: `${fmt(na)} × ${fmt(nb)}` };
  }, [tipo, a, b, c, errorA, errorC]);

  const cambiarTipo = (t: Tipo) => {
    setTipo(t);
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    const [ea, eb, ec] = config.ejemplo;
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
      resultado: fmt(calculo.x),
      resumen: `${tipo === 'directa' ? 'Directa' : 'Inversa'} · ${fmt(calculo.na)} → ${fmt(calculo.nb)}, ${fmt(calculo.nc)} → X`,
      datos: { tipo, a, b, c },
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const xVisible = mostrarResultado && calculo ? fmt(calculo.x) : null;

  const inputStyle = (error: boolean) => [
    styles.input,
    styles.inputValor,
    { color: colors.text, borderColor: error ? colors.danger : colors.border },
  ];

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

          <Segmentado
            opciones={[
              { id: 'directa', texto: 'Directa' },
              { id: 'inversa', texto: 'Inversa' },
            ]}
            valor={tipo}
            onCambiar={cambiarTipo}
          />

          <AvisoInfo>{config.aviso}</AvisoInfo>

          <Seccion
            titulo="Tu proporción"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.encabezados}>
              <Text style={[styles.encabezado, styles.colValor, { color: colors.textMuted }]}>
                MAGNITUD 1
              </Text>
              <View style={styles.colFlecha} />
              <Text style={[styles.encabezado, styles.colValor, { color: colors.textMuted }]}>
                MAGNITUD 2
              </Text>
            </View>

            {/* Fila 1: A → B */}
            <View style={styles.fila}>
              <View style={styles.conector}>
                <Text style={styles.conectorTexto}>Si</Text>
              </View>
              <TextInput
                value={a}
                onChangeText={setA}
                placeholder="A"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                maxLength={12}
                style={inputStyle(errorA)}
              />
              <Ionicons name="arrow-forward" size={18} color={colors.textMuted} style={styles.colFlecha} />
              <TextInput
                value={b}
                onChangeText={setB}
                placeholder="B"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                maxLength={12}
                style={inputStyle(false)}
              />
            </View>

            {/* Fila 2: C → X */}
            <View style={styles.fila}>
              <View style={styles.conector}>
                <Text style={styles.conectorTexto}>Con</Text>
              </View>
              <TextInput
                value={c}
                onChangeText={setC}
                placeholder="C"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                maxLength={12}
                style={inputStyle(errorC)}
              />
              <Ionicons name="arrow-forward" size={18} color={colors.textMuted} style={styles.colFlecha} />
              <View
                style={[
                  styles.input,
                  styles.colValor,
                  styles.xBox,
                  xVisible
                    ? { backgroundColor: Acento.base, borderColor: Acento.base }
                    : { borderColor: Acento.borde, backgroundColor: Acento.fondo },
                ]}>
                <Text
                  style={[styles.xTexto, { color: xVisible ? '#ffffff' : Acento.claro }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {xVisible ?? 'X'}
                </Text>
              </View>
            </View>

            {(errorA || errorC) && (
              <Text style={[styles.errorTexto, { color: colors.danger }]}>
                {errorA ? 'A no puede ser 0 (es el divisor).' : 'C no puede ser 0 (es el divisor).'}
              </Text>
            )}
          </Seccion>

          <BotonPrimario
            label="Calcular X"
            icono="swap-horizontal"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="El valor de X es"
              valor={fmt(calculo.x)}
              tono="info"
              badge={tipo === 'directa' ? 'Directa' : 'Inversa'}
              descripcion={`Si ${fmt(calculo.na)} → ${fmt(calculo.nb)}, entonces ${fmt(calculo.nc)} → ${fmt(calculo.x)}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  {
                    key: 'producto',
                    label: tipo === 'directa' ? 'Multiplicar en cruz (B × C)' : 'Multiplicar en línea (A × B)',
                    operacion: calculo.opProducto,
                    valor: fmt(calculo.producto),
                  },
                  {
                    key: 'division',
                    label: tipo === 'directa' ? 'Dividir por A' : 'Dividir por C',
                    operacion: `${fmt(calculo.producto)} ÷ ${fmt(calculo.divisor)}`,
                    valor: fmt(calculo.x),
                  },
                ]}
                total={{ label: 'X', valor: fmt(calculo.x) }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Directa o inversa?"
            texto="Pregúntate: si duplico una magnitud, ¿la otra se duplica (directa) o se reduce a la mitad (inversa)? Esa pregunta define qué fórmula usar."
            formula={config.formula}
            tip={config.tip}
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
    paddingLeft: ANCHO_CONECTOR + GAP,
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
  colFlecha: {
    width: 18,
    textAlign: 'center',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  conector: {
    width: ANCHO_CONECTOR,
    height: ALTO_INPUT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conectorTexto: {
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
  inputValor: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  xBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  xTexto: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorTexto: {
    marginLeft: ANCHO_CONECTOR + GAP,
    fontSize: 12,
    fontWeight: '600',
  },
});
