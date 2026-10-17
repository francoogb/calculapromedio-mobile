import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotonEnviar, CampoTexto, EnlaceAlternativo, ErrorGeneral } from '@/components/cuenta/campos';
import { FondoDecorativo } from '@/components/cuenta/fondo';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError, type ErroresValidacion } from '@/lib/api';
import { entrarAlInicio, salirDePantallasDeCuenta } from '@/lib/navegacion';
import { esCorreoValido, sugerirCorreo } from '@/lib/validacion';

const colors = Colors.dark;

export default function LoginScreen() {
  const { iniciarSesion } = useSesion();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<ErroresValidacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  /** Llama a la API con un correo ya validado. */
  async function enviarCorreo(correo: string) {
    if (cargando) return;
    setErrores({});
    setErrorGeneral(null);
    setCargando(true);
    try {
      await iniciarSesion({ email: correo, password });
      entrarAlInicio();
    } catch (e) {
      if (e instanceof ApiError) {
        if (Object.keys(e.errores).length > 0) {
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

  async function enviar() {
    if (cargando) return;
    setErrores({});
    setErrorGeneral(null);

    const correo = email.trim();
    if (!esCorreoValido(correo)) {
      const sugerencia = sugerirCorreo(correo);
      if (sugerencia) {
        // Dominio con typo probable (p. ej. gmail.comf): ofrecer la corrección
        Alert.alert('Revisa tu correo', `¿Quisiste decir ${sugerencia}?`, [
          {
            text: `Usar ${sugerencia}`,
            onPress: () => setEmail(sugerencia),
          },
          { text: 'Continuar igual', onPress: () => enviarCorreo(correo) },
        ]);
      } else {
        // Formato malo o TLD poco común sin corrección clara: advertir, pero dejar continuar
        Alert.alert(
          'Revisa tu correo',
          'La dirección de correo no parece válida (el dominio no es de uso común). ¿Está bien escrito?',
          [
            { text: 'Volver a revisar', style: 'cancel' },
            { text: 'Está bien, continuar', onPress: () => enviarCorreo(correo) },
          ]
        );
      }
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
          contentContainerStyle={[styles.scroll, ContenidoCentrado, { paddingTop: insets.top + Spacing.five }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.titulo}>Iniciar sesión</Text>
          <Text style={styles.subtitulo}>Accede a tus ejercicios, progreso{'\n'}y más recursos de estudio.</Text>

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
              error={errores.email?.[0]}
              onSubmitEditing={enviar}
            />
            <CampoTexto
              label="Contraseña"
              icono="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
              error={errores.password?.[0]}
              onSubmitEditing={enviar}
            />

            <Pressable onPress={() => router.push('/recuperar')} hitSlop={8} style={styles.olvido}>
              <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            {errorGeneral && <ErrorGeneral mensaje={errorGeneral} />}

            <BotonEnviar label="Iniciar sesión" onPress={enviar} cargando={cargando} />
          </View>

          <EnlaceAlternativo
            pregunta="¿No tienes una cuenta?"
            accion="Crear cuenta"
            onPress={() => router.push('/registro')}
          />

          <Pressable onPress={salirDePantallasDeCuenta} hitSlop={8} style={styles.sinCuenta}>
            <Text style={styles.sinCuentaTexto}>Continuar sin cuenta</Text>
          </Pressable>
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
  formulario: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  olvido: {
    alignSelf: 'flex-end',
  },
  enlace: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  sinCuenta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  sinCuentaTexto: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
