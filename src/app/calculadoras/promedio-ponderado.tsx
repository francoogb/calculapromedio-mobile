import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonAgregar,
  BotonPildora,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import { DetalleCalculo, TarjetaResultado } from '@/components/calculadora/resultado';
import { Colors, Spacing } from '@/constants/theme';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'promedio-ponderado';
const colors = Colors.dark;

/** Colores del número de cada evaluación (se repiten en ciclo). */
const COLORES_FILA = ['#9d174d', '#1d4ed8', '#5b21b6', '#0f766e', '#b45309'];

type Fila = {
  id: string;
  nombre: string;
  nota: string;
  porcentaje: string;
};

function nuevaFila(nombre: string, nota = '', porcentaje = ''): Fila {
  return { id: Math.random().toString(36).slice(2, 9), nombre, nota, porcentaje };
}

function filasIniciales(): Fila[] {
  return [
    nuevaFila('Evaluación 1', '', '30'),
    nuevaFila('Evaluación 2', '', '30'),
    nuevaFila('Evaluación 3', '', '40'),
  ];
}

function filasEjemplo(): Fila[] {
  return [
    nuevaFila('Control 1', '6.5', '30'),
    nuevaFila('Prueba 1', '5.0', '40'),
    nuevaFila('Trabajo', '6.0', '30'),
  ];
}

function aNumero(txt: string): number {
  return parseFloat(txt.replace(',', '.'));
}

function notaValida(n: number): boolean {
  return Number.isFinite(n) && n >= 1 && n <= 7;
}

// 30.00 → "30", 12.50 → "12.5"
function formatearPct(n: number): string {
  return String(parseFloat(n.toFixed(2)));
}

