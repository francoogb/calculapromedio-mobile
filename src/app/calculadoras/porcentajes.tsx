import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { CampoNumero, ChipsRapidos, Segmentado } from '@/components/calculadora/campos';
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
  type FilaDetalle,
  type Tono,
} from '@/components/calculadora/resultado';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'porcentajes';
const colors = Colors.dark;

type Modo = 'porcentaje-de' | 'que-porcentaje' | 'variacion';

type ConfigModo = {
  tab: string;
  aviso: string;
  labelA: string;
  labelB: string;
  placeholderA: string;
  placeholderB: string;
  sufijoA?: string;
  chipsA?: string[];
  ejemplo: [string, string];
  formula: string;
  texto: string;
};

const MODOS: Record<Modo, ConfigModo> = {
  'porcentaje-de': {
    tab: 'X% de',
    aviso: '¿Cuánto es el X% de un número? Útil para descuentos, propinas o puntajes.',
    labelA: 'Porcentaje',
    labelB: 'Número base',
    placeholderA: 'Ej: 20',
    placeholderB: 'Ej: 150',
    sufijoA: '%',
    chipsA: ['10', '20', '25', '50'],
    ejemplo: ['20', '15000'],
    formula: 'Resultado = (Porcentaje ÷ 100) × Base',
    texto: 'El porcentaje se pasa a decimal dividiéndolo por 100 y luego se multiplica por la base.',
  },
  'que-porcentaje': {
    tab: '¿Qué %?',
    aviso: '¿Qué porcentaje representa una parte del total? Ej: 30 respuestas buenas de 45.',
    labelA: 'Parte',
    labelB: 'Total',
    placeholderA: 'Ej: 30',
    placeholderB: 'Ej: 45',
    ejemplo: ['30', '45'],
    formula: 'Porcentaje = (Parte ÷ Total) × 100',
    texto: 'Se divide la parte por el total para obtener la fracción, y se multiplica por 100.',
  },
  variacion: {
    tab: 'Variación',
    aviso: '¿Cuánto subió o bajó un valor en porcentaje? Ej: un precio que pasó de 10.000 a 8.500.',
    labelA: 'Valor inicial',
    labelB: 'Valor final',
    placeholderA: 'Ej: 10000',
    placeholderB: 'Ej: 8500',
    ejemplo: ['10000', '8500'],
    formula: 'Variación = ((Final − Inicial) ÷ Inicial) × 100',
    texto: 'Se calcula la diferencia y se compara con el valor inicial, no con el final.',
  },
};

const ORDEN: Modo[] = ['porcentaje-de', 'que-porcentaje', 'variacion'];

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

// 30.00 → "30", 12.5 → "12,5", 15000 → "15.000"
function fmt(n: number, decimales = 2): string {
  return parseFloat(n.toFixed(decimales)).toLocaleString('es-CL');
}

type Resultado = {
  valor: string;
  tono: Tono;
  badge: string;
  descripcion: string;
  filas: FilaDetalle[];
  total: { label: string; valor: string };
};

