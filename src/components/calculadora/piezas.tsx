import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Acento, Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

// ── Aviso informativo (azul) ─────────────────────────────────

export function AvisoInfo({ children }: { children: ReactNode }) {
  return (
    <View style={[styles.aviso, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}>
      <Ionicons name="information-circle-outline" size={24} color={colors.info} />
      <Text style={[styles.avisoTexto, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

// ── Tarjeta contenedora con título y acción opcional ─────────

export function Seccion({
  titulo,
  accion,
  children,
}: {
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={[styles.seccion, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.seccionHeader}>
        <Text style={[styles.seccionTitulo, { color: colors.text }]}>{titulo}</Text>
        {accion}
      </View>
      {children}
    </View>
  );
}

/** Píldora secundaria para la esquina de una Seccion (ej. "Ejemplo"). */
export function BotonPildora({
  label,
  icono,
  onPress,
}: {
  label: string;
  icono: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pildora,
        { borderColor: 'rgba(129,140,248,0.35)', opacity: pressed ? 0.75 : 1 },
      ]}>
      <Ionicons name={icono} size={16} color="#a5b4fc" />
      <Text style={styles.pildoraTexto}>{label}</Text>
    </Pressable>
  );
}

/** Botón punteado de "Agregar ..." dentro de una Seccion. */
export function BotonAgregar({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.agregar,
        { borderColor: 'rgba(129,140,248,0.35)', opacity: pressed ? 0.8 : 1 },
      ]}>
      <Ionicons name="add-circle" size={22} color="#818cf8" />
      <Text style={styles.agregarTexto}>{label}</Text>
    </Pressable>
  );
}

// ── Botón principal con gradiente indigo ─────────────────────

export function BotonPrimario({
  label,
  icono,
  onPress,
  deshabilitado = false,
}: {
  label: string;
  icono: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.primarioWrap,
        { opacity: deshabilitado ? 0.45 : pressed ? 0.9 : 1 },
      ]}>
      <LinearGradient
        colors={[Acento.base, '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primario}>
        <Ionicons name={icono} size={24} color="#ffffff" />
        <Text style={styles.primarioTexto}>{label}</Text>
        <Ionicons name="chevron-forward" size={22} color="#ffffff" style={styles.primarioChevron} />
      </LinearGradient>
    </Pressable>
  );
}

// ── Explicación plegable (fórmula + tip) ─────────────────────

export function ExplicacionPlegable({
  titulo,
  formula,
  texto,
  tip,
}: {
  titulo: string;
  formula: string;
  texto?: string;
  tip?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <View style={[styles.seccion, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={() => setAbierto((v) => !v)} style={styles.plegableHeader}>
        <Ionicons name="help-circle" size={18} color={colors.accentTip} />
        <Text style={[styles.plegableTitulo, { color: colors.text }]}>{titulo}</Text>
        <Ionicons
          name={abierto ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>

      {abierto && (
        <View style={styles.plegableContenido}>
          {texto && (
            <Text style={[styles.plegableTexto, { color: colors.textSecondary }]}>{texto}</Text>
          )}
          <View
            style={[
              styles.formula,
              { backgroundColor: colors.backgroundElement, borderColor: colors.border },
            ]}>
            <Text style={[styles.formulaLabel, { color: colors.textMuted }]}>FÓRMULA</Text>
            <Text style={[styles.formulaTexto, { color: colors.text }]}>{formula}</Text>
          </View>
          {tip && (
            <View
              style={[
                styles.tip,
                { backgroundColor: colors.accentTipBg, borderColor: colors.accentTip },
              ]}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={16} color={colors.accentTip} />
                <Text style={[styles.tipTitulo, { color: colors.accentTip }]}>Tip PAES</Text>
              </View>
              <Text style={[styles.plegableTexto, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Barra inferior fija: Limpiar / Guardar ───────────────────

export function BarraAcciones({
  onLimpiar,
  onGuardar,
  guardarDeshabilitado,
  guardado,
}: {
  onLimpiar: () => void;
  onGuardar: () => void;
  guardarDeshabilitado: boolean;
  guardado: boolean;
}) {
  // El tab bar ya reserva el safe area inferior, por eso no se suma insets.bottom
  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: colors.background, borderTopColor: colors.border },
      ]}>
      <Pressable
        onPress={onLimpiar}
        style={({ pressed }) => [styles.barraBoton, styles.barraSecundario, { opacity: pressed ? 0.8 : 1 }]}>
        <Ionicons name="refresh" size={20} color="#a5b4fc" />
        <Text style={[styles.barraTexto, { color: Acento.claro }]}>Limpiar</Text>
      </Pressable>

      <Pressable
        onPress={onGuardar}
        disabled={guardarDeshabilitado || guardado}
        style={({ pressed }) => [
          styles.barraBoton,
          {
            backgroundColor: guardado ? colors.resultadoBg : Acento.base,
            borderColor: guardado ? colors.resultadoBorder : Acento.base,
            opacity: guardarDeshabilitado ? 0.45 : pressed ? 0.85 : 1,
          },
        ]}>
        <Ionicons
          name={guardado ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={guardado ? colors.resultado : '#ffffff'}
        />
        <Text style={[styles.barraTexto, { color: guardado ? colors.resultado : '#ffffff' }]}>
          {guardado ? 'Guardado' : 'Guardar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  seccion: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 14,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  seccionTitulo: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  pildoraTexto: {
    color: Acento.claro,
    fontSize: 14,
    fontWeight: '700',
  },
  agregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  agregarTexto: {
    color: Acento.medio,
    fontSize: 15,
    fontWeight: '700',
  },
  primarioWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Acento.base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 62,
    paddingHorizontal: Spacing.four,
  },
  primarioTexto: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  primarioChevron: {
    position: 'absolute',
    right: 20,
  },
  plegableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plegableTitulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  plegableContenido: {
    gap: Spacing.three,
  },
  plegableTexto: {
    fontSize: 13,
    lineHeight: 19,
  },
  formula: {
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  formulaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formulaTexto: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tip: {
    padding: Spacing.three,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipTitulo: {
    fontSize: 12,
    fontWeight: '700',
  },
  barra: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  barraBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  barraSecundario: {
    borderColor: 'rgba(129,140,248,0.45)',
  },
  barraTexto: {
    fontSize: 16,
    fontWeight: '700',
  },
});
