import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { CampoNumero } from '@/components/calculadora/campos';
import { Columna, FilaCampos, PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado, type FilaDetalle } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'funcion-lineal';
const colors = Colors.dark;
const f = (n: number) => fmtNumero(n, 4);
const COLOR_F2 = '#5eead4';

function expresion(m: number, b: number, nombre: string): string {
  const mTxt = m === 1 ? '' : m === -1 ? '−' : f(m);
  const bTxt = b === 0 ? '' : b > 0 ? ` + ${f(b)}` : ` − ${f(Math.abs(b))}`;
  return `${nombre}(x) = ${m === 0 ? f(b) : `${mTxt}x${bTxt}`}`;
}

export default function FuncionLinealScreen() {
  const [m1, setM1] = useState('');
  const [b1, setB1] = useState('');
  const [m2, setM2] = useState('');
  const [b2, setB2] = useState('');
  const p = usePantallaCalculo(CALC_ID, [m1, b1, m2, b2]);

  const v = { m1: leerNumero(m1), b1: leerNumero(b1), m2: leerNumero(m2), b2: leerNumero(b2) };
  const tieneF2 = m2.trim() !== '' || b2.trim() !== '';

  const calculo = useMemo(() => {
    if (!Number.isFinite(v.m1) || !Number.isFinite(v.b1)) return null;
    if (tieneF2 && (!Number.isFinite(v.m2) || !Number.isFinite(v.b2))) return null;

    const filas: FilaDetalle[] = [
      {
        key: 'pend',
        label: 'Pendiente de f',
        operacion: v.m1 > 0 ? 'Creciente: sube al avanzar x' : v.m1 < 0 ? 'Decreciente: baja al avanzar x' : 'Constante',
        valor: f(v.m1),
      },
      { key: 'coefy', label: 'Corte con eje Y de f', operacion: 'x = 0', valor: `(0, ${f(v.b1)})` },
    ];
    if (v.m1 !== 0) {
      filas.push({ key: 'cerox', label: 'Corte con eje X de f', operacion: `x = −${f(v.b1)} ÷ ${f(v.m1)}`, valor: `(${f(-v.b1 / v.m1)}, 0)` });
    }

    let interseccion: { x: number; y: number } | null = null;
    let estado: 'una' | 'paralelas' | 'iguales' | null = null;
    if (tieneF2) {
      if (v.m1 === v.m2) {
        estado = v.b1 === v.b2 ? 'iguales' : 'paralelas';
      } else {
        const x = (v.b2 - v.b1) / (v.m1 - v.m2);
        interseccion = { x, y: v.m1 * x + v.b1 };
        estado = 'una';
        filas.push({
          key: 'ix',
          label: 'Igualar f(x) = g(x)',
          operacion: `x = (${f(v.b2)} − ${f(v.b1)}) ÷ (${f(v.m1)} − ${f(v.m2)})`,
          valor: f(x),
        });
        filas.push({ key: 'iy', label: 'Reemplazar en f', operacion: `${f(v.m1)}·${f(x)} + ${f(v.b1)}`, valor: f(interseccion.y) });
      }
    }
    return { filas, interseccion, estado };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m1, b1, m2, b2]);

  const ejemplo = () => {
    // Plan A: $5.000 fijo + $100 por minuto · Plan B: $2.000 fijo + $250 por minuto
    setM1('100');
    setB1('5000');
    setM2('250');
    setB2('2000');
    p.setCalculado(false);
  };

  let titulo = 'Tu función';
  let valor = calculo ? expresion(v.m1, v.b1, 'f') : '';
  let descripcion = '';
  if (calculo?.estado === 'una' && calculo.interseccion) {
    titulo = 'Las rectas se cortan en';
    valor = `(${fmtNumero(calculo.interseccion.x, 2)}, ${fmtNumero(calculo.interseccion.y, 2)})`;
    const menorAntes = v.m1 > v.m2 ? 'f' : 'g';
    descripcion = `Antes de x = ${fmtNumero(calculo.interseccion.x, 2)} conviene ${menorAntes} (es menor); después conviene la otra.`;
  } else if (calculo?.estado === 'paralelas') {
    titulo = 'Las rectas';
    valor = 'No se cortan';
    descripcion = 'Tienen la misma pendiente: son paralelas.';
  } else if (calculo?.estado === 'iguales') {
    titulo = 'Las rectas';
    valor = 'Son la misma';
    descripcion = 'Misma pendiente y mismo coeficiente de posición.';
  } else if (calculo) {
    descripcion = v.m1 !== 0 ? `Por cada unidad que aumenta x, y cambia en ${f(v.m1)}.` : 'Función constante.';
  }

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setM1('');
        setB1('');
        setM2('');
        setB2('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(valor, tieneF2 ? `${expresion(v.m1, v.b1, 'f')} y ${expresion(v.m2, v.b2, 'g')}` : 'Función lineal')}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Una función lineal tiene la forma y = mx + b. m es la pendiente (cuánto sube por cada unidad)
        y b el valor inicial. Agrega una segunda función para compararlas.
      </AvisoInfo>

      <Seccion titulo="Funciones" accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={ejemplo} />}>
        <Text style={[styles.etiqueta, { color: Acento.claro }]}>f(x) = m·x + b</Text>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Pendiente m" value={m1} onChangeText={setM1} placeholder="100" permiteNegativo maxLength={9} />
          </Columna>
          <Columna>
            <CampoNumero label="Valor inicial b" value={b1} onChangeText={setB1} placeholder="5000" permiteNegativo maxLength={9} />
          </Columna>
        </FilaCampos>

        <Text style={[styles.etiqueta, { color: COLOR_F2 }]}>g(x) = m·x + b  (opcional)</Text>
        <FilaCampos>
          <Columna>
            <CampoNumero label="Pendiente m" value={m2} onChangeText={setM2} placeholder="250" permiteNegativo maxLength={9} />
          </Columna>
          <Columna>
            <CampoNumero label="Valor inicial b" value={b2} onChangeText={setB2} placeholder="2000" permiteNegativo maxLength={9} />
          </Columna>
        </FilaCampos>
      </Seccion>

      <BotonPrimario label={tieneF2 ? 'Comparar' : 'Analizar'} icono="trending-up-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={titulo}
          valor={valor}
          tono={calculo.estado === 'paralelas' ? 'warning' : 'info'}
          badge={tieneF2 ? 'Comparación' : v.m1 > 0 ? 'Creciente' : v.m1 < 0 ? 'Decreciente' : 'Constante'}
          descripcion={descripcion}
          onLayout={p.onLayoutResultado}>
          <Grafico m1={v.m1} b1={v.b1} f2={tieneF2 ? { m: v.m2, b: v.b2 } : null} punto={calculo.interseccion} />
          <DetalleCalculo filas={calculo.filas} total={{ label: 'f(x)', valor: expresion(v.m1, v.b1, 'f').replace('f(x) = ', '') }} tonoTotal="info" />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Pendiente y valor inicial"
        texto="El valor inicial b es donde la recta corta el eje Y (cuando x = 0). La pendiente m indica la inclinación: si es positiva la recta sube, si es negativa baja. Dos rectas se cortan donde f(x) = g(x)."
        formula="y = m·x + b"
        tip="En problemas de planes o tarifas, la intersección es el punto de equilibrio: el consumo donde ambos planes cuestan lo mismo."
      />
    </PantallaCalculadora>
  );
}

