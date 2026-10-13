import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FONDO_INPUT, Segmentado } from '@/components/calculadora/campos';
import { PantallaCalculadora, usePantallaCalculo } from '@/components/calculadora/pantalla';
import { AvisoInfo, BotonPildora, BotonPrimario, ExplicacionPlegable, Seccion } from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Colors } from '@/constants/theme';
import { superindice } from '@/lib/matematica';

const CALC_ID = 'bases-numericas';
const colors = Colors.dark;

type Base = '10' | '2' | '8' | '16';
const BASES: { id: Base; texto: string; nombre: string; patron: RegExp; ejemplo: string }[] = [
  { id: '10', texto: 'Decimal', nombre: 'decimal', patron: /^[0-9]+$/, ejemplo: '2026' },
  { id: '2', texto: 'Binario', nombre: 'binario', patron: /^[01]+$/, ejemplo: '101101' },
  { id: '8', texto: 'Octal', nombre: 'octal', patron: /^[0-7]+$/, ejemplo: '755' },
  { id: '16', texto: 'Hexa', nombre: 'hexadecimal', patron: /^[0-9A-F]+$/, ejemplo: 'FF' },
];
const MAXIMO = Number.MAX_SAFE_INTEGER;

export default function BasesNumericasScreen() {
  const [base, setBase] = useState<Base>('10');
  const [texto, setTexto] = useState('');
  const p = usePantallaCalculo(CALC_ID, [base, texto]);
  const info = BASES.find((b) => b.id === base)!;

  const calculo = useMemo(() => {
    const t = texto.trim().toUpperCase();
    if (!t) return null;
    if (!info.patron.test(t)) return { error: `Solo dígitos válidos en ${info.nombre}` };
    const valor = parseInt(t, Number(base));
    if (!Number.isSafeInteger(valor) || valor > MAXIMO) return { error: 'Número demasiado grande' };
    const conv = { '10': valor.toString(10), '2': valor.toString(2), '8': valor.toString(8), '16': valor.toString(16).toUpperCase() };

    // Desarrollo posicional del número de origen: d·base^k
    const digitos = t.split('');
    const posicional = digitos
      .map((d, i) => ({ d, k: digitos.length - 1 - i }))
      .filter(({ d }) => d !== '0')
      .map(({ d, k }) => `${d}·${base}${superindice(k)}`);

    // Divisiones sucesivas para pasar a binario (solo si el número es chico)
    const divisiones: string[] = [];
    if (valor > 0 && valor <= 255) {
      let q = valor;
      while (q > 0) {
        divisiones.push(`${q} ÷ 2 = ${Math.floor(q / 2)} resto ${q % 2}`);
        q = Math.floor(q / 2);
      }
    }
    return { valor, conv, posicional, divisiones, bits: conv['2'].length };
  }, [texto, base, info]);

  const valido = calculo !== null && !('error' in calculo);

  return (
    <PantallaCalculadora
      calculadoraId={CALC_ID}
      scrollRef={p.scrollRef}
      onLimpiar={() => {
        setTexto('');
        p.reiniciar();
      }}
      onGuardar={() => calculo && !('error' in calculo) && p.guardar(calculo.conv['2'], `${calculo.conv['10']} = 0x${calculo.conv['16']}`)}
      puedeGuardar={p.calculado && valido}
      guardado={p.guardado}>
      <AvisoInfo>
        Convierte un número entre decimal, binario, octal y hexadecimal, con el desarrollo
        posicional de cada dígito.
      </AvisoInfo>

      <Seccion
        titulo="Tu número"
        accion={
          <BotonPildora
            label="Ejemplo"
            icono="school-outline"
            onPress={() => {
              setTexto(info.ejemplo);
              p.setCalculado(false);
            }}
          />
        }>
        <Segmentado
          label="Está escrito en"
          opciones={BASES.map((b) => ({ id: b.id, texto: b.texto }))}
          valor={base}
          onCambiar={(b) => {
            setBase(b);
            setTexto('');
            p.setCalculado(false);
          }}
        />
        <View style={styles.campo}>
          <TextInput
            value={texto}
            onChangeText={(t) => setTexto(t.toUpperCase().replace(/[^0-9A-F]/g, ''))}
            placeholder={info.ejemplo}
            placeholderTextColor={colors.textMuted}
            keyboardType={base === '16' ? 'default' : 'number-pad'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={base === '2' ? 53 : 16}
            style={[styles.input, { color: colors.text, borderColor: calculo && 'error' in calculo ? colors.danger : colors.border }]}
          />
          {calculo && 'error' in calculo && <Text style={[styles.error, { color: colors.danger }]}>{calculo.error}</Text>}
        </View>
      </Seccion>

      <BotonPrimario label="Convertir" icono="code-slash-outline" onPress={p.calcular} deshabilitado={!valido} />

      {p.calculado && calculo && !('error' in calculo) && (
        <TarjetaResultado
          titulo="En decimal"
          valor={calculo.conv['10']}
          tono="info"
          badge={`${calculo.bits} bits`}
          descripcion={`Binario ${calculo.conv['2']}`}
          onLayout={p.onLayoutResultado}>
          <DetalleCalculo
            filas={[
              ...BASES.filter((b) => b.id !== '10').map((b) => ({ key: b.id, label: b.texto === 'Hexa' ? 'Hexadecimal' : b.texto, valor: calculo.conv[b.id] })),
              ...(base !== '10' && calculo.posicional.length > 0 && calculo.posicional.length <= 12
                ? [{ key: 'pos', label: 'Desarrollo posicional', operacion: calculo.posicional.join(' + '), valor: calculo.conv['10'] }]
                : []),
              ...(base === '10' && calculo.divisiones.length > 0
                ? [{ key: 'div', label: 'Divisiones sucesivas por 2 (se leen los restos de abajo hacia arriba)', operacion: calculo.divisiones.join('\n'), valor: calculo.conv['2'] }]
                : []),
            ]}
            total={{ label: 'Decimal', valor: calculo.conv['10'] }}
            tonoTotal="info"
          />
        </TarjetaResultado>
      )}

      <ExplicacionPlegable
        titulo="Sistemas de numeración"
        texto="Cada posición vale una potencia de la base. En binario (base 2) solo hay 0 y 1; en hexadecimal (base 16) se usan 0–9 y A–F (A = 10 … F = 15). Cada dígito hexadecimal equivale exactamente a 4 bits."
        formula="1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 11"
        tip="Para pasar de decimal a binario, divide por 2 repetidamente y lee los restos de abajo hacia arriba."
      />
    </PantallaCalculadora>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: 6,
  },
  input: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: FONDO_INPUT,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
});