export default function PorcentajesScreen() {
  const [modo, setModo] = useState<Modo>('porcentaje-de');
  const [valorA, setValorA] = useState('');
  const [valorB, setValorB] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  // Si se abrió desde "Cálculos guardados": llena los campos y muestra el resultado
  useRestaurarEntrada<{ modo: Modo; valorA: string; valorB: string }>((datos) => {
    setModo(datos.modo);
    setValorA(datos.valorA);
    setValorB(datos.valorB);
    setCalculado(true);
  });

  const config = MODOS[modo];

  useEffect(() => {
    setGuardado(false);
  }, [modo, valorA, valorB]);

  const errorB =
    valorB.trim() !== '' && aNumero(valorB) === 0 && modo === 'que-porcentaje'
      ? 'El total no puede ser 0'
      : null;
  const errorA =
    valorA.trim() !== '' && aNumero(valorA) === 0 && modo === 'variacion'
      ? 'El valor inicial no puede ser 0'
      : null;

  const resultado = useMemo((): Resultado | null => {
    const a = aNumero(valorA);
    const b = aNumero(valorB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || errorA || errorB) return null;

    if (modo === 'porcentaje-de') {
      const decimal = a / 100;
      const r = decimal * b;
      return {
        valor: fmt(r),
        tono: 'info',
        badge: 'Resultado',
        descripcion: `El ${fmt(a)}% de ${fmt(b)} es ${fmt(r)}`,
        filas: [
          { key: 'dec', label: 'Porcentaje a decimal', operacion: `${fmt(a)} ÷ 100`, valor: fmt(decimal, 4) },
          { key: 'mult', label: 'Multiplicado por la base', operacion: `${fmt(decimal, 4)} × ${fmt(b)}`, valor: fmt(r) },
          { key: 'desc', label: `Con ${fmt(a)}% de descuento`, operacion: `${fmt(b)} − ${fmt(r)}`, valor: fmt(b - r) },
          { key: 'aum', label: `Con ${fmt(a)}% de aumento`, operacion: `${fmt(b)} + ${fmt(r)}`, valor: fmt(b + r) },
        ],
        total: { label: `${fmt(a)}% de ${fmt(b)}`, valor: fmt(r) },
      };
    }

    if (modo === 'que-porcentaje') {
      const fraccion = a / b;
      const r = fraccion * 100;
      return {
        valor: `${fmt(r)}%`,
        tono: 'info',
        badge: 'Resultado',
        descripcion: `${fmt(a)} es el ${fmt(r)}% de ${fmt(b)}`,
        filas: [
          { key: 'div', label: 'Parte dividida por el total', operacion: `${fmt(a)} ÷ ${fmt(b)}`, valor: fmt(fraccion, 4) },
          { key: 'mult', label: 'Multiplicado por 100', operacion: `${fmt(fraccion, 4)} × 100`, valor: `${fmt(r)}%` },
        ],
        total: { label: 'Porcentaje', valor: `${fmt(r)}%` },
      };
    }

    const diferencia = b - a;
    const fraccion = diferencia / a;
    const r = fraccion * 100;
    const sube = r > 0;
    const igual = Math.abs(r) < 0.005;
    const valor = igual ? '0%' : `${sube ? '+' : ''}${fmt(r)}%`;
    return {
      valor,
      tono: igual ? 'info' : sube ? 'ok' : 'error',
      badge: igual ? 'Sin cambio' : sube ? 'Aumento' : 'Disminución',
      descripcion: igual
        ? 'El valor no cambió.'
        : sube
        ? `Subió ${fmt(diferencia)} respecto al valor inicial.`
        : `Bajó ${fmt(Math.abs(diferencia))} respecto al valor inicial.`,
      filas: [
        { key: 'dif', label: 'Diferencia', operacion: `${fmt(b)} − ${fmt(a)}`, valor: fmt(diferencia) },
        { key: 'div', label: 'Dividida por el valor inicial', operacion: `${fmt(diferencia)} ÷ ${fmt(a)}`, valor: fmt(fraccion, 4) },
        { key: 'mult', label: 'Multiplicado por 100', operacion: `${fmt(fraccion, 4)} × 100`, valor },
      ],
      total: { label: 'Variación porcentual', valor },
    };
  }, [modo, valorA, valorB, errorA, errorB]);

  const cambiarModo = (m: Modo) => {
    setModo(m);
    setValorA('');
    setValorB('');
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    setValorA(config.ejemplo[0]);
    setValorB(config.ejemplo[1]);
    setCalculado(false);
  };

  const limpiar = () => {
    setValorA('');
    setValorB('');
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
    if (!resultado) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: resultado.valor,
      resumen: resultado.descripcion.replace(/\.$/, ''),
      datos: { modo, valorA, valorB },
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && resultado !== null;

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
            opciones={ORDEN.map((id) => ({ id, texto: MODOS[id].tab }))}
            valor={modo}
            onCambiar={cambiarModo}
          />

          <AvisoInfo>{config.aviso}</AvisoInfo>

          <Seccion
            titulo="Tus datos"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.grupo}>
              <CampoNumero
                label={config.labelA}
                value={valorA}
                onChangeText={setValorA}
                placeholder={config.placeholderA}
                sufijo={config.sufijoA}
                error={errorA}
                maxLength={12}
              />
              {config.chipsA && (
                <ChipsRapidos opciones={config.chipsA} valorActual={valorA} onElegir={setValorA} />
              )}
            </View>

            <CampoNumero
              label={config.labelB}
              value={valorB}
              onChangeText={setValorB}
              placeholder={config.placeholderB}
              error={errorB}
              maxLength={12}
            />
          </Seccion>

          <BotonPrimario
            label="Calcular"
            icono="pie-chart-outline"
            onPress={calcular}
            deshabilitado={resultado === null}
          />

          {mostrarResultado && resultado && (
            <TarjetaResultado
              titulo="Resultado"
              valor={resultado.valor}
              tono={resultado.tono}
              badge={resultado.badge}
              descripcion={resultado.descripcion}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={resultado.filas}
                total={resultado.total}
                tonoTotal={resultado.tono}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula?"
            texto={config.texto}
            formula={config.formula}
            tip="Un descuento del 20% seguido de un aumento del 20% no te devuelve al valor original: 100 → 80 → 96. Cada porcentaje se aplica sobre el valor que hay en ese momento."
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
  grupo: {
    gap: 10,
  },
});
