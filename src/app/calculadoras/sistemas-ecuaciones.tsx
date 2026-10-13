import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FONDO_INPUT, TECLADO_CON_SIGNO } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';
import { fmtNumero, leerNumero } from '@/lib/matematica';

const CALC_ID = 'sistemas-ecuaciones';
const colors = Colors.dark;
const f = (n: number) => fmtNumero(n, 4);

type Coefs = { a1: string; b1: string; c1: string; a2: string; b2: string; c2: string };
const VACIO: Coefs = { a1: '', b1: '', c1: '', a2: '', b2: '', c2: '' };

export default function SistemasEcuacionesScreen() {
  const [k, setK] = useState<Coefs>(VACIO);
  const p = usePantallaCalculo(CALC_ID, [k]);
  const n = Object.fromEntries(Object.entries(k).map(([key, v]) => [key, leerNumero(v)])) as Record<keyof Coefs, number>;

  const calculo = useMemo(() => {
    if (!Object.values(n).every(Number.isFinite)) return null;
    const D = n.a1 * n.b2 - n.a2 * n.b1;
    const Dx = n.c1 * n.b2 - n.c2 * n.b1;
    const Dy = n.a1 * n.c2 - n.a2 * n.c1;
    if (Math.abs(D) < 1e-12) {
      const compatible = Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12;
      return { D, Dx, Dy, tipo: compatible ? ('infinitas' as const) : ('sin' as const) };
    }
    return { D, Dx, Dy, tipo: 'unica' as const, x: Dx / D, y: Dy / D };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  const set = (campo: keyof Coefs) => (t: string) => setK((prev) => ({ ...prev, [campo]: t }));

  const filasCramer = calculo
    ? [
        { key: 'D', label: 'D = a₁·b₂ − a₂·b₁', operacion: `${f(n.a1)}·${f(n.b2)} − ${f(n.a2)}·${f(n.b1)}`, valor: f(calculo.D) },
        { key: 'Dx', label: 'Dx = c₁·b₂ − c₂·b₁', operacion: `${f(n.c1)}·${f(n.b2)} − ${f(n.c2)}·${f(n.b1)}`, valor: f(calculo.Dx) },
        { key: 'Dy', label: 'Dy = a₁·c₂ − a₂·c₁', operacion: `${f(n.a1)}·${f(n.c2)} − ${f(n.a2)}·${f(n.c1)}`, valor: f(calculo.Dy) },
      ]
    : [];

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setK(VACIO);
        p.reiniciar();
      }}
      onGuardar={() =>
        calculo &&
        p.guardar(
          calculo.tipo === 'unica' ? `x = ${f(calculo.x!)}, y = ${f(calculo.y!)}` : calculo.tipo === 'sin' ? 'Sin solución' : 'Infinitas',
          `${k.a1}x + ${k.b1}y = ${k.c1} · ${k.a2}x + ${k.b2}y = ${k.c2}`
        )
      }
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Escribe los coeficientes de cada ecuación. Si una variable no aparece, su coeficiente es 0;
        si aparece sola (como "x"), es 1.
      </AvisoInfo>

      <Seccion
        titulo="Tu sistema"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setK({ a1: '2', b1: '3', c1: '12', a2: '1', b2: '-1', c2: '1' });
              p.setCalculado(false);
            }}
          />
        }>
        <Ecuacion a={k.a1} b={k.b1} c={k.c1} onA={set('a1')} onB={set('b1')} onC={set('c1')} />
        <Ecuacion a={k.a2} b={k.b2} c={k.c2} onA={set('a2')} onB={set('b2')} onC={set('c2')} />
      </Seccion>

      <BotonPrimario label="Resolver" icono="git-merge-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo={calculo.tipo === 'unica' ? 'La solución es' : 'Resultado'}
          valor={
            calculo.tipo === 'unica'
              ? `x = ${f(calculo.x!)} · y = ${f(calculo.y!)}`
              : calculo.tipo === 'sin'
              ? 'Sin solución'
              : 'Infinitas soluciones'
          }
          tono={calculo.tipo === 'unica' ? 'ok' : 'warning'}
          badge={calculo.tipo === 'unica' ? 'Compatible determinado' : calculo.tipo === 'sin' ? 'Incompatible' : 'Indeterminado'}
          descripcion={
            calculo.tipo === 'unica'
              ? 'Las dos rectas se cortan en un solo punto.'
              : calculo.tipo === 'sin'
              ? 'Las rectas son paralelas: nunca se cortan.'
              : 'Las dos ecuaciones representan la misma recta.'
          }
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              ...filasCramer,
              ...(calculo.tipo === 'unica'
                ? [
                    { key: 'x', label: 'x = Dx ÷ D', operacion: `${f(calculo.Dx)} ÷ ${f(calculo.D)}`, valor: f(calculo.x!) },
                    { key: 'y', label: 'y = Dy ÷ D', operacion: `${f(calculo.Dy)} ÷ ${f(calculo.D)}`, valor: f(calculo.y!) },
                    {
                      key: 'comp',
                      label: 'Comprobación en ec. 1',
                      operacion: `${f(n.a1)}·${f(calculo.x!)} + ${f(n.b1)}·${f(calculo.y!)}`,
                      valor: f(n.a1 * calculo.x! + n.b1 * calculo.y!),
                    },
                  ]
                : [{ key: 'nota', label: 'D = 0: no hay solución única', valor: '—', tono: 'warning' as const }]),
            ]}
            total={{
              label: 'Solución',
              valor: calculo.tipo === 'unica' ? `(${f(calculo.x!)}, ${f(calculo.y!)})` : calculo.tipo === 'sin' ? '∅' : '∞',
            }}
            tonoTotal={calculo.tipo === 'unica' ? 'ok' : 'warning'}
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="¿Cómo se resuelve?"
        texto="Se usa la regla de Cramer: se calculan tres determinantes. Si D ≠ 0 hay una única solución. Si D = 0, el sistema no tiene solución o tiene infinitas."
        formula="x = Dx ÷ D   ·   y = Dy ÷ D"
        tip="En la PAES el método de reducción suele ser el más rápido: multiplica una ecuación para que una variable tenga coeficientes opuestos y suma ambas ecuaciones."
      />
    </PantallaCalculadora>
  );
}

/** Una ecuación "[a] x + [b] y = [c]" con inputs en línea. */
function Ecuacion(props: { a: string; b: string; c: string; onA: (t: string) => void; onB: (t: string) => void; onC: (t: string) => void }) {
  const input = (value: string, on: (t: string) => void, ph: string) => (
    <TextInput
      value={value}
      onChangeText={on}
      placeholder={ph}
      placeholderTextColor={colors.textMuted}
      keyboardType={TECLADO_CON_SIGNO}
      maxLength={7}
      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
    />
  );
  return (
    <View style={styles.ecuacion}>
      {input(props.a, props.onA, 'a')}
      <Text style={styles.variable}>x +</Text>
      {input(props.b, props.onB, 'b')}
      <Text style={styles.variable}>y =</Text>
      {input(props.c, props.onC, 'c')}
    </View>
  );
}

const styles = StyleSheet.create({
  ecuacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  variable: {
    color: Acento.claro,
    fontSize: 16,
    fontWeight: '800',
  },
});
