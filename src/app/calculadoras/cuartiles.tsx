import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import { ListaDatos } from '@/components/calculadora/lista-datos';
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
import { ordenar, percentil, posicionPercentil } from '@/lib/estadistica';
import { fmtNumero, leerNumero } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'cuartiles';
const colors = Colors.dark;

export default function CuartilesScreen() {
  const [datos, setDatos] = useState<number[]>([]);
  const [p, setP] = useState('90');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [datos, p]);

  const nP = leerNumero(p);
  const errorP = p.trim() !== '' && !(nP >= 0 && nP <= 100) ? 'Entre 0 y 100' : null;

  const calculo = useMemo(() => {
    if (datos.length < 4) return null;
    const o = ordenar(datos);
    const n = o.length;
    const q1 = percentil(o, 25);
    const q2 = percentil(o, 50);
    const q3 = percentil(o, 75);
    const ric = q3 - q1;
    const limInf = q1 - 1.5 * ric;
    const limSup = q3 + 1.5 * ric;
    const atipicos = o.filter((x) => x < limInf || x > limSup);
    const dentro = o.filter((x) => x >= limInf && x <= limSup);
    return {
      o, n, q1, q2, q3, ric, limInf, limSup, atipicos,
      bigoteMin: dentro[0] ?? o[0],
      bigoteMax: dentro[dentro.length - 1] ?? o[n - 1],
      pPersonal: Number.isFinite(nP) && !errorP ? { p: nP, valor: percentil(o, nP) } : null,
    };
  }, [datos, nP, errorP]);

  const cargarEjemplo = () => {
    setDatos([3, 5, 7, 8, 9, 11, 12, 13, 15, 18, 30]);
    setCalculado(false);
  };

  const limpiar = () => {
    setDatos([]);
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
      resultado: `${fmtNumero(calculo.q1, 2)} · ${fmtNumero(calculo.q2, 2)} · ${fmtNumero(calculo.q3, 2)}`,
      resumen: `Q1 · Q2 · Q3 de ${calculo.n} datos · RIC ${fmtNumero(calculo.ric, 2)}`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const pos = (pp: number) => (calculo ? fmtNumero(posicionPercentil(calculo.n, pp), 2) : '');

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
            Los cuartiles dividen los datos ordenados en 4 partes iguales. Obtendrás Q1, Q2, Q3, el
            rango intercuartílico, datos atípicos y el diagrama de cajón.
          </AvisoInfo>

          <Seccion
            titulo="Tus datos"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <ListaDatos datos={datos} onCambiar={setDatos} minimo={4} />

            <View style={styles.grupo}>
              <CampoNumero
                label="Percentil adicional"
                value={p}
                onChangeText={setP}
                placeholder="90"
                error={errorP}
                maxLength={5}
              />
              <ChipsRapidos opciones={['10', '20', '80', '90']} valorActual={p} onElegir={setP} />
            </View>
          </Seccion>

          <BotonPrimario
            label="Calcular cuartiles"
            icono="podium-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Mediana (Q2)"
              valor={fmtNumero(calculo.q2, 2)}
              tono="info"
              badge={`RIC ${fmtNumero(calculo.ric, 2)}`}
              descripcion={`Q1 = ${fmtNumero(calculo.q1, 2)} · Q3 = ${fmtNumero(calculo.q3, 2)}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DiagramaCajon
                min={calculo.o[0]}
                max={calculo.o[calculo.n - 1]}
                bigoteMin={calculo.bigoteMin}
                bigoteMax={calculo.bigoteMax}
                q1={calculo.q1}
                q2={calculo.q2}
                q3={calculo.q3}
                atipicos={calculo.atipicos}
              />

              <DetalleCalculo
                filas={[
                  {
                    key: 'ord',
                    label: `Datos ordenados (n = ${calculo.n})`,
                    operacion: calculo.o.map((v) => fmtNumero(v)).join(' · '),
                    valor: '',
                  },
                  { key: 'q1', label: 'Q1 (percentil 25)', operacion: `Posición ${pos(25)}`, valor: fmtNumero(calculo.q1, 2) },
                  { key: 'q2', label: 'Q2 (mediana, P50)', operacion: `Posición ${pos(50)}`, valor: fmtNumero(calculo.q2, 2) },
                  { key: 'q3', label: 'Q3 (percentil 75)', operacion: `Posición ${pos(75)}`, valor: fmtNumero(calculo.q3, 2) },
                  {
                    key: 'ric',
                    label: 'Rango intercuartílico',
                    operacion: `Q3 − Q1 = ${fmtNumero(calculo.q3, 2)} − ${fmtNumero(calculo.q1, 2)}`,
                    valor: fmtNumero(calculo.ric, 2),
                  },
                  {
                    key: 'atip',
                    label: 'Datos atípicos',
                    operacion: `Fuera de [${fmtNumero(calculo.limInf, 2)} ; ${fmtNumero(calculo.limSup, 2)}] (1,5 × RIC)`,
                    valor: calculo.atipicos.length ? calculo.atipicos.map((v) => fmtNumero(v)).join(', ') : 'Ninguno',
                    tono: calculo.atipicos.length ? ('warning' as const) : undefined,
                  },
                  ...(calculo.pPersonal
                    ? [
                        {
                          key: 'pp',
                          label: `Percentil ${fmtNumero(calculo.pPersonal.p)}`,
                          operacion: `Posición ${pos(calculo.pPersonal.p)}`,
                          valor: fmtNumero(calculo.pPersonal.valor, 2),
                        },
                      ]
                    : []),
                ]}
                total={{
                  label: 'Q1 · Q2 · Q3',
                  valor: `${fmtNumero(calculo.q1, 2)} · ${fmtNumero(calculo.q2, 2)} · ${fmtNumero(calculo.q3, 2)}`,
                }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calculan?"
            texto="Se ordenan los datos y se busca la posición del percentil: (n − 1) × p + 1. Si la posición cae entre dos datos, se interpola entre ellos. El 50% central de los datos queda dentro de la caja (entre Q1 y Q3)."
            formula="Posición de Pₖ = (n − 1) · k/100 + 1"
            tip="Existen varios métodos para calcular cuartiles y dan resultados un poco distintos. En la PAES lee bien el enunciado: a veces indican cómo calcularlos."
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

/** Diagrama de cajón (boxplot) horizontal. */
function DiagramaCajon({
  min, max, bigoteMin, bigoteMax, q1, q2, q3, atipicos,
}: {
  min: number; max: number; bigoteMin: number; bigoteMax: number;
  q1: number; q2: number; q3: number; atipicos: number[];
}) {
  const ancho = 300;
  const margen = 18;
  const rango = max - min || 1;
  const x = (v: number) => margen + ((v - min) / rango) * (ancho - 2 * margen);
  const yCentro = 40;
  const alto = 34;
  const linea = colors.textMuted;

  return (
    <View style={styles.diagrama}>
      <Svg width="100%" height={92} viewBox={`0 0 ${ancho} 92`}>
        {/* bigotes */}
        <Line x1={x(bigoteMin)} y1={yCentro} x2={x(q1)} y2={yCentro} stroke={linea} strokeWidth={2} />
        <Line x1={x(q3)} y1={yCentro} x2={x(bigoteMax)} y2={yCentro} stroke={linea} strokeWidth={2} />
        <Line x1={x(bigoteMin)} y1={yCentro - 10} x2={x(bigoteMin)} y2={yCentro + 10} stroke={linea} strokeWidth={2} />
        <Line x1={x(bigoteMax)} y1={yCentro - 10} x2={x(bigoteMax)} y2={yCentro + 10} stroke={linea} strokeWidth={2} />
        {/* caja */}
        <Rect
          x={x(q1)}
          y={yCentro - alto / 2}
          width={Math.max(x(q3) - x(q1), 2)}
          height={alto}
          rx={6}
          fill="rgba(99,102,241,0.22)"
          stroke={Acento.claro}
          strokeWidth={2}
        />
        {/* mediana */}
        <Line x1={x(q2)} y1={yCentro - alto / 2} x2={x(q2)} y2={yCentro + alto / 2} stroke="#ffffff" strokeWidth={3} />
        {/* atípicos */}
        {atipicos.map((v, i) => (
          <Circle key={`${i}-${v}`} cx={x(v)} cy={yCentro} r={4} fill="none" stroke="#fbbf24" strokeWidth={2} />
        ))}
        {/* etiquetas */}
        {[
          { v: q1, t: 'Q1' },
          { v: q2, t: 'Q2' },
          { v: q3, t: 'Q3' },
        ].map(({ v, t }) => (
          <SvgText key={t} x={x(v)} y={yCentro + alto / 2 + 16} fill={colors.textSecondary} fontSize={11} fontWeight="bold" textAnchor="middle">
            {t}
          </SvgText>
        ))}
        <SvgText x={x(min)} y={86} fill={colors.textMuted} fontSize={10} textAnchor="start">
          {fmtNumero(min)}
        </SvgText>
        <SvgText x={x(max)} y={86} fill={colors.textMuted} fontSize={10} textAnchor="end">
          {fmtNumero(max)}
        </SvgText>
      </Svg>
      {atipicos.length > 0 && (
        <Text style={[styles.diagramaNota, { color: '#fbbf24' }]}>○ dato atípico</Text>
      )}
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
  diagrama: {
    gap: 2,
  },
  diagramaNota: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
});
