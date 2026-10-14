import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CampoNumero, Segmentado } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
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
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'conversor-escalas';
const colors = Colors.dark;

type EscalaId = '1-7' | '0-10' | '0-20' | '0-100' | '1-5';

const ESCALAS: Record<EscalaId, { min: number; max: number; invertida: boolean; corto: string; nombre: string }> = {
  '1-7': { min: 1, max: 7, invertida: false, corto: '1–7', nombre: 'Chile (1 a 7)' },
  '0-10': { min: 0, max: 10, invertida: false, corto: '0–10', nombre: 'España (0 a 10)' },
  '0-20': { min: 0, max: 20, invertida: false, corto: '0–20', nombre: 'Perú / Francia (0 a 20)' },
  '0-100': { min: 0, max: 100, invertida: false, corto: '0–100', nombre: 'EE.UU. / % (0 a 100)' },
  '1-5': { min: 1, max: 5, invertida: true, corto: '1–5', nombre: 'Alemania (1 a 5, invertida)' },
};

const ORDEN: EscalaId[] = ['1-7', '0-10', '0-20', '0-100', '1-5'];
const OPCIONES = ORDEN.map((id) => ({ id, texto: ESCALAS[id].corto }));

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

function fmt(n: number, decimales = 2): string {
  return String(parseFloat(n.toFixed(decimales)));
}

/** Posición de la nota dentro de su escala: 0 = peor, 1 = mejor. */
function aFraccion(nota: number, id: EscalaId): number {
  const e = ESCALAS[id];
  return e.invertida ? (e.max - nota) / (e.max - e.min) : (nota - e.min) / (e.max - e.min);
}

function desdeFraccion(fraccion: number, id: EscalaId): number {
  const e = ESCALAS[id];
  return e.invertida ? e.max - fraccion * (e.max - e.min) : e.min + fraccion * (e.max - e.min);
}

export default function ConversorEscalasScreen() {
  const [desde, setDesde] = useState<EscalaId>('1-7');
  const [hacia, setHacia] = useState<EscalaId>('0-100');
  const [nota, setNota] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [desde, hacia, nota]);

  const n = aNumero(nota);
  const eDesde = ESCALAS[desde];
  const error =
    nota.trim() !== '' && !(n >= eDesde.min && n <= eDesde.max)
      ? `Debe estar entre ${eDesde.min} y ${eDesde.max}`
      : null;

  const calculo = useMemo(() => {
    if (!Number.isFinite(n) || error) return null;
    const fraccion = aFraccion(n, desde);
    return { fraccion, convertida: desdeFraccion(fraccion, hacia) };
  }, [n, desde, hacia, error]);

  const cambiarDesde = (id: EscalaId) => {
    setDesde(id);
    setNota('');
    setCalculado(false);
  };

  const intercambiar = () => {
    // Si ya hay resultado, la nota convertida pasa a ser la nota de origen
    if (calculo) setNota(fmt(calculo.convertida));
    else setNota('');
    setDesde(hacia);
    setHacia(desde);
  };

  const cargarEjemplo = () => {
    setDesde('1-7');
    setHacia('0-100');
    setNota('5.5');
    setCalculado(false);
  };

  const limpiar = () => {
    setNota('');
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
      resultado: fmt(calculo.convertida),
      resumen: `${fmt(n)} (${eDesde.corto}) → escala ${ESCALAS[hacia].corto}`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null;

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
            Convierte una nota entre escalas de distintos países. La conversión es proporcional:
            mantiene la misma posición relativa dentro de la escala.
          </AvisoInfo>

          <Seccion
            titulo="Tu nota"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <Segmentado label="Escala de origen" opciones={OPCIONES} valor={desde} onCambiar={cambiarDesde} />

            <CampoNumero
              label={`Nota en ${eDesde.nombre}`}
              value={nota}
              onChangeText={setNota}
              placeholder={desde === '1-7' ? 'Ej: 5.5' : `Entre ${eDesde.min} y ${eDesde.max}`}
              error={error}
            />

            <View style={styles.intercambiarFila}>
              <View style={[styles.linea, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={intercambiar}
                hitSlop={8}
                accessibilityLabel="Intercambiar escalas"
                style={({ pressed }) => [styles.intercambiar, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="swap-vertical" size={20} color={Acento.claro} />
              </Pressable>
              <View style={[styles.linea, { backgroundColor: colors.border }]} />
            </View>

            <Segmentado
              label="Escala de destino"
              opciones={OPCIONES}
              valor={hacia}
              onCambiar={(id) => setHacia(id)}
            />
            <Text style={[styles.ayuda, { color: colors.textMuted }]}>{ESCALAS[hacia].nombre}</Text>
          </Seccion>

          <BotonPrimario
            label="Convertir"
            icono="swap-horizontal"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && (
            <TarjetaResultado
              titulo="Tu nota equivale a"
              valor={fmt(calculo.convertida)}
              tono="info"
              badge={`Escala ${ESCALAS[hacia].corto}`}
              descripcion={`${fmt(n)} en ${eDesde.nombre} = ${fmt(calculo.convertida)} en ${ESCALAS[hacia].nombre}`}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  {
                    key: 'pos',
                    label: 'Posición dentro de la escala',
                    operacion: eDesde.invertida
                      ? `(${eDesde.max} − ${fmt(n)}) ÷ (${eDesde.max} − ${eDesde.min})`
                      : `(${fmt(n)} − ${eDesde.min}) ÷ (${eDesde.max} − ${eDesde.min})`,
                    valor: `${fmt(calculo.fraccion * 100, 1)}%`,
                  },
                  ...ORDEN.filter((id) => id !== desde && id !== hacia).map((id) => ({
                    key: id,
                    label: `En ${ESCALAS[id].nombre}`,
                    valor: fmt(desdeFraccion(calculo.fraccion, id)),
                  })),
                ]}
                total={{ label: `En ${ESCALAS[hacia].nombre}`, valor: fmt(calculo.convertida) }}
                tonoTotal="info"
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se convierte?"
            texto="Se calcula en qué porcentaje de la escala original está tu nota y se ubica en el mismo porcentaje de la escala de destino. En la escala alemana (1 a 5) el 1 es la mejor nota, por eso se invierte."
            formula="Nota destino = mín + Posición × (máx − mín)"
            tip="Es una conversión matemática aproximada. Universidades y becas en el extranjero suelen usar sus propias tablas oficiales: confírmalas antes de postular."
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
  intercambiarFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linea: {
    flex: 1,
    height: 1,
  },
  intercambiar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Acento.borde,
    backgroundColor: Acento.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayuda: {
    fontSize: 12,
    marginTop: -8,
  },
});
