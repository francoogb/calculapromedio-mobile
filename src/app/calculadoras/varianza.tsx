import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Segmentado } from '@/components/calculadora/campos';
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
import { Acento, Colors, Spacing } from '@/constants/theme';
import { media, suma } from '@/lib/estadistica';
import { fmtNumero } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'varianza';
const colors = Colors.dark;

type Tipo = 'poblacion' | 'muestra';

export default function VarianzaScreen() {
  const [datos, setDatos] = useState<number[]>([]);
  const [tipo, setTipo] = useState<Tipo>('poblacion');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [datos, tipo]);

  const calculo = useMemo(() => {
    if (datos.length < 2) return null;
    const n = datos.length;
    const m = media(datos);
    const desvios = datos.map((x) => ({ x, d: x - m, d2: (x - m) ** 2 }));
    const sc = suma(desvios.map((d) => d.d2));
    const divisor = tipo === 'poblacion' ? n : n - 1;
    const v = sc / divisor;
    const s = Math.sqrt(v);
    return { n, m, desvios, sc, divisor, v, s, cv: m !== 0 ? (s / Math.abs(m)) * 100 : null };
  }, [datos, tipo]);

  const cargarEjemplo = () => {
    setDatos([4, 6, 7, 8, 10]);
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
      resultado: fmtNumero(calculo.s, 3),
      resumen: `Desv. estándar (${tipo === 'poblacion' ? 'población' : 'muestra'}) · varianza ${fmtNumero(calculo.v, 3)}`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const simboloV = tipo === 'poblacion' ? 'σ²' : 's²';
  const simboloS = tipo === 'poblacion' ? 'σ' : 's';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderCalculadora calculadoraId={CALC_ID} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <AvisoInfo>
            La varianza y la desviación estándar miden qué tan dispersos están los datos respecto a
            su promedio. Mientras más grandes, más alejados del promedio están.
          </AvisoInfo>

          <Seccion
            titulo="Tus datos"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <ListaDatos datos={datos} onCambiar={setDatos} />
            <Segmentado
              label="Los datos son"
              opciones={[
                { id: 'poblacion', texto: 'Población (÷ n)' },
                { id: 'muestra', texto: 'Muestra (÷ n − 1)' },
              ]}
              valor={tipo}
              onCambiar={setTipo}
            />
            <Text style={[styles.ayuda, { color: colors.textMuted }]}>
              {tipo === 'poblacion'
                ? 'Todos los elementos del grupo (ej. las notas de todo el curso). Es lo usual en la PAES.'
                : 'Una parte del grupo para estimar el total (ej. 30 alumnos de todo el colegio).'}
            </Text>
          </Seccion>

          <BotonPrimario
            label="Calcular dispersión"
            icono="pulse-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo={`Desviación estándar (${simboloS})`}
              valor={fmtNumero(calculo.s, 3)}
              tono="info"
              badge={tipo === 'poblacion' ? 'Población' : 'Muestra'}
              descripcion={`Varianza ${simboloV} = ${fmtNumero(calculo.v, 3)} · media ${fmtNumero(calculo.m, 3)}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <Text style={[styles.subtitulo, { color: colors.text }]}>Desviaciones respecto a la media</Text>
              <View style={[styles.tabla, { borderColor: colors.border }]}>
                <View style={[styles.tablaFila, styles.tablaHead]}>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>xᵢ</Text>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>xᵢ − x̄</Text>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>(xᵢ − x̄)²</Text>
                </View>
                {calculo.desvios.map((d, i) => (
                  <View key={i} style={[styles.tablaFila, { borderTopColor: colors.border }]}>
                    <Text style={[styles.tablaCelda, { color: colors.text }]}>{fmtNumero(d.x)}</Text>
                    <Text style={[styles.tablaCelda, { color: colors.textSecondary }]}>{fmtNumero(d.d, 3)}</Text>
                    <Text style={[styles.tablaCelda, { color: colors.text }]}>{fmtNumero(d.d2, 3)}</Text>
                  </View>
                ))}
              </View>

              <DetalleCalculo
                filas={[
                  {
                    key: 'media',
                    label: 'Media (x̄)',
                    operacion: `${fmtNumero(suma(datos))} ÷ ${calculo.n}`,
                    valor: fmtNumero(calculo.m, 3),
                  },
                  {
                    key: 'sc',
                    label: 'Suma de cuadrados',
                    operacion: 'Σ(xᵢ − x̄)²',
                    valor: fmtNumero(calculo.sc, 3),
                  },
                  {
                    key: 'var',
                    label: `Varianza ${simboloV}`,
                    operacion: `${fmtNumero(calculo.sc, 3)} ÷ ${calculo.divisor}`,
                    valor: fmtNumero(calculo.v, 3),
                  },
                  {
                    key: 'sd',
                    label: `Desviación estándar ${simboloS}`,
                    operacion: `√${fmtNumero(calculo.v, 3)}`,
                    valor: fmtNumero(calculo.s, 3),
                  },
                  ...(calculo.cv !== null
                    ? [
                        {
                          key: 'cv',
                          label: 'Coeficiente de variación',
                          operacion: `${simboloS} ÷ x̄ × 100`,
                          valor: `${fmtNumero(calculo.cv, 1)}%`,
                        },
                      ]
                    : []),
                ]}
                total={{ label: `Desviación estándar ${simboloS}`, valor: fmtNumero(calculo.s, 3) }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Qué significan?"
            texto="Se calcula cuánto se aleja cada dato de la media, se elevan esas distancias al cuadrado (para que no se cancelen los signos) y se promedian: eso es la varianza. La desviación estándar es su raíz, y queda en la misma unidad que los datos."
            formula={tipo === 'poblacion' ? 'σ² = Σ(xᵢ − x̄)² ÷ n' : 's² = Σ(xᵢ − x̄)² ÷ (n − 1)'}
            tip="Si a todos los datos les sumas un mismo número, la desviación estándar NO cambia. Si los multiplicas por k, la desviación se multiplica por |k|. Pregunta clásica de la PAES."
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
  ayuda: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: -8,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: '800',
  },
  tabla: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tablaFila: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tablaHead: {
    borderTopWidth: 0,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  tablaHeadTexto: {
    color: Acento.claro,
    fontWeight: '700',
    fontSize: 12,
  },
  tablaCelda: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
});
