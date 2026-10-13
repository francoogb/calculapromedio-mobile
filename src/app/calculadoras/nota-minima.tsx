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
import {
  DetalleCalculo,
  TarjetaResultado,
  TONOS,
  type Tono,
} from '@/components/calculadora/resultado';
import { Colors, Spacing } from '@/constants/theme';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'nota-minima';
const colors = Colors.dark;

type Escala = '7' | '10' | '20' | '100';

const ESCALAS: Record<Escala, { max: number; min: number; texto: string; metas: string[]; ejemplo: string }> = {
  '7': { max: 7, min: 1, texto: '1–7', metas: ['4.0', '5.0', '5.5', '6.0'], ejemplo: '5.0' },
  '10': { max: 10, min: 0, texto: '0–10', metas: ['5', '6', '7', '8'], ejemplo: '7' },
  '20': { max: 20, min: 0, texto: '0–20', metas: ['10', '12', '14', '16'], ejemplo: '14' },
  '100': { max: 100, min: 0, texto: '0–100', metas: ['60', '70', '80', '90'], ejemplo: '70' },
};

const PESOS_RAPIDOS = ['20', '30', '40', '50'];

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

// 6.250 → "6.25", 30.0 → "30"
function fmt(n: number, decimales = 2): string {
  return String(parseFloat(n.toFixed(decimales)));
}

function dificultad(porcentaje: number): { tono: Tono; badge: string; texto: string } {
  if (porcentaje < 50) return { tono: 'ok', badge: 'Fácil', texto: 'Muy fácil de alcanzar.' };
  if (porcentaje < 70) return { tono: 'info', badge: 'Alcanzable', texto: 'Alcanzable con estudio moderado.' };
  if (porcentaje < 85) return { tono: 'warning', badge: 'Exigente', texto: 'Requiere estudio intenso.' };
  return { tono: 'error', badge: 'Muy desafiante', texto: 'Meta muy desafiante: prepárate a fondo.' };
}

