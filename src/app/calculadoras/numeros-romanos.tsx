import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FONDO_INPUT, Segmentado } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Colors } from '@/constants/theme';
import { fmtNumero } from '@/lib/matematica';

const CALC_ID = 'numeros-romanos';
const colors = Colors.dark;

const TABLA: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** Arábigo → romano, con la descomposición usada. */
function aRomano(n: number): { romano: string; partes: [number, string][] } {
  const partes: [number, string][] = [];
  let resto = n;
  for (const [valor, simbolo] of TABLA) {
    while (resto >= valor) {
      partes.push([valor, simbolo]);
      resto -= valor;
    }
  }
  return { romano: partes.map(([, s]) => s).join(''), partes };
}

/** Romano canónico (I–MMMCMXCIX) o null si no es válido. */
const ROMANO_VALIDO = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function aArabigo(romano: string): number | null {
  const r = romano.toUpperCase();
  if (!r || !ROMANO_VALIDO.test(r)) return null;
  let total = 0;
  let i = 0;
  for (const [valor, simbolo] of TABLA) {
    while (r.startsWith(simbolo, i)) {
      total += valor;
      i += simbolo.length;
    }
  }
  return total;
}

type Modo = 'a-romano' | 'a-arabigo';

export default function NumerosRomanosScreen() {
  const [modo, setModo] = useState<Modo>('a-romano');
  const [texto, setTexto] = useState('');
  const p = usePantallaCalculo(CALC_ID, [modo, texto]);

  const calculo = useMemo(() => {
    if (texto.trim() === '') return null;
    if (modo === 'a-romano') {
      const n = Number(texto);
      if (!Number.isInteger(n) || n < 1 || n > 3999) return { error: 'Escribe un entero entre 1 y 3.999' };
      const r = aRomano(n);
      return { arabigo: n, romano: r.romano, partes: r.partes };
    }
    const n = aArabigo(texto.trim());
    if (n === null) return { error: 'No es un número romano válido (ej. XIV, MCMXCIV)' };
    return { arabigo: n, romano: texto.trim().toUpperCase(), partes: aRomano(n).partes };
  }, [modo, texto]);

  const valido = calculo !== null && !('error' in calculo);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setTexto('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && !('error' in calculo) && p.guardar(modo === 'a-romano' ? calculo.romano : String(calculo.arabigo), `${calculo.arabigo} = ${calculo.romano}`)}
      puedeGuardar={p.calculado && valido}
      guardado={p.guardado}>
      <Segmentado
        opciones={[
          { id: 'a-romano', texto: '123 → MCXXIII' },
          { id: 'a-arabigo', texto: 'XIV → 14' },
        ]}
        valor={modo}
        onCambiar={(m) => {
          setModo(m);
          setTexto('');
          p.setCalculado(false);
        }}
      />

      <AvisoInfo>
        Convierte entre números arábigos y romanos (del 1 al 3.999). Útil para siglos, capítulos y
        nombres de reyes o papas.
      </AvisoInfo>

      <Seccion
        titulo={modo === 'a-romano' ? 'Número arábigo' : 'Número romano'}
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setTexto(modo === 'a-romano' ? '2026' : 'MCMXCIV');
              p.setCalculado(false);
            }}
          />
        }>
        <View style={styles.campo}>
          <TextInput
            value={texto}
            onChangeText={(t) => setTexto(modo === 'a-romano' ? t.replace(/\D/g, '') : t.replace(/[^ivxlcdmIVXLCDM]/g, '').toUpperCase())}
            placeholder={modo === 'a-romano' ? '2026' : 'MMXXVI'}
            placeholderTextColor={colors.textMuted}
            keyboardType={modo === 'a-romano' ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={modo === 'a-romano' ? 4 : 15}
            style={[styles.input, { color: colors.text, borderColor: calculo && 'error' in calculo ? colors.danger : colors.border }]}
          />
          {calculo && 'error' in calculo && <Text style={[styles.error, { color: colors.danger }]}>{calculo.error}</Text>}
        </View>
      </Seccion>

      <BotonPrimario label="Convertir" icono="swap-horizontal-outline" onPress={p.calcular} deshabilitado={!valido} />

      {p.calculado && calculo && !('error' in calculo) && (
        <TarjetaResultado
          titulo={modo === 'a-romano' ? 'En números romanos' : 'En números arábigos'}
          valor={modo === 'a-romano' ? calculo.romano : fmtNumero(calculo.arabigo)}
          tono="info"
          badge={`${calculo.arabigo} = ${calculo.romano}`}
          descripcion="Se descompone en valores de la tabla, de mayor a menor."
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={calculo.partes.reduce<{ key: string; label: string; valor: string }[]>((acc, [valor, simbolo]) => {
              const previo = acc.find((x) => x.key === simbolo);
              if (previo) {
                previo.valor = String(Number(previo.valor) + valor);
                previo.label += simbolo;
              } else acc.push({ key: simbolo, label: simbolo, valor: String(valor) });
              return acc;
            }, [])}
            total={{ label: calculo.romano, valor: fmtNumero(calculo.arabigo) }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Reglas de los números romanos"
        texto="I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1.000. Un símbolo menor a la izquierda de uno mayor resta (IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900). Ningún símbolo se repite más de 3 veces seguidas."
        formula="1.994 = M + CM + XC + IV = MCMXCIV"
        tip="Solo I, X y C pueden restar, y solo a los dos símbolos siguientes: IL o XM no son válidos."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: 6,
  },
  input: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    paddingHorizontal: 16,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
});
