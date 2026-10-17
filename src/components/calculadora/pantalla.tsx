import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { HeaderCalculadora } from '@/components/calculadora/header-calculadora';
import { BarraAcciones } from '@/components/calculadora/piezas';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { guardarEnHistorial } from '@/lib/storage';

const colors = Colors.dark;

/**
 * Estado común de una calculadora: revelar resultado, scroll hasta él y guardar en historial.
 * `dependencias`: valores de entrada; si cambian, el botón "Guardado" vuelve a "Guardar".
 */
export function usePantallaCalculo(calculadoraId: string, dependencias: unknown[]) {
  const [calculado, setCalculado] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const resultadoY = useRef(0);

  useEffect(() => {
    setGuardado(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  const calcular = () => {
    setCalculado(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(resultadoY.current - Spacing.three, 0), animated: true });
    }, 80);
  };

  /** Oculta el resultado y vuelve arriba (para Limpiar). */
  const reiniciar = () => {
    setCalculado(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onLayoutResultado = (e: LayoutChangeEvent) => {
    resultadoY.current = e.nativeEvent.layout.y;
  };

  /** `datos`: lo que escribió el usuario (JSON), para reabrir el cálculo con los campos llenos. */
  const guardar = async (resultado: string, resumen: string, datos?: unknown) => {
    await guardarEnHistorial({ calculadoraId, resultado, resumen, datos });
    setGuardado(true);
  };

  return { calculado, setCalculado, guardado, scrollRef, calcular, reiniciar, onLayoutResultado, guardar };
}

/** Estructura estándar: header, contenido con scroll y barra Limpiar / Guardar. */
export function PantallaCalculadora({
  calculadoraId,
  scrollRef,
  onLimpiar,
  onGuardar,
  puedeGuardar,
  guardado,
  children,
}: {
  calculadoraId: string;
  scrollRef: RefObject<ScrollView | null>;
  onLimpiar: () => void;
  onGuardar: () => void;
  puedeGuardar: boolean;
  guardado: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderCalculadora calculadoraId={calculadoraId} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, ContenidoCentrado]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <BarraAcciones
          onLimpiar={onLimpiar}
          onGuardar={onGuardar}
          guardarDeshabilitado={!puedeGuardar}
          guardado={guardado}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

/** Fila de N campos del mismo ancho. */
export function FilaCampos({ children }: { children: ReactNode }) {
  return <View style={styles.fila}>{children}</View>;
}

export function Columna({ children }: { children: ReactNode }) {
  return <View style={styles.col}>{children}</View>;
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
  fila: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
});