export default function PromedioPonderadoScreen() {
  const [filas, setFilas] = useState<Fila[]>(filasIniciales);
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  // Cualquier cambio en los datos invalida el "Guardado"
  useEffect(() => {
    setGuardado(false);
  }, [filas]);

  const calculo = useMemo(() => {
    let sumaPorcentaje = 0;
    let sumaAportes = 0;
    let pesoValido = 0;
    const detalle: { id: string; nombre: string; nota: number; pct: number; aporte: number }[] = [];

    for (const f of filas) {
      const n = aNumero(f.nota);
      const p = aNumero(f.porcentaje);
      if (Number.isFinite(p) && p > 0) sumaPorcentaje += p;
      if (notaValida(n) && Number.isFinite(p) && p > 0) {
        const aporte = (n * p) / 100;
        sumaAportes += aporte;
        pesoValido += p;
        detalle.push({ id: f.id, nombre: f.nombre.trim() || 'Sin nombre', nota: n, pct: p, aporte });
      }
    }

    // Si los pesos no suman 100, se normaliza sobre el peso ingresado
    const promedio = pesoValido > 0 ? sumaAportes / (pesoValido / 100) : null;

    return {
      promedio,
      sumaPorcentaje,
      sumaAportes,
      pesoValido,
      detalle,
      normalizado: promedio !== null && Math.abs(pesoValido - 100) >= 0.01,
    };
  }, [filas]);

  const estadoTotal: 'vacio' | 'ok' | 'falta' | 'excede' =
    calculo.sumaPorcentaje === 0
      ? 'vacio'
      : Math.abs(calculo.sumaPorcentaje - 100) < 0.01
      ? 'ok'
      : calculo.sumaPorcentaje < 100
      ? 'falta'
      : 'excede';

  const actualizar = (id: string, campo: keyof Omit<Fila, 'id'>, valor: string) => {
    setFilas((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  };

  const agregar = () => {
    setFilas((prev) => [...prev, nuevaFila(`Evaluación ${prev.length + 1}`)]);
  };

  const eliminar = (id: string) => {
    setFilas((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)));
  };

  const limpiar = () => {
    setFilas(filasIniciales());
    setCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const cargarEjemplo = () => {
    setFilas(filasEjemplo());
    setCalculado(false);
  };

  const calcular = () => {
    setCalculado(true);
    // Espera a que la tarjeta de resultado se monte y mida
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(resultadoY.current - Spacing.three, 0), animated: true });
    }, 80);
  };

  const guardar = async () => {
    if (calculo.promedio === null) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: calculo.promedio.toFixed(2),
      resumen: `${calculo.detalle.length} evaluaciones · ${formatearPct(calculo.sumaPorcentaje)}%`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo.promedio !== null;
  const aprobado = calculo.promedio !== null && calculo.promedio >= 4;

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
            El total de los porcentajes debe ser 100% para obtener un resultado correcto.
          </AvisoInfo>

          {/* EVALUACIONES */}
          <Seccion
            titulo="Evaluaciones"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            {filas.map((fila, index) => {
              const n = aNumero(fila.nota);
              const notaFueraDeRango = fila.nota.trim() !== '' && !notaValida(n);
              const unica = filas.length <= 1;

              return (
                <View key={fila.id} style={styles.fila}>
                  <View
                    style={[
                      styles.numero,
                      { backgroundColor: COLORES_FILA[index % COLORES_FILA.length] },
                    ]}>
                    <Text style={styles.numeroTexto}>{index + 1}</Text>
                  </View>

                  <View style={styles.filaCuerpo}>
                    <View style={styles.filaTop}>
                      <TextInput
                        value={fila.nombre}
                        onChangeText={(t) => actualizar(fila.id, 'nombre', t)}
                        placeholder={`Evaluación ${index + 1}`}
                        placeholderTextColor={colors.textMuted}
                        style={[styles.nombreInput, { color: colors.text }]}
                        maxLength={28}
                      />
                      <Pressable
                        disabled={unica}
                        onPress={() => eliminar(fila.id)}
                        hitSlop={8}
                        accessibilityLabel="Eliminar evaluación"
                        style={({ pressed }) => [
                          styles.eliminar,
                          { opacity: unica ? 0.3 : pressed ? 0.6 : 1 },
                        ]}>
                        <Ionicons name="trash-outline" size={20} color="#a5b4fc" />
                      </Pressable>
                    </View>

                    <View style={styles.filaInputs}>
                      <TextInput
                        value={fila.nota}
                        onChangeText={(t) => actualizar(fila.id, 'nota', t)}
                        placeholder="Nota"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        maxLength={4}
                        style={[
                          styles.input,
                          styles.inputNota,
                          {
                            color: colors.text,
                            borderColor: notaFueraDeRango ? colors.danger : colors.border,
                          },
                        ]}
                      />
                      <View
                        style={[styles.input, styles.inputPctWrap, { borderColor: colors.border }]}>
                        <TextInput
                          value={fila.porcentaje}
                          onChangeText={(t) => actualizar(fila.id, 'porcentaje', t)}
                          placeholder="Peso"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="decimal-pad"
                          maxLength={5}
                          style={[styles.inputPct, { color: colors.text }]}
                        />
                        <View style={[styles.sufijo, { borderLeftColor: colors.border }]}>
                          <Text style={[styles.sufijoTexto, { color: colors.textMuted }]}>%</Text>
                        </View>
                      </View>
                    </View>

                    {notaFueraDeRango && (
                      <Text style={[styles.errorTexto, { color: colors.danger }]}>
                        La nota debe estar entre 1.0 y 7.0
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}

            <BotonAgregar label="Agregar evaluación" onPress={agregar} />
          </Seccion>

          {/* TOTAL DE PORCENTAJE */}
          <TarjetaTotal estado={estadoTotal} suma={calculo.sumaPorcentaje} />

          <BotonPrimario
            label="Calcular promedio"
            icono="calculator-outline"
            onPress={calcular}
            deshabilitado={calculo.promedio === null}
          />

          {/* RESULTADO */}
          {mostrarResultado && calculo.promedio !== null && (
            <TarjetaResultado
              titulo="Tu promedio final es"
              valor={calculo.promedio.toFixed(2)}
              tono={aprobado ? 'ok' : 'error'}
              badge={aprobado ? 'Aprobado' : 'Bajo 4.0'}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <DetalleCalculo
                filas={[
                  ...calculo.detalle.map((d) => ({
                    key: d.id,
                    label: d.nombre,
                    operacion: `${d.nota.toFixed(1)} × ${formatearPct(d.pct)}%`,
                    valor: d.aporte.toFixed(2),
                  })),
                  ...(calculo.normalizado
                    ? [
                        {
                          key: 'normalizado',
                          label: 'Los pesos no suman 100%',
                          operacion: `${calculo.sumaAportes.toFixed(2)} ÷ ${formatearPct(calculo.pesoValido)}%`,
                          valor: calculo.promedio.toFixed(2),
                          tono: 'warning' as const,
                        },
                      ]
                    : []),
                ]}
                total={{ label: 'Promedio final', valor: calculo.promedio.toFixed(2) }}
                tonoTotal={aprobado ? 'ok' : 'error'}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula el promedio ponderado?"
            texto="Cada nota se multiplica por su peso (en porcentaje) y luego se suman esos aportes. A diferencia del promedio simple, las evaluaciones con más peso influyen más en la nota final."
            formula="Promedio = (N₁ × %₁) + (N₂ × %₂) + …"
            tip="Si aún te falta una evaluación, usa la calculadora de Nota Necesaria para saber cuánto necesitas sacar para llegar a tu meta."
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

function TarjetaTotal({
  estado,
  suma,
}: {
  estado: 'vacio' | 'ok' | 'falta' | 'excede';
  suma: number;
}) {
  const config = {
    vacio: {
      color: colors.textMuted,
      bg: colors.surface,
      borde: colors.border,
      icono: 'ellipse-outline' as const,
      sub: 'Ingresa el peso de cada evaluación.',
    },
    ok: {
      color: colors.resultado,
      bg: colors.resultadoBg,
      borde: colors.resultadoBorder,
      icono: 'checkmark-circle' as const,
      sub: 'Suma de todas las evaluaciones.',
    },
    falta: {
      color: colors.warning,
      bg: 'rgba(251,191,36,0.10)',
      borde: 'rgba(251,191,36,0.35)',
      icono: 'alert-circle' as const,
      sub: `Faltan ${formatearPct(100 - suma)}% para llegar a 100%.`,
    },
    excede: {
      color: '#f87171',
      bg: 'rgba(239,68,68,0.10)',
      borde: 'rgba(239,68,68,0.35)',
      icono: 'close-circle' as const,
      sub: `Te pasaste por ${formatearPct(suma - 100)}%.`,
    },
  }[estado];

  return (
    <View style={[styles.total, { backgroundColor: config.bg, borderColor: config.borde }]}>
      <Ionicons name={config.icono} size={36} color={config.color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.totalTitulo, { color: colors.text }]}>Total de porcentaje</Text>
        <Text style={[styles.totalSub, { color: colors.textSecondary }]}>{config.sub}</Text>
      </View>
      <Text style={[styles.totalValor, { color: config.color }]}>{formatearPct(suma)}%</Text>
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

  // Fila de evaluación
  fila: {
    flexDirection: 'row',
    gap: 12,
  },
  numero: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numeroTexto: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  filaCuerpo: {
    flex: 1,
    gap: 8,
  },
  filaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nombreInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
  eliminar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  inputNota: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputPctWrap: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputPct: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  sufijo: {
    width: 42,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  sufijoTexto: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorTexto: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Total
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1,
  },
  totalTitulo: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  totalValor: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

});
