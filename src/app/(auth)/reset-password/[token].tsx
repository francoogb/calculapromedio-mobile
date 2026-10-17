import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonEnviar, CampoTexto, ErrorGeneral, EstadoCuenta } from '@/components/cuenta/campos';
import { FondoDecorativo } from '@/components/cuenta/fondo';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { ApiError, apiFetch, type ErroresValidacion } from '@/lib/api';

const colors = Colors.dark;

const MINIMO_CARACTERES = 8;

/**
 * Pantalla de contraseña nueva. Es el destino del enlace del correo de recuperación
 * (/reset-password/{token}?email=...): la ruta coincide con la de la web para que, en
 * Android con la app instalada, el mismo enlace abra esta pantalla.
 */
export default function NuevaContrasenaScreen() {
  const insets = useSafeAreaInsets();
  const { token, email } = useLocalSearchParams<{ token?: string; email?: string }>();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  /** El servidor dijo que el enlace no sirve (vencido, ya usado o incorrecto). */
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);

  const pedirEnlaceNuevo = () => router.replace('/recuperar');

  async function enviar() {
    if (cargando) return;
    setErrores({});
    setErrorGeneral(null);

    if (password.length < MINIMO_CARACTERES) {
      setErrores({ password: [`La contraseña debe tener al menos ${MINIMO_CARACTERES} caracteres`] });
      return;
    }
    if (password !== confirmacion) {
      setErrores({ password_confirmation: ['Las contraseñas no coinciden'] });
      return;
    }

    setCargando(true);
    try {
      await apiFetch('/reset-password', {
        method: 'POST',
        auth: false,
        body: { email, token, password, password_confirmation: confirmacion },
      });
      setListo(true);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.errorDe('token')) {
          setEnlaceInvalido(true);
        } else if (Object.keys(e.errores).length > 0) {
          setErrores(e.errores);
        } else {
          setErrorGeneral(e.message);
        }
      } else {
        setErrorGeneral('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  let contenido;
  if (listo) {
    contenido = (
      <EstadoCuenta
        titulo="Contraseña actualizada"
        texto="Ya puedes iniciar sesión con tu contraseña nueva."
        etiquetaBoton="Iniciar sesión"
        onBoton={() => router.replace('/login')}
      />
    );
  } else if (!token || !email) {
    // Faltan datos en la dirección: el servidor ni se consulta
    contenido = (
      <EstadoCuenta
        titulo="Enlace incompleto"
        texto="A este enlace le faltan datos. Vuelve a abrirlo desde el correo, completo, o pide uno nuevo."
        etiquetaBoton="Pedir un enlace nuevo"
        onBoton={pedirEnlaceNuevo}
      />
    );
  } else if (enlaceInvalido) {
    // El servidor lo rechazó: vencido, ya usado o incorrecto
    contenido = (
      <EstadoCuenta
        titulo="Enlace no válido"
        texto="Este enlace venció o ya se usó. Pide uno nuevo para cambiar tu contraseña."
        etiquetaBoton="Pedir un enlace nuevo"
        onBoton={pedirEnlaceNuevo}
      />
    );
  } else {
    contenido = (
      <>
        <Text style={styles.titulo}>Crea tu nueva contraseña</Text>
        <Text style={styles.subtitulo}>
          Para <Text style={styles.correo}>{email}</Text>. Elige una contraseña de al menos {MINIMO_CARACTERES}{' '}
          caracteres.
        </Text>

        <View style={styles.formulario}>
          <CampoTexto
            label="Nueva contraseña"
            icono="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            autoComplete="password"
            autoFocus
            error={errores.password?.[0]}
          />
          <CampoTexto
            label="Confirmar contraseña"
            icono="lock-closed-outline"
            value={confirmacion}
            onChangeText={setConfirmacion}
            placeholder="Repite tu contraseña"
            secureTextEntry
            autoComplete="password"
            error={errores.password_confirmation?.[0]}
            onSubmitEditing={enviar}
          />

          {errorGeneral && <ErrorGeneral mensaje={errorGeneral} />}

          <BotonEnviar label="Guardar contraseña" onPress={enviar} cargando={cargando} />
        </View>
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FondoDecorativo />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado, { paddingTop: insets.top + Spacing.six }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {contenido}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  correo: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formulario: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
});
