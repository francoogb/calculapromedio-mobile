import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
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

/** Campo de texto con etiqueta y mensaje de error, usado en las pantallas de cuenta. */
export function CampoTexto({
  label,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
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
    borderRadius: 14,
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
