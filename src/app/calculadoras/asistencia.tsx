import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CampoNumero, ChipsRapidos } from '@/components/calculadora/campos';
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
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'asistencia';
const colors = Colors.dark;

function aEntero(txt: string): number {
  return txt.trim() === '' ? NaN : Number(txt.trim());
}

function fmt(n: number, decimales = 1): string {
  return String(parseFloat(n.toFixed(decimales)));
}

export default function AsistenciaScreen() {
  const [totales, setTotales] = useState('');
  const [requerida, setRequerida] = useState('85');
  const [realizadas, setRealizadas] = useState('');
  const [faltas, setFaltas] = useState('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [totales, requerida, realizadas, faltas]);

  const t = aEntero(totales);
  const r = aEntero(requerida);
  const h = aEntero(realizadas);
  const f = aEntero(faltas);

  const esEnteroNoNeg = (n: number) => Number.isInteger(n) && n >= 0;

  const errores = {
    totales: totales.trim() !== '' && !(Number.isInteger(t) && t > 0) ? 'Debe ser un número entero mayor a 0' : null,
    requerida: requerida.trim() !== '' && !(r > 0 && r <= 100) ? 'Debe estar entre 1 y 100%' : null,
    realizadas:
      realizadas.trim() === '' ? null
      : !esEnteroNoNeg(h) ? 'Debe ser un número entero'
      : Number.isFinite(t) && h > t ? 'No puede superar el total de clases'
      : null,
    faltas:
      faltas.trim() === '' ? null
      : !esEnteroNoNeg(f) ? 'Debe ser un número entero'
      : Number.isFinite(h) && f > h ? 'No puede superar las clases realizadas'
      : null,
  };
  const hayError = Object.values(errores).some(Boolean);

  const calculo = useMemo(() => {
    if (![t, r, h, f].every(Number.isFinite) || hayError) return null;

    const asistidas = h - f;
    const actual = h > 0 ? (asistidas / h) * 100 : 100;
    const maximas = Math.floor(t * (1 - r / 100));
    const restantes = maximas - f;
    const proyectada = ((t - f) / t) * 100;
    return { asistidas, actual, maximas, restantes, proyectada };
  }, [t, r, h, f, hayError]);

  const estado = useMemo((): { tono: Tono; badge: string; descripcion: string } | null => {
    if (!calculo) return null;
    if (calculo.restantes > 0) {
      return {
        tono: 'ok',
        badge: 'Vas bien',
        descripcion: `Puedes faltar ${calculo.restantes} ${calculo.restantes === 1 ? 'clase' : 'clases'} más sin bajar del ${r}%.`,
      };
    }
    if (calculo.restantes === 0) {
      return { tono: 'warning', badge: 'Al límite', descripcion: 'Estás justo en el límite: no puedes faltar más.' };
    }
    return {
      tono: 'error',
      badge: 'Límite superado',
      descripcion: `Superaste el máximo por ${Math.abs(calculo.restantes)} ${Math.abs(calculo.restantes) === 1 ? 'falta' : 'faltas'}. Habla con tu profesor o coordinación.`,
    };
  }, [calculo, r]);

  const cargarEjemplo = () => {
    setTotales('40');
    setRequerida('85');
    setRealizadas('20');
    setFaltas('3');
    setCalculado(false);
  };

  const limpiar = () => {
    setTotales('');
    setRequerida('85');
    setRealizadas('');
    setFaltas('');
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
      resultado: String(Math.max(calculo.restantes, 0)),
      resumen: `Faltas disponibles · ${f} de ${calculo.maximas} usadas · mínimo ${r}%`,
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && calculo !== null && estado !== null;

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
            Averigua cuántas clases más puedes faltar sin quedar bajo la asistencia mínima de tu
            ramo o curso.
          </AvisoInfo>

          <Seccion
            titulo="Tu ramo"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.fila2}>
              <View style={styles.col}>
                <CampoNumero
                  label="Clases totales"
                  value={totales}
                  onChangeText={setTotales}
                  placeholder="Ej: 40"
                  error={errores.totales}
                  maxLength={4}
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label="Asistencia mínima"
                  value={requerida}
                  onChangeText={setRequerida}
                  placeholder="85"
                  sufijo="%"
                  error={errores.requerida}
                  maxLength={3}
                />
              </View>
            </View>
            <ChipsRapidos opciones={['70', '75', '80', '85', '90']} valorActual={requerida} onElegir={setRequerida} />

            <View style={styles.fila2}>
              <View style={styles.col}>
                <CampoNumero
                  label="Clases hechas"
                  value={realizadas}
                  onChangeText={setRealizadas}
                  placeholder="Ej: 20"
                  error={errores.realizadas}
                  ayuda="Hasta hoy"
                  maxLength={4}
                />
              </View>
              <View style={styles.col}>
                <CampoNumero
                  label="Tus faltas"
                  value={faltas}
                  onChangeText={setFaltas}
                  placeholder="Ej: 3"
                  error={errores.faltas}
                  ayuda="Inasistencias"
                  maxLength={4}
                />
              </View>
            </View>
          </Seccion>

          <BotonPrimario
            label="Calcular asistencia"
            icono="calendar-outline"
            onPress={calcular}
            deshabilitado={calculo === null}
          />

          {mostrarResultado && calculo && estado && (
            <TarjetaResultado
              titulo="Faltas que te quedan"
              valor={String(Math.max(calculo.restantes, 0))}
              tono={estado.tono}
              badge={estado.badge}
              descripcion={estado.descripcion}
              onLayout={(e) => {
                resultadoY.current = e.nativeEvent.layout.y;
              }}>
              <BarraAsistencia proyectada={calculo.proyectada} requerida={r} tono={estado.tono} />

              <DetalleCalculo
                filas={[
                  {
                    key: 'actual',
                    label: 'Asistencia actual',
                    operacion: `${calculo.asistidas} de ${h} clases`,
                    valor: `${fmt(calculo.actual)}%`,
                  },
                  {
                    key: 'max',
                    label: 'Faltas máximas del ramo',
                    operacion: `${t} × (100% − ${r}%), sin decimales`,
                    valor: String(calculo.maximas),
                  },
                  {
                    key: 'usadas',
                    label: 'Faltas que ya tienes',
                    valor: String(f),
                  },
                ]}
                total={{
                  label: 'Te quedan',
                  valor: `${calculo.maximas} − ${f} = ${calculo.restantes}`,
                }}
                tonoTotal={estado.tono}
              />
            </TarjetaResultado>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula?"
            texto="Las faltas máximas son el total de clases multiplicado por el porcentaje que puedes faltar (100% menos la asistencia mínima), redondeado hacia abajo. A eso se le restan las faltas que ya tienes."
            formula="Faltas disponibles = ⌊Total × (1 − %mín)⌋ − Faltas"
            tip="Guarda un par de faltas de reserva para imprevistos como enfermedad o trámites: no gastes todas las disponibles."
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

/** Asistencia proyectada al final del ramo (si no faltas más) vs. el mínimo. */
function BarraAsistencia({ proyectada, requerida, tono }: { proyectada: number; requerida: number; tono: Tono }) {
  const t = TONOS[tono];
  const ancho = Math.min(Math.max(proyectada, 0), 100);

  return (
    <View style={styles.barraWrap}>
      <View style={[styles.barraFondo, { backgroundColor: colors.backgroundElement }]}>
        <View style={[styles.barraRelleno, { width: `${ancho}%`, backgroundColor: t.texto }]} />
        <View style={[styles.marcaMinimo, { left: `${requerida}%`, backgroundColor: colors.text }]} />
      </View>
      <View style={styles.barraEtiquetas}>
        <Text style={[styles.barraEtiqueta, { color: colors.textMuted }]}>
          Al final del ramo: {fmt(proyectada)}% si no faltas más
        </Text>
        <Text style={[styles.barraEtiqueta, { color: colors.textMuted }]}>Mín. {requerida}%</Text>
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
  fila2: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  barraWrap: {
    gap: 6,
  },
  barraFondo: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: 999,
  },
  marcaMinimo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  barraEtiquetas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  barraEtiqueta: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
});
