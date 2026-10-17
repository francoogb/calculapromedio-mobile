import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CampoNumero } from '@/components/calculadora/campos';
import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import {
  AvisoInfo,
  BarraAcciones,
  BotonPildora,
  BotonPrimario,
  ExplicacionPlegable,
  Seccion,
} from '@/components/calculadora/piezas';
import { TarjetaResultado, TONOS, type Tono } from '@/components/calculadora/resultado';
import { Acento, Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { CARRERAS, type Carrera } from '@/lib/carreras';
import { leerNumero } from '@/lib/matematica';
import { useRestaurarEntrada } from '@/hooks/use-restaurar-entrada';
import { guardarEnHistorial } from '@/lib/storage';

const CALC_ID = 'simulador-postulacion';
const colors = Colors.dark;

type Clave = 'nem' | 'm1' | 'l' | 'm2' | 'h' | 'c';

const CAMPOS: { clave: Clave; label: string; obligatorio: boolean }[] = [
  { clave: 'nem', label: 'NEM / Ranking', obligatorio: true },
  { clave: 'm1', label: 'Matemática M1', obligatorio: true },
  { clave: 'l', label: 'C. Lectora', obligatorio: true },
  { clave: 'm2', label: 'Matemática M2', obligatorio: false },
  { clave: 'h', label: 'Historia', obligatorio: false },
  { clave: 'c', label: 'Ciencias', obligatorio: false },
];

const NOMBRE_CORTO: Record<Clave, string> = { nem: 'NEM', m1: 'M1', l: 'Lectora', m2: 'M2', h: 'Historia', c: 'Ciencias' };

type Estado = 'alcanza' | 'cerca' | 'no_alcanza';
const ESTADO: Record<Estado, { tono: Tono; texto: string }> = {
  alcanza: { tono: 'ok', texto: 'Alcanzas' },
  cerca: { tono: 'warning', texto: 'Cerca' },
  no_alcanza: { tono: 'error', texto: 'Bajo el corte' },
};

type Resultado = Carrera & { id: number; puntaje: number; diff: number; estado: Estado; faltan: string[] };

type Puntajes = Record<Clave, string>;
const VACIO: Puntajes = { nem: '', m1: '', l: '', m2: '', h: '', c: '' };

export default function SimuladorPostulacionScreen() {
  const [puntajes, setPuntajes] = useState<Puntajes>(VACIO);
  const [filtroEstado, setFiltroEstado] = useState<Estado | 'todos'>('todos');
  const [filtroArea, setFiltroArea] = useState<string>('');
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Al abrir desde "Cálculos guardados": llena los campos y muestra el resultado
  useRestaurarEntrada<{ puntajes: Puntajes; filtroEstado: Estado | 'todos'; filtroArea: string }>((d) => { setPuntajes(d.puntajes); setFiltroEstado(d.filtroEstado); setFiltroArea(d.filtroArea); setCalculado(true); });

  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
  }, [puntajes]);

  const valores = useMemo(() => {
    const v = {} as Record<Clave, number>;
    for (const { clave } of CAMPOS) v[clave] = leerNumero(puntajes[clave]);
    return v;
  }, [puntajes]);

  const errorDe = (clave: Clave) => {
    const t = puntajes[clave];
    const n = valores[clave];
    return t.trim() !== '' && !(n >= 150 && n <= 1000) ? 'Entre 150 y 1000' : null;
  };
  const hayError = CAMPOS.some(({ clave }) => errorDe(clave));
  const obligatoriosOk = CAMPOS.filter((c) => c.obligatorio).every(({ clave }) => Number.isFinite(valores[clave]));

  const resultados = useMemo((): Resultado[] | null => {
    if (!obligatoriosOk || hayError) return null;
    const val = (k: Clave) => (Number.isFinite(valores[k]) ? valores[k] : 0);

    return CARRERAS.map((carrera, id) => {
      const pruebas: { k: Clave; pond: number }[] = [
        { k: 'nem', pond: carrera.nem },
        { k: 'm1', pond: carrera.m1 },
        { k: 'm2', pond: carrera.m2 },
        { k: 'l', pond: carrera.l },
        { k: 'h', pond: carrera.h },
        { k: 'c', pond: carrera.c },
      ];
      // Igual que la web: si falta una prueba electiva, se re-escala sobre las ponderaciones cubiertas
      const cubiertas = pruebas.filter((p) => val(p.k) > 0 && p.pond > 0);
      const pondCubierta = cubiertas.reduce((s, p) => s + p.pond, 0);
      const bruto = cubiertas.reduce((s, p) => s + (val(p.k) * p.pond) / 100, 0);
      const puntaje = pondCubierta > 0 ? Math.round(bruto * (100 / pondCubierta)) : 0;
      const diff = puntaje - carrera.corte;
      const estado: Estado = diff >= 0 ? 'alcanza' : diff >= -30 ? 'cerca' : 'no_alcanza';
      const faltan = pruebas.filter((p) => p.pond > 0 && val(p.k) === 0).map((p) => NOMBRE_CORTO[p.k]);
      return { ...carrera, id, puntaje, diff, estado, faltan };
    }).sort((a, b) => b.diff - a.diff);
  }, [valores, obligatoriosOk, hayError]);

  const conteos = useMemo(() => {
    const c = { alcanza: 0, cerca: 0, no_alcanza: 0 };
    resultados?.forEach((r) => c[r.estado]++);
    return c;
  }, [resultados]);

  const mejor = useMemo(() => {
    const ok = resultados?.filter((r) => r.estado === 'alcanza') ?? [];
    return ok.length ? ok.reduce((b, r) => (r.corte > b.corte ? r : b)) : null;
  }, [resultados]);

  const areas = useMemo(() => [...new Set(CARRERAS.map((c) => c.area))], []);

  const filtrados = (resultados ?? []).filter(
    (r) => (filtroEstado === 'todos' || r.estado === filtroEstado) && (!filtroArea || r.area === filtroArea)
  );

  const actualizar = (clave: Clave, t: string) => setPuntajes((prev) => ({ ...prev, [clave]: t }));

  const cargarEjemplo = () => {
    setPuntajes({ nem: '780', m1: '720', l: '690', m2: '', h: '', c: '650' });
    setCalculado(false);
  };

  const limpiar = () => {
    setPuntajes(VACIO);
    setCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const calcular = () => {
    setFiltroEstado('todos');
    setFiltroArea('');
    setCalculado(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(resultadoY.current - Spacing.three, 0), animated: true });
    }, 80);
  };

  const guardar = async () => {
    if (!resultados) return;
    await guardarEnHistorial({
      calculadoraId: CALC_ID,
      resultado: `${conteos.alcanza}/${resultados.length}`,
      resumen: mejor ? `Carreras al alcance · mejor: ${mejor.carrera} ${mejor.univ}` : 'Carreras al alcance',
      datos: { puntajes, filtroEstado, filtroArea },
    });
    setGuardado(true);
  };

  const mostrarResultado = calculado && resultados !== null;

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
            Ingresa tus puntajes y descubre a qué carreras te alcanza, comparando tu puntaje ponderado
            con el corte del último proceso de admisión.
          </AvisoInfo>

          <Seccion
            titulo="Tus puntajes"
            accion={<BotonPildora label="Ejemplo" icono="school-outline" onPress={cargarEjemplo} />}>
            <View style={styles.grilla}>
              {CAMPOS.map(({ clave, label, obligatorio }) => (
                <View key={clave} style={styles.celda}>
                  <CampoNumero
                    label={obligatorio ? label : `${label} (opc.)`}
                    value={puntajes[clave]}
                    onChangeText={(t) => actualizar(clave, t)}
                    placeholder="—"
                    error={errorDe(clave)}
                    maxLength={4}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.ayuda, { color: colors.textMuted }]}>
              NEM, M1 y Lectora son obligatorios. ¿No sabes tu NEM? Calcúlalo en «NEM y Puntaje PAES».
            </Text>
          </Seccion>

          <BotonPrimario
            label="Ver mis carreras"
            icono="school-outline"
            onPress={calcular}
            deshabilitado={resultados === null}
          />

          {mostrarResultado && resultados && (
            <>
              <TarjetaResultado
                titulo="Carreras a tu alcance"
                valor={`${conteos.alcanza} de ${resultados.length}`}
                tono={conteos.alcanza > 0 ? 'ok' : conteos.cerca > 0 ? 'warning' : 'error'}
                badge={`${conteos.cerca} cerca`}
                descripcion={
                  mejor
                    ? `Tu opción más exigente: ${mejor.carrera} · ${mejor.univ} (corte ${mejor.corte})`
                    : 'Ninguna carrera de la lista sobre el corte. Revisa las que están cerca.'
                }
                onLayout={(e) => {
                  resultadoY.current = e.nativeEvent.layout.y;
                }}
              />

              {/* Filtros */}
              <View style={styles.filtros}>
                {(['todos', 'alcanza', 'cerca', 'no_alcanza'] as const).map((e) => (
                  <Chip
                    key={e}
                    texto={
                      e === 'todos'
                        ? `Todas (${resultados.length})`
                        : `${ESTADO[e].texto} (${conteos[e]})`
                    }
                    activo={filtroEstado === e}
                    onPress={() => setFiltroEstado(e)}
                  />
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosArea}>
                <Chip texto="Todas las áreas" activo={filtroArea === ''} onPress={() => setFiltroArea('')} />
                {areas.map((a) => (
                  <Chip key={a} texto={a} activo={filtroArea === a} onPress={() => setFiltroArea(a)} />
                ))}
              </ScrollView>

              {/* Lista */}
              <View style={styles.lista}>
                {filtrados.length === 0 ? (
                  <Text style={[styles.vacio, { color: colors.textMuted }]}>No hay carreras con estos filtros.</Text>
                ) : (
                  filtrados.map((r) => <TarjetaCarrera key={r.id} r={r} />)
                )}
              </View>
            </>
          )}

          <ExplicacionPlegable
            titulo="¿Cómo se calcula?"
            texto="Cada carrera multiplica tus puntajes por sus porcentajes de ponderación y los suma. Si no ingresaste una prueba electiva que la carrera pide, se estima reescalando con las demás. «Cerca» significa a 30 puntos o menos del corte."
            formula="Ponderado = Σ (Puntaje × Ponderación%)"
            tip="Los cortes cambian cada año y aquí se usa el NEM como NEM + Ranking juntos. Úsalo como orientación y confirma ponderaciones y vacantes en la oferta oficial del DEMRE."
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

function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: activo ? Acento.base : 'rgba(99,102,241,0.08)',
          borderColor: activo ? Acento.base : 'rgba(129,140,248,0.25)',
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <Text style={[styles.chipTexto, { color: activo ? '#ffffff' : Acento.claro }]}>{texto}</Text>
    </Pressable>
  );
}

function TarjetaCarrera({ r }: { r: Resultado }) {
  const t = TONOS[ESTADO[r.estado].tono];
  // Barra: tu puntaje vs. corte en escala 400–1000
  const pos = (v: number) => `${Math.min(Math.max(((v - 400) / 600) * 100, 0), 100)}%` as const;

  return (
    <View style={[styles.carrera, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.carreraTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.carreraNombre, { color: colors.text }]}>{r.carrera}</Text>
          <Text style={[styles.carreraUniv, { color: colors.textMuted }]}>
            {r.univ} · {r.area}
          </Text>
        </View>
        <View style={[styles.estado, { backgroundColor: t.bg, borderColor: t.borde }]}>
          <Text style={[styles.estadoTexto, { color: t.texto }]}>
            {r.diff >= 0 ? `+${r.diff}` : r.diff}
          </Text>
        </View>
      </View>

      <View style={[styles.barraFondo, { backgroundColor: colors.backgroundElement }]}>
        <View style={[styles.barraRelleno, { width: pos(r.puntaje), backgroundColor: t.texto }]} />
        <View style={[styles.marcaCorte, { left: pos(r.corte), backgroundColor: colors.text }]} />
      </View>

      <View style={styles.carreraPie}>
        <Text style={[styles.carreraDato, { color: colors.textSecondary }]}>
          Tu ponderado <Text style={{ color: colors.text, fontWeight: '800' }}>{r.puntaje}</Text>
        </Text>
        <Text style={[styles.carreraDato, { color: colors.textSecondary }]}>
          Corte <Text style={{ color: colors.text, fontWeight: '800' }}>{r.corte}</Text>
        </Text>
      </View>
      {r.faltan.length > 0 && (
        <Text style={[styles.faltan, { color: colors.warning }]}>
          Estimado sin {r.faltan.join(', ')}
        </Text>
      )}
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
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  celda: {
    width: '47%',
    flexGrow: 1,
  },
  ayuda: {
    fontSize: 12,
    lineHeight: 17,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtrosArea: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  lista: {
    gap: 10,
  },
  vacio: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
    fontSize: 13,
  },
  carrera: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  carreraTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  carreraNombre: {
    fontSize: 15,
    fontWeight: '700',
  },
  carreraUniv: {
    fontSize: 12,
    marginTop: 2,
  },
  estado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  estadoTexto: {
    fontSize: 13,
    fontWeight: '800',
  },
  barraFondo: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: 999,
  },
  marcaCorte: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  carreraPie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  carreraDato: {
    fontSize: 12,
  },
  faltan: {
    fontSize: 11,
    fontWeight: '600',
  },
});
