import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

export type Tono = 'ok' | 'info' | 'warning' | 'error';

/** Paleta por tono para resultado, badge y barras. */
export const TONOS: Record<Tono, { texto: string; bg: string; borde: string }> = {
  ok: { texto: colors.resultado, bg: colors.resultadoBg, borde: colors.resultadoBorder },
  info: { texto: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', borde: 'rgba(129,140,248,0.35)' },
  warning: { texto: '#fbbf24', bg: 'rgba(251,191,36,0.10)', borde: 'rgba(251,191,36,0.35)' },
  error: { texto: '#f87171', bg: 'rgba(239,68,68,0.12)', borde: 'rgba(239,68,68,0.35)' },
};

const ICONO_TONO: Record<Tono, keyof typeof Ionicons.glyphMap> = {
  ok: 'checkmark-circle',
  info: 'information-circle',
  warning: 'alert-circle',
  error: 'close-circle',
};

// ── Tarjeta de resultado: título + badge + valor grande + contenido ──

export function TarjetaResultado({
  titulo,
  valor,
  tono,
  badge,
  descripcion,
  onLayout,
  children,
}: {
  titulo: string;
  valor: string;
  tono: Tono;
  badge: string;
  descripcion?: string;
  onLayout?: (e: LayoutChangeEvent) => void;
  children?: ReactNode;
}) {
  const t = TONOS[tono];
  // Textos largos ("Imposible", "¡Meta alcanzada!") van más chicos que un número
  const esTexto = /[a-zA-Z¡]/.test(valor);

  return (
    <View
      onLayout={onLayout}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: colors.text }]}>{titulo}</Text>
        <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.borde }]}>
          <Ionicons name={ICONO_TONO[tono]} size={16} color={t.texto} />
          <Text style={[styles.badgeTexto, { color: t.texto }]}>{badge}</Text>
        </View>
      </View>

      <View style={[styles.valorBox, { backgroundColor: t.bg, borderColor: t.borde }]}>
        <Text
          style={[styles.valor, esTexto && styles.valorTexto, { color: t.texto }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {valor}
        </Text>
        {descripcion && (
          <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{descripcion}</Text>
        )}
      </View>

      {children}
    </View>
  );
}

// ── Detalle del cálculo: filas operación → valor + fila total ──

export type FilaDetalle = {
  key: string;
  label: string;
  operacion?: string;
  valor: string;
  /** Resalta la fila (ej. advertencia) */
  tono?: Tono;
};

export function DetalleCalculo({
  filas,
  total,
  tonoTotal,
}: {
  filas: FilaDetalle[];
  total: { label: string; valor: string };
  tonoTotal: Tono;
}) {
  return (
    <>
      <Text style={[styles.detalleTitulo, { color: colors.text }]}>Detalle del cálculo</Text>
      <View style={[styles.detalle, { borderColor: colors.border }]}>
        {filas.map((f, i) => (
          <View
            key={f.key}
            style={[styles.fila, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.filaLabel, { color: f.tono ? TONOS[f.tono].texto : colors.text }]}
                numberOfLines={2}>
                {f.label}
              </Text>
              {f.operacion && (
                <Text style={[styles.filaOperacion, { color: colors.textMuted }]}>{f.operacion}</Text>
              )}
            </View>
            <Text style={[styles.filaValor, { color: colors.text }]}>{f.valor}</Text>
          </View>
        ))}

        <View style={[styles.fila, styles.filaTotal, { borderTopColor: colors.border }]}>
          <Text style={styles.totalLabel}>{total.label}</Text>
          <Text style={[styles.totalValor, { color: TONOS[tonoTotal].texto }]}>{total.valor}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  valorBox: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  valor: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -1,
  },
  valorTexto: {
    fontSize: 36,
    letterSpacing: -0.5,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  detalleTitulo: {
    fontSize: 15,
    fontWeight: '800',
  },
  detalle: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  filaLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  filaOperacion: {
    fontSize: 12,
    marginTop: 1,
  },
  filaValor: {
    fontSize: 16,
    fontWeight: '700',
  },
  filaTotal: {
    borderTopWidth: 1,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  totalLabel: {
    flex: 1,
    color: '#7dd3fc',
    fontSize: 15,
    fontWeight: '700',
  },
  totalValor: {
    fontSize: 20,
    fontWeight: '800',
  },
});
