import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonEnviar, BotonVolver, CampoTexto, ErrorGeneral, EstadoCuenta } from '@/components/cuenta/campos';
import { FondoDecorativo } from '@/components/cuenta/fondo';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { ApiError, apiFetch } from '@/lib/api';
import { sugerirCorreo, tieneFormatoDeCorreo } from '@/lib/validacion';

const colors = Colors.dark;

export default function RecuperarScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [errorCampo, setErrorCampo] = useState<string | undefined>();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  /** Correo al que se envió el enlace; si no es null se muestra la confirmación. */
  const [enviadoA, setEnviadoA] = useState<string | null>(null);

  /** Pide a la API que envíe el enlace. La contraseña nueva se escribe en la web. */
  async function enviarCorreo(correo: string) {
    if (cargando) return;
    setErrorCampo(undefined);
    setErrorGeneral(null);
    setCargando(true);
    try {
      await apiFetch('/forgot-password', { method: 'POST', auth: false, body: { email: correo } });
      setEnviadoA(correo);
    } catch (e) {
      if (e instanceof ApiError) {
        const mensajeCorreo = e.errorDe('email');
        if (mensajeCorreo) {
          setErrorCampo(mensajeCorreo);
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

  async function enviar() {
    if (cargando) return;
    setErrorCampo(undefined);
    setErrorGeneral(null);

    const correo = email.trim();
    // Solo el formato: un dominio poco común no se bloquea, la API dice si la cuenta existe
    if (!tieneFormatoDeCorreo(correo)) {
      setErrorCampo('Escribe un correo válido, por ejemplo nombre@correo.cl');
      return;
    }
    const sugerencia = sugerirCorreo(correo);
    if (sugerencia) {
      // Dominio con typo probable (p. ej. gmal.com): ofrecer la corrección, sin obligarla
      Alert.alert('Revisa tu correo', `¿Quisiste decir ${sugerencia}?`, [
        { text: `Usar ${sugerencia}`, onPress: () => setEmail(sugerencia) },
        { text: 'Continuar igual', onPress: () => enviarCorreo(correo) },
      ]);
      return;
    }
    await enviarCorreo(correo);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <FondoDecorativo />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado, { paddingTop: insets.top + Spacing.three }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BotonVolver />

          {enviadoA ? (
            <EstadoCuenta
              titulo="Revisa tu correo"
              texto={
                <>
                  Enviamos un enlace a <Text style={styles.correoEnviado}>{enviadoA}</Text>. Ábrelo para crear tu
                  contraseña nueva. Si no lo ves, revisa la carpeta de spam.
                </>
              }
              etiquetaBoton="Volver a iniciar sesión"
              onBoton={() => router.back()}
              enlace={{ etiqueta: 'Usar otro correo', onPress: () => setEnviadoA(null) }}
            />
          ) : (
            <>
              <Text style={styles.titulo}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitulo}>No te preocupes, te enviaremos un enlace para recuperarla.</Text>

              <View style={styles.formulario}>
                <CampoTexto
                  label="Correo electrónico"
                  icono="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@correo.cl"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                  error={errorCampo}
                  onSubmitEditing={enviar}
                />

                {errorGeneral && <ErrorGeneral mensaje={errorGeneral} />}

                <BotonEnviar label="Enviar enlace de recuperación" onPress={enviar} cargando={cargando} />
              </View>
            </>
          )}
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
  correoEnviado: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formulario: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
});
