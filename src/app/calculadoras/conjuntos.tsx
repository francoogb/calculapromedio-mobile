import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { FONDO_INPUT } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Acento, Colors } from '@/constants/theme';

const CALC_ID = 'conjuntos';
const colors = Colors.dark;
const COLOR_B = '#5eead4';

/** "1, 2, 3" o "a b c" → elementos únicos, en orden de aparición. */
function parsear(texto: string): string[] {
  const elementos = texto
    .split(/[,;\s]+/)
    .map((t) => t.trim().replace(/^[{]|[}]$/g, ''))
    .filter(Boolean);
  return [...new Set(elementos)];
}

/** Orden natural: números de menor a mayor, luego texto alfabético. */
function ordenar(xs: string[]): string[] {
  return [...xs].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b, 'es');
  });
}

const llaves = (xs: string[]) => (xs.length ? `{ ${ordenar(xs).join(', ')} }` : '∅');

export default function ConjuntosScreen() {
  const [textoA, setTextoA] = useState('');
  const [textoB, setTextoB] = useState('');
  const p = usePantallaCalculo(CALC_ID, [textoA, textoB], (d: { textoA: string; textoB: string }) => { setTextoA(d.textoA); setTextoB(d.textoB); });

  const calculo = useMemo(() => {
    const A = parsear(textoA);
    const B = parsear(textoB);
    if (A.length === 0 && B.length === 0) return null;
    const setB = new Set(B);
    const setA = new Set(A);
    const interseccion = A.filter((x) => setB.has(x));
    const soloA = A.filter((x) => !setB.has(x));
    const soloB = B.filter((x) => !setA.has(x));
    const union = [...A, ...soloB];
    return { A, B, interseccion, soloA, soloB, union, simetrica: [...soloA, ...soloB] };
  }, [textoA, textoB]);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setTextoA('');
        setTextoB('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && p.guardar(`|A∪B| = ${calculo.union.length}`, `A∩B = ${llaves(calculo.interseccion)}`, { textoA, textoB })}
      puedeGuardar={p.calculado && calculo !== null}
      guardado={p.guardado}>
      <AvisoInfo>
        Escribe los elementos de cada conjunto separados por coma o espacio. Pueden ser números o
        letras; los repetidos se cuentan una sola vez.
      </AvisoInfo>

      <Seccion
        titulo="Tus conjuntos"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setTextoA('1, 2, 3, 4, 5');
              setTextoB('4, 5, 6, 7');
              p.setCalculado(false);
            }}
          />
        }>
        <EntradaConjunto nombre="A" color={Acento.claro} valor={textoA} onCambiar={setTextoA} />
        <EntradaConjunto nombre="B" color={COLOR_B} valor={textoB} onCambiar={setTextoB} />
      </Seccion>

      <BotonPrimario label="Operar" icono="ellipse-outline" onPress={p.calcular} deshabilitado={calculo === null} />

      {p.calculado && calculo && (
        <TarjetaResultado
          titulo="Intersección A ∩ B"
          valor={llaves(calculo.interseccion)}
          tono="info"
          badge={`${calculo.interseccion.length} en común`}
          descripcion={`A ∪ B tiene ${calculo.union.length} elementos`}
          onLayout={p.onLayoutResultado}>
          <Venn soloA={calculo.soloA.length} ambos={calculo.interseccion.length} soloB={calculo.soloB.length} />
          <DetalleCalculo
            filas={[
              { key: 'a', label: `A (${calculo.A.length} elementos)`, operacion: llaves(calculo.A), valor: '' },
              { key: 'b', label: `B (${calculo.B.length} elementos)`, operacion: llaves(calculo.B), valor: '' },
              { key: 'u', label: 'Unión A ∪ B (en A o en B)', operacion: llaves(calculo.union), valor: String(calculo.union.length) },
              { key: 'i', label: 'Intersección A ∩ B (en ambos)', operacion: llaves(calculo.interseccion), valor: String(calculo.interseccion.length) },
              { key: 'amb', label: 'Diferencia A − B (solo en A)', operacion: llaves(calculo.soloA), valor: String(calculo.soloA.length) },
              { key: 'bma', label: 'Diferencia B − A (solo en B)', operacion: llaves(calculo.soloB), valor: String(calculo.soloB.length) },
              { key: 's', label: 'Diferencia simétrica A Δ B', operacion: llaves(calculo.simetrica), valor: String(calculo.simetrica.length) },
            ]}
            total={{ label: '|A ∪ B| = |A| + |B| − |A ∩ B|', valor: `${calculo.A.length} + ${calculo.B.length} − ${calculo.interseccion.length} = ${calculo.union.length}` }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Operaciones con conjuntos"
        texto="La unión junta todos los elementos de ambos conjuntos. La intersección deja solo los que están en los dos. La diferencia A − B deja los que están en A pero no en B."
        formula="|A ∪ B| = |A| + |B| − |A ∩ B|"
        tip="Esa fórmula es clave en problemas de encuestas: si 30 leen el diario A, 20 el B y 8 ambos, en total leen 30 + 20 − 8 = 42."
      />
    </PantallaCalculadora>
  );
}

function EntradaConjunto({ nombre, color, valor, onCambiar }: { nombre: string; color: string; valor: string; onCambiar: (t: string) => void }) {
  return (
    <View style={styles.entrada}>
      <Text style={[styles.nombre, { color }]}>{nombre} =</Text>
      <TextInput
        value={valor}
        onChangeText={onCambiar}
        placeholder="1, 2, 3"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </View>
  );
}

/** Diagrama de Venn con la cantidad de elementos de cada zona. */
function Venn({ soloA, ambos, soloB }: { soloA: number; ambos: number; soloB: number }) {
  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      <Circle cx={115} cy={75} r={62} fill="rgba(99,102,241,0.18)" stroke={Acento.claro} strokeWidth={2} />
      <Circle cx={185} cy={75} r={62} fill="rgba(45,212,191,0.14)" stroke={COLOR_B} strokeWidth={2} />
      <SvgText x={88} y={82} fill="#ffffff" fontSize={20} fontWeight="bold" textAnchor="middle">{soloA}</SvgText>
      <SvgText x={150} y={82} fill="#ffffff" fontSize={20} fontWeight="bold" textAnchor="middle">{ambos}</SvgText>
      <SvgText x={212} y={82} fill="#ffffff" fontSize={20} fontWeight="bold" textAnchor="middle">{soloB}</SvgText>
      <SvgText x={70} y={20} fill={Acento.claro} fontSize={14} fontWeight="bold">A</SvgText>
      <SvgText x={224} y={20} fill={COLOR_B} fontSize={14} fontWeight="bold">B</SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  entrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nombre: {
    width: 36,
    fontSize: 17,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
});
