import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { DetalleCalculo, TarjetaResultado, TONOS, type Tono } from '@/components/calculadora/resultado';
import { Colors, Spacing } from '@/constants/theme';
import { leerEntero } from '@/lib/matematica';
import { guardarEnHistorial } from '@/lib/storage';
import { TABLAS_PAES, type PruebaPAES } from '@/lib/tablas-paes';

const CALC_ID = 'puntaje-paes';
const colors = Colors.dark;

const PRUEBAS: { id: PruebaPAES; tab: string; corto: string; nombre: string }[] = [
  { id: 'm1', tab: 'M1', corto: 'M1', nombre: 'Competencia Matemática 1 (M1)' },
  { id: 'm2', tab: 'M2', corto: 'M2', nombre: 'Competencia Matemática 2 (M2)' },
  { id: 'lectora', tab: 'Lect.', corto: 'Lectora', nombre: 'Competencia Lectora' },
  { id: 'ciencias', tab: 'Cien.', corto: 'Ciencias', nombre: 'Ciencias' },
  { id: 'historia', tab: 'Hist.', corto: 'Historia', nombre: 'Historia y Cs. Sociales' },
];

function nivel(puntaje: number): { tono: Tono; badge: string } {
  if (puntaje > 800) return { tono: 'ok', badge: 'Sobresaliente' };
  if (puntaje > 600) return { tono: 'ok', badge: 'Avanzado' };
  if (puntaje > 480) return { tono: 'info', badge: 'Intermedio' };
  return { tono: 'warning', badge: 'Inicial' };
}

export default function PuntajePaesScreen() {
  const [prueba, setPrueba] = useState<PruebaPAES>('m1');
  const [correctas, setCorrectas] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  const tabla = TABLAS_PAES[prueba];
  const max = tabla.length - 1;
  const info = PRUEBAS.find((p) => p.id === prueba)!;

  useEffect(() => {
    setGuardado(false);
  }, [prueba, correctas]);

  const n = leerEntero(correctas);
  const error =
    correctas.trim() !== '' && !(n >= 0 && n <= max) ? `Debe ser un entero entre 0 y ${max}` : null;

  const calculo = useMemo(() => {
    if (!Number.isInteger(n) || error) return null;
    const puntaje = tabla[n];
    return {
      puntaje,
      logro: (n / max) * 100,
      mas1: n < max ? tabla[n + 1] : null,
      menos1: n > 0 ? tabla[n - 1] : null,
      ...nivel(puntaje),
    };
  }, [n, error, tabla, max]);

  const cambiarPrueba = (p: PruebaPAES) => {
    setPrueba(p);
    setCorrectas('');
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    setCorrectas(String(Math.round(max * 0.65)));
    setCalculado(false);
  };

  const limpiar = () => {
    setCorrectas('');
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
      resultado: String(calculo.puntaje),
      resumen: `${info.corto} · ${n} de ${max} correctas`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;
  const chips = [0.5, 0.65, 0.8, 0.9].map((f) => String(Math.round(max * f)));

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
            Estima tu puntaje PAES (100 a 1000) según cuántas preguntas respondiste bien, con las
            tablas de conversión del DEMRE.
          </AvisoInfo>

          <Seccion
            titulo="Tu prueba"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <Segmentado
              label="Prueba"
              opciones={PRUEBAS.map((p) => ({ id: p.id, texto: p.tab }))}
              valor={prueba}
              onCambiar={cambiarPrueba}
            />
            <Text style={[styles.ayuda, { color: colors.textMuted }]}>
              {info.nombre} · {max} preguntas que puntúan
            </Text>

            <View style={styles.grupo}>
              <CampoNumero
                label="Respuestas correctas"
                value={correctas}
                onChangeText={setCorrectas}
                placeholder={`0 a ${max}`}
                sufijo={`/${max}`}
                error={error}
                maxLength={2}
              />
              <ChipsRapidos opciones={chips} valorActual={correctas} onElegir={setCorrectas} />
            </View>
          </Seccion>

          <BotonPrimario
            label="Calcular puntaje"
            icono="ribbon-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo={`Tu puntaje en ${info.corto}`}
              valor={String(calculo.puntaje)}
              tono={calculo.tono}
              badge={calculo.badge}
              descripcion="Estimación según la tabla oficial DEMRE del último proceso."
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <BarraPuntaje puntaje={calculo.puntaje} tono={calculo.tono} />

              <DetalleCalculo
                filas={[
                  {
                    key: 'logro',
                    label: 'Respuestas correctas',
                    operacion: `${n} de ${max}`,
                    valor: `${calculo.logro.toFixed(0)}%`,
                  },
                  ...(calculo.mas1 !== null
                    ? [{ key: 'mas', label: 'Con 1 correcta más', operacion: `${n + 1} correctas`, valor: `${calculo.mas1} (+${calculo.mas1 - calculo.puntaje})` }]
                    : []),
                  ...(calculo.menos1 !== null
                    ? [{ key: 'menos', label: 'Con 1 correcta menos', operacion: `${n - 1} correctas`, valor: `${calculo.menos1} (−${calculo.puntaje - calculo.menos1})` }]
                    : []),
                ]}
                total={{ label: 'Puntaje PAES', valor: String(calculo.puntaje) }}
                tonoTotal={calculo.tono}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula el puntaje?"
            texto="El DEMRE no suma puntos por pregunta: transforma la cantidad de respuestas correctas a una escala de 100 a 1000 con una tabla que depende del rendimiento de todos los que rindieron. Las preguntas malas no descuentan."
            formula="Puntaje = Tabla DEMRE [n° de correctas]"
            tip="Como las incorrectas no restan, nunca dejes preguntas en blanco: si no sabes, descarta alternativas y responde igual."
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

function BarraPuntaje({ puntaje, tono }: { puntaje: number; tono: Tono }) {
  const fraccion = (puntaje - 100) / 900;
  return (
    <View style={styles.barraWrap}>
      <View style={[styles.barraFondo, { backgroundColor: colors.backgroundElement }]}>
        <View style={[styles.barraRelleno, { width: `${Math.max(fraccion * 100, 2)}%`, backgroundColor: TONOS[tono].texto }]} />
      </View>
      <View style={styles.barraEtiquetas}>
        {['100', '480', '600', '800', '1000'].map((t) => (
          <Text key={t} style={[styles.barraEtiqueta, { color: colors.textMuted }]}>{t}</Text>
        ))}
      </View>
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
    marginTop: -8,
  },
  grupo: {
    gap: 10,
  },
  barraWrap: {
    gap: 6,
  },
  barraFondo: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: 999,
  },
  barraEtiquetas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barraEtiqueta: {
    fontSize: 10,
    fontWeight: '600',
  },
});