/** Gráfico simple de una o dos rectas con el punto de intersección. */
function Grafico({ m1, b1, f2, punto }: { m1: number; b1: number; f2: { m: number; b: number } | null; punto: { x: number; y: number } | null }) {
  const W = 300;
  const H = 180;
  const pad = 24;
  // Rango de x: alrededor de la intersección o de 0
  const centro = punto && Number.isFinite(punto.x) ? punto.x : 0;
  const ancho = Math.max(Math.abs(centro) * 2, 10);
  const x0 = Math.min(0, centro - ancho / 2);
  const x1 = Math.max(0, centro + ancho / 2) || 10;
  const ys = [m1 * x0 + b1, m1 * x1 + b1, ...(f2 ? [f2.m * x0 + f2.b, f2.m * x1 + f2.b] : []), 0];
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys) === y0 ? y0 + 1 : Math.max(...ys);
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - y0) / (y1 - y0)) * (H - 2 * pad);

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* ejes */}
        <Line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} stroke={colors.border} strokeWidth={1} />
        <Line x1={sx(0)} y1={pad} x2={sx(0)} y2={H - pad} stroke={colors.border} strokeWidth={1} />
        <Line x1={sx(x0)} y1={sy(m1 * x0 + b1)} x2={sx(x1)} y2={sy(m1 * x1 + b1)} stroke={Acento.claro} strokeWidth={3} />
        {f2 && <Line x1={sx(x0)} y1={sy(f2.m * x0 + f2.b)} x2={sx(x1)} y2={sy(f2.m * x1 + f2.b)} stroke={COLOR_F2} strokeWidth={3} />}
        {punto && <Circle cx={sx(punto.x)} cy={sy(punto.y)} r={6} fill="#ffffff" />}
        <SvgText x={W - pad} y={sy(0) - 6} fill={colors.textMuted} fontSize={10} textAnchor="end">x</SvgText>
        <SvgText x={sx(0) + 6} y={pad + 4} fill={colors.textMuted} fontSize={10}>y</SvgText>
      </Svg>
      <View style={styles.leyenda}>
        <Text style={[styles.leyendaTexto, { color: Acento.claro }]}>━ f(x)</Text>
        {f2 && <Text style={[styles.leyendaTexto, { color: COLOR_F2 }]}>━ g(x)</Text>}
        {punto && <Text style={[styles.leyendaTexto, { color: colors.text }]}>● intersección</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: -4,
  },
  leyenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  leyendaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
});
