import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { frecuencias, media, mediana, modas, ordenar, suma } from '@/lib/estadistica';
import { fmtNumero } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'estadistica';
const colors = Colors.dark;

export default function EstadisticaScreen() {
  const [datos, setDatos] = useState<number[]>([]);
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [datos]);

  const calculo = useMemo(() => {
    if (datos.length < 2) return null;
    const ordenados = ordenar(datos);
    const n = datos.length;
    const mitad = Math.floor(n / 2);
    return {
      n,
      suma: suma(datos),
      media: media(datos),
      mediana: mediana(datos),
      moda: modas(datos),
      ordenados,
      min: ordenados[0],
      max: ordenados[n - 1],
      opMediana:
        n % 2 === 0
          ? `Par: (${fmtNumero(ordenados[mitad - 1])} + ${fmtNumero(ordenados[mitad])}) ÷ 2`
          : `Impar: el dato central (posición ${mitad + 1})`,
      frecuencias: frecuencias(datos),
    };
  }, [datos]);

  const cargarEjemplo = () => {
    setDatos([5.5, 6, 4.8, 6, 7, 5.2, 6, 4.8]);
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
      resultado: fmtNumero(calculo.media, 2),
      resumen: `Media · mediana ${fmtNumero(calculo.mediana, 2)} · ${calculo.n} datos`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const textoModa = calculo
    ? calculo.moda.valores.length === 0
      ? 'Sin moda'
      : calculo.moda.valores.map((v) => fmtNumero(v)).join(', ')
    : '';

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
            Las tres medidas de tendencia central de un conjunto de datos: media (promedio), mediana
            (el dato del centro) y moda (el que más se repite).
          </AvisoInfo>

          <Seccion
            titulo="Tus datos"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <ListaDatos datos={datos} onCambiar={setDatos} />
          </Seccion>

          <BotonPrimario
            label="Calcular"
            icono="bar-chart-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Media (promedio)"
              valor={fmtNumero(calculo.media, 2)}
              tono="info"
              badge={`${calculo.n} datos`}
              descripcion={`Mediana ${fmtNumero(calculo.mediana, 2)} · Moda ${textoModa}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <View style={styles.trio}>
                <Medida titulo="Media" valor={fmtNumero(calculo.media, 2)} />
                <Medida titulo="Mediana" valor={fmtNumero(calculo.mediana, 2)} />
                <Medida titulo="Moda" valor={textoModa} />
              </View>

              <DetalleCalculo
                filas={[
                  {
                    key: 'media',
                    label: 'Media = suma ÷ cantidad',
                    operacion: `${fmtNumero(calculo.suma)} ÷ ${calculo.n}`,
                    valor: fmtNumero(calculo.media, 2),
                  },
                  {
                    key: 'ordenados',
                    label: 'Datos ordenados',
                    operacion: calculo.ordenados.map((v) => fmtNumero(v)).join(' · '),
                    valor: '',
                  },
                  {
                    key: 'mediana',
                    label: 'Mediana',
                    operacion: calculo.opMediana,
                    valor: fmtNumero(calculo.mediana, 2),
                  },
                  {
                    key: 'moda',
                    label: 'Moda',
                    operacion:
                      calculo.moda.valores.length === 0
                        ? 'Ningún valor se repite más que otro'
                        : `Se repite ${calculo.moda.frecuencia} veces`,
                    valor: textoModa,
                  },
                  {
                    key: 'rango',
                    label: 'Rango (máx − mín)',
                    operacion: `${fmtNumero(calculo.max)} − ${fmtNumero(calculo.min)}`,
                    valor: fmtNumero(calculo.max - calculo.min),
                  },
                ]}
                total={{ label: 'Media', valor: fmtNumero(calculo.media, 2) }}
                tonoTotal="info"
              />

              <Text style={[styles.subtitulo, { color: colors.text }]}>Tabla de frecuencias</Text>
              <View style={[styles.tabla, { borderColor: colors.border }]}>
                <View style={[styles.tablaFila, styles.tablaHead]}>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>Valor</Text>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>f</Text>
                  <Text style={[styles.tablaCelda, styles.tablaHeadTexto]}>f. relativa</Text>
                </View>
                {calculo.frecuencias.map((f) => (
                  <View key={f.valor} style={[styles.tablaFila, { borderTopColor: colors.border }]}>
                    <Text style={[styles.tablaCelda, { color: colors.text }]}>{fmtNumero(f.valor)}</Text>
                    <Text style={[styles.tablaCelda, { color: colors.text }]}>{f.frecuencia}</Text>
                    <Text style={[styles.tablaCelda, { color: colors.textSecondary }]}>
                      {fmtNumero((f.frecuencia / calculo.n) * 100, 1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cuál conviene usar?"
            texto="La media usa todos los datos, pero un valor extremo la desplaza mucho. La mediana no se ve afectada por extremos. La moda sirve también para datos que no son números (colores, marcas)."
            formula="Media = Σxᵢ ÷ n"
            tip="Para la mediana, ¡ordena siempre los datos primero! Es el error más común en la PAES."
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

function Medida({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={styles.medida}>
      <Text style={styles.medidaTitulo}>{titulo.toUpperCase()}</Text>
      <Text style={styles.medidaValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
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
  trio: {
    flexDirection: 'row',
    gap: 8,
  },
  medida: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
  },
  medidaTitulo: {
    color: Acento.claro,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  medidaValor: {
    color: '#e0e7ff',
    fontSize: 18,
    fontWeight: '800',
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
    paddingHorizontal: 14,
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
