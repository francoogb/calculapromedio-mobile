import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FONDO_INPUT, Segmentado, TECLADO_CON_SIGNO } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'determinante';
const colors = Colors.dark;
const f = (n: number) => fmtNumero(n, 4);

type Tam = '2' | '3';
const vacia = (t: Tam) => Array.from({ length: Number(t) }, () => Array(Number(t)).fill(''));

const EJEMPLO: Record<Tam, string[][]> = {
  '2': [['3', '2'], ['1', '4']],
  '3': [['2', '1', '3'], ['0', '-1', '4'], ['1', '2', '0']],
};

export default function DeterminanteScreen() {
  const [tam, setTam] = useState<Tam>('3');
  const [m, setM] = useState<string[][]>(() => vacia('3'));
  const p = usePantallaCalculo(CALC_ID, [tam, m]);

  const calculo = useMemo(() => {
    const v = m.map((fila) => fila.map(leerNumero));
    if (!v.every((fila) => fila.every(Number.isFinite))) return null;

    if (tam === '2') {
      const [[a, b], [c, d]] = v;
      const det = a * d - b * c;
      return {
        det,
        filas: [
          { key: 'diag', label: 'Diagonal principal', operacion: `${f(a)} × ${f(d)}`, valor: f(a * d) },
          { key: 'sec', label: 'Diagonal secundaria', operacion: `${f(b)} × ${f(c)}`, valor: f(b * c) },
          { key: 'res', label: 'Principal − secundaria', operacion: `${f(a * d)} − ${f(b * c)}`, valor: f(det) },
        ],
      };
    }

    // Sarrus: 3 diagonales hacia abajo (+) y 3 hacia arriba (−)
    const [[a, b, c], [d, e, g], [h, i, j]] = v;
    const pos = [a * e * j, b * g * h, c * d * i];
    const neg = [c * e * h, a * g * i, b * d * j];
    const sumaPos = pos.reduce((s, x) => s + x, 0);
    const sumaNeg = neg.reduce((s, x) => s + x, 0);
    const det = sumaPos - sumaNeg;
    return {
      det,
      filas: [
        { key: 'p', label: 'Diagonales ↘ (suman)', operacion: `${f(a)}·${f(e)}·${f(j)} + ${f(b)}·${f(g)}·${f(h)} + ${f(c)}·${f(d)}·${f(i)}`, valor: f(sumaPos) },
        { key: 'n', label: 'Diagonales ↙ (restan)', operacion: `${f(c)}·${f(e)}·${f(h)} + ${f(a)}·${f(g)}·${f(i)} + ${f(b)}·${f(d)}·${f(j)}`, valor: f(sumaNeg) },
        { key: 'res', label: 'Determinante', operacion: `${f(sumaPos)} − ${f(sumaNeg)}`, valor: f(det) },
      ],
    };
  }, [m, tam]);

  const setCelda = (r: number, c: number, t: string) =>
    setM((prev) => prev.map((fila, ri) => (ri === r ? fila.map((x, ci) => (ci === c ? t : x)) : fila)));

  const invertible = calculo !== null && Math.abs(calculo.det) > 1e-12;

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setM(vacia(tam));
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(f(calculo.det), `Determinante ${tam}×${tam}`)}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <Segmentado
        opciones={[
          { id: '2', texto: 'Matriz 2×2' },
          { id: '3', texto: 'Matriz 3×3' },
        ]}
        valor={tam}
        onCambiar={(t) => {
          setTam(t);
          setM(vacia(t));
          p.setCalculado(false);
        }}
      />

      <AvisoInfo>
        El determinante es un número asociado a una matriz cuadrada. Si es 0, la matriz no tiene
        inversa y el sistema asociado no tiene solución única.
      </AvisoInfo>

      <Seccion
        titulo="Tu matriz"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setM(EJEMPLO[tam].map((fila) => [...fila]));
              p.setCalculado(false);
            }}
          />
        }>
        <View style={styles.matriz}>
          <View style={[styles.barra, { borderColor: Acento.claro }]} />
          <View style={styles.celdas}>
            {m.map((fila, r) => (
              <View key={r} style={styles.fila}>
                {fila.map((valor, c) => (
                  <TextInput
                    key={c}
                    value={valor}
                    onChangeText={(t) => setCelda(r, c, t)}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType={TECLADO_CON_SIGNO}
                    maxLength={6}
                    style={[styles.celda, { color: colors.text, borderColor: colors.border }]}
                  />
                ))}
              </View>
            ))}
          </View>
          <View style={[styles.barra, styles.barraDerecha, { borderColor: Acento.claro }]} />
        </View>
      </Seccion>

      <BotonPrimario label="Calcular determinante" icono="apps-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="El determinante es"
          valor={f(calculo.det)}
          tono={invertible ? 'info' : 'warning'}
          badge={invertible ? 'Invertible' : 'No invertible'}
          descripcion={invertible ? 'La matriz tiene inversa (det ≠ 0).' : 'det = 0: la matriz no tiene inversa.'}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo filas={calculo.filas} total={{ label: `det (${tam}×${tam})`, valor: f(calculo.det) }} tonoTotal={invertible ? 'info' : 'warning'} />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se calcula?"
        texto={
          tam === '2'
            ? 'En una matriz 2×2 se multiplica la diagonal principal y se le resta el producto de la diagonal secundaria.'
            : 'Regla de Sarrus: se suman los productos de las 3 diagonales que bajan hacia la derecha y se restan los de las 3 que bajan hacia la izquierda.'
        }
        formula={tam === '2' ? '|a b; c d| = ad − bc' : 'det = (aei + bfg + cdh) − (ceg + afh + bdi)'}
        tip="Si una fila o columna es toda ceros, o dos filas son iguales, el determinante es 0 sin calcular nada."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  matriz: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  barra: {
    width: 10,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRadius: 2,
  },
  barraDerecha: {
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  celdas: {
    flex: 1,
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    gap: 8,
  },
  celda: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