export default function NotaNecesariaScreen() {
  const [escala, setEscala] = useState<Escala>('7');
  const [actual, setActual] = useState('');
  const [meta, setMeta] = useState('');
  const [peso, setPeso] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  const { max, min } = ESCALAS[escala];

  useEffect(() => {
    setGuardado(false);
  }, [escala, actual, meta, peso]);

  // Validación por campo: solo se muestra error si el campo tiene algo escrito
  const errores = useMemo(() => {
    const a = aNumero(actual);
    const m = aNumero(meta);
    const p = aNumero(peso);
    return {
      actual:
        actual.trim() === '' ? null
        : !Number.isFinite(a) || a < min || a > max ? `Debe estar entre ${min} y ${max}`
        : null,
      meta:
        meta.trim() === '' ? null
        : !Number.isFinite(m) || m < min || m > max ? `Debe estar entre ${min} y ${max}`
        : null,
      peso:
        peso.trim() === '' ? null
        : !Number.isFinite(p) || p <= 0 || p >= 100 ? 'Debe estar entre 1 y 99%'
        : null,
    };
  }, [actual, meta, peso, min, max]);

  const calculo = useMemo(() => {
    const a = aNumero(actual);
    const m = aNumero(meta);
    const p = aNumero(peso);
    const completos = [a, m, p].every(Number.isFinite);
    if (!completos || errores.actual || errores.meta || errores.peso) return null;

    const pesoActual = 100 - p;
    const aporte = (a * pesoActual) / 100;
    const falta = m - aporte;
    const necesaria = (falta * 100) / p;

    return { a, m, p, pesoActual, aporte, falta, necesaria };
  }, [actual, meta, peso, errores]);

  // Clasificación del resultado
  const resultado = useMemo(() => {
    if (!calculo) return null;
    const { necesaria } = calculo;
    if (necesaria > max) {
      return {
        valor: 'Imposible',
        tono: 'error' as Tono,
        badge: 'Fuera de alcance',
        descripcion: `Necesitarías ${fmt(necesaria)}, pero la nota máxima es ${max}. Ajusta tu meta.`,
        guardar: 'Imposible',
      };
    }
    if (necesaria <= min) {
      return {
        valor: '¡Meta alcanzada!',
        tono: 'ok' as Tono,
        badge: 'Asegurada',
        descripcion: 'Incluso con la nota mínima llegas a tu meta.',
        guardar: 'Asegurada',
      };
    }
    const d = dificultad((necesaria / max) * 100);
    return {
      valor: fmt(necesaria),
      tono: d.tono,
      badge: d.badge,
      descripcion: `Necesitas sacar ${fmt(necesaria)} en tu examen. ${d.texto}`,
      guardar: fmt(necesaria),
    };
  }, [calculo, max, min]);

  const cambiarEscala = (e: Escala) => {
    setEscala(e);
    setActual('');
    setMeta('');
    setCalculado(false);
  };

  const cargarEjemplo = () => {
    setEscala('7');
    setActual('4.6');
    setMeta('5.0');
    setPeso('40');
    setCalculado(false);
  };

  const limpiar = () => {
    setActual('');
    setMeta('');
    setPeso('');
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
    if (!calculo || !resultado) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: resultado.guardar,
      resumen: `Llevas ${fmt(calculo.a)} · meta ${fmt(calculo.m)} · examen ${fmt(calculo.p)}%`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null && resultado !== null;

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
            Ingresa tu promedio actual, la nota que quieres terminar teniendo y cuánto vale el
            examen que te falta.
          </AvisoInfo>

          <Seccion
            titulo="Tus datos"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <Segmentado
              label="Escala de notas"
              opciones={(Object.keys(ESCALAS) as Escala[]).map((id) => ({ id, texto: ESCALAS[id].texto }))}
              valor={escala}
              onCambiar={cambiarEscala}
            />

            <CampoNumero
              label="Promedio actual"
              value={actual}
              onChangeText={setActual}
              placeholder={`Ej: ${escala === '7' ? '4.6' : ESCALAS[escala].ejemplo}`}
              error={errores.actual}
              ayuda="Tu nota acumulada antes del examen."
            />

            <View style={styles.grupo}>
              <CampoNumero
                label="Promedio que quieres lograr"
                value={meta}
                onChangeText={setMeta}
                placeholder={`Ej: ${ESCALAS[escala].ejemplo}`}
                error={errores.meta}
              />
              <ChipsRapidos opciones={ESCALAS[escala].metas} valorActual={meta} onElegir={setMeta} />
            </View>

            <View style={styles.grupo}>
              <CampoNumero
                label="Peso del examen"
                value={peso}
                onChangeText={setPeso}
                placeholder="Ej: 40"
                sufijo="%"
                maxLength={5}
                error={errores.peso}
              />
              <ChipsRapidos
                opciones={PESOS_RAPIDOS}
                valorActual={peso}
                onElegir={setPeso}
              />
            </View>
          </Seccion>

          <BotonPrimario
            label="Calcular nota"
            icono="flash-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && resultado && (
            <TarjetaResultado
              titulo="En tu examen necesitas"
              valor={resultado.valor}
              tono={resultado.tono}
              badge={resultado.badge}
              descripcion={resultado.descripcion}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <BarraDificultad necesaria={calculo.necesaria} min={min} max={max} tono={resultado.tono} />

              <DetalleCalculo
                filas={[
                  {
                    key: 'aporte',
                    label: 'Lo que ya llevas',
                    operacion: `${fmt(calculo.a)} × ${fmt(calculo.pesoActual)}%`,
                    valor: fmt(calculo.aporte),
                  },
                  {
                    key: 'falta',
                    label: 'Lo que te falta para la meta',
                    operacion: `${fmt(calculo.m)} − ${fmt(calculo.aporte)}`,
                    valor: fmt(calculo.falta),
                  },
                  {
                    key: 'division',
                    label: 'Repartido en el examen',
                    operacion: `${fmt(calculo.falta)} ÷ ${fmt(calculo.p)}%`,
                    valor: fmt(calculo.necesaria),
                  },
                ]}
                total={{ label: 'Nota necesaria', valor: fmt(calculo.necesaria) }}
                tonoTotal={resultado.tono}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula la nota necesaria?"
            texto="Primero se calcula cuánto aporta lo que ya tienes según su peso. Lo que falta para llegar a tu meta se divide por el peso del examen."
            formula="Nota = (Meta − Actual × %actual) ÷ %examen"
            tip="Si el resultado sale imposible, prueba bajar un poco la meta o revisa si hay otra evaluación pendiente que también puedas mejorar."
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

/** Barra horizontal: dónde cae la nota necesaria dentro de la escala. */
function BarraDificultad({
  necesaria,
  min,
  max,
  tono,
}: {
  necesaria: number;
  min: number;
  max: number;
  tono: Tono;
}) {
  const fraccion = Math.min(Math.max((necesaria - min) / (max - min), 0), 1);
  const t = TONOS[tono];

  return (
    <View style={styles.barraWrap}>
      <View style={[styles.barraFondo, { backgroundColor: colors.backgroundElement }]}>
        <View
          style={[
            styles.barraRelleno,
            { width: `${Math.max(fraccion * 100, 3)}%`, backgroundColor: t.texto },
          ]}
        />
      </View>
      <View style={styles.barraEtiquetas}>
        <Text style={[styles.barraEtiqueta, { color: colors.textMuted }]}>{min}</Text>
        <Text style={[styles.barraEtiqueta, { color: colors.textMuted }]}>Nota máxima {max}</Text>
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
    fontSize: 11,
    fontWeight: '600',
  },
});
