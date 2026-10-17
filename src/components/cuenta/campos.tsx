import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

/** Cabecera con botón volver para las pantallas de cuenta (login, registro, recuperar). */
export function CabeceraCuenta({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.cabecera, { paddingTop: insets.top + Spacing.two }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityLabel="Volver"
        style={({ pressed }) => [styles.cabeceraBtn, { opacity: pressed ? 0.6 : 1 }]}>
        <Ionicons name="chevron-back" size={24} color="#ffffff" />
      </Pressable>
      <Text style={styles.cabeceraTitulo}>{titulo}</Text>
      <View style={styles.cabeceraBtn} />
    </View>
  );
}

/** Flecha para volver, sin barra de título (pantallas de cuenta con título grande propio). */
export function BotonVolver() {
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityLabel="Volver"
      style={({ pressed }) => [styles.botonVolver, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name="arrow-back" size={26} color="#ffffff" />
    </Pressable>
  );
}

/** Estado final de una pantalla de cuenta: ícono, título, texto, botón principal y un enlace opcional. */
export function EstadoCuenta({
  titulo,
  texto,
  etiquetaBoton,
  onBoton,
  enlace,
}: {
  titulo: string;
  texto: ReactNode;
  etiquetaBoton: string;
  onBoton: () => void;
  enlace?: { etiqueta: string; onPress: () => void };
}) {
  return (
    <>
      <Text style={styles.estadoTitulo}>{titulo}</Text>
      <Text style={styles.estadoTexto}>{texto}</Text>
      <Pressable
        onPress={onBoton}
        style={({ pressed }) => [styles.estadoBoton, { opacity: pressed ? 0.85 : 1 }]}>
        <Text style={styles.botonTexto}>{etiquetaBoton}</Text>
      </Pressable>
      {enlace && (
        <Pressable onPress={enlace.onPress} hitSlop={8} style={styles.estadoEnlace}>
          <Text style={styles.estadoEnlaceTexto}>{enlace.etiqueta}</Text>
        </Pressable>
      )}
    </>
  );
}

/** Línea divisoria + "¿Pregunta? Acción" (p. ej. "¿No tienes una cuenta? Crear cuenta"). */
export function EnlaceAlternativo({
  pregunta,
  accion,
  onPress,
}: {
  pregunta: string;
  accion: string;
  onPress: () => void;
}) {
  return (
    <>
      <View style={styles.divisor} />
      <View style={styles.enlaceAlternativoFila}>
        <Text style={styles.enlaceAlternativoTexto}>{pregunta}</Text>
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={styles.enlaceAlternativoAccion}>{accion}</Text>
        </Pressable>
      </View>
    </>
  );
}

/** Campo de texto con etiqueta y mensaje de error, usado en las pantallas de cuenta. */
export function CampoTexto({
  label,
  icono,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  autoFocus = false,
  onSubmitEditing,
}: {
  label: string;
  /** Ícono opcional a la izquierda del campo (p. ej. sobre, candado). */
  icono?: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  // Ojo para mostrar/ocultar la contraseña (solo campos seguros)
  const [oculto, setOculto] = useState(secureTextEntry);

  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <View>
        {icono && <Ionicons name={icono} size={20} color={colors.textMuted} style={styles.iconoCampo} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={oculto}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            icono && { paddingLeft: 46 },
            secureTextEntry && { paddingRight: 46 },
            error ? styles.inputError : null,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setOculto((v) => !v)}
            hitSlop={10}
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            style={({ pressed }) => [styles.ojoBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons
              name={oculto ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Botón principal de las pantallas de cuenta (login/registro), con estado de carga. */
export function BotonEnviar({
  label,
  onPress,
  cargando = false,
}: {
  label: string;
  onPress: () => void;
  cargando?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [styles.boton, { opacity: cargando ? 0.6 : pressed ? 0.85 : 1 }]}>
      {cargando ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <>
          <Text style={styles.botonTexto}>{label}</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </>
      )}
    </Pressable>
  );
}

/** Mensaje de error general (no asociado a un campo), p. ej. error de red o 429. */
export function ErrorGeneral({ mensaje }: { mensaje: string }) {
  return (
    <View style={styles.errorGeneral}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.errorGeneralTexto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  cabeceraBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabeceraTitulo: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  botonVolver: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  estadoTitulo: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  estadoTexto: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  estadoBoton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    marginTop: Spacing.three,
  },
  estadoEnlace: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  estadoEnlaceTexto: {
    color: '#22d3ee',
    fontSize: 15,
    fontWeight: '700',
  },
  divisor: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginTop: Spacing.two,
    marginHorizontal: Spacing.three,
  },
  enlaceAlternativoFila: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  enlaceAlternativoTexto: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  enlaceAlternativoAccion: {
    color: '#22d3ee',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  campo: {
    gap: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  input: {
    height: 50,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },
  iconoCampo: {
    position: 'absolute',
    left: 14,
    top: 15,
    zIndex: 1,
  },
  ojoBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginLeft: 2,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  botonTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
  },
  errorGeneralTexto: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
