import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotonEnviar, CabeceraCuenta, CampoTexto, ErrorGeneral } from '@/components/cuenta/campos';
import { Colors, ContenidoCentrado, Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion';
import { ApiError, type ErroresValidacion } from '@/lib/api';
import { esCorreoValido, sugerirCorreo } from '@/lib/validacion';

const colors = Colors.dark;

export default function RegistroScreen() {
  const { crearCuenta } = useSesion();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
      await crearCuenta({
        nombre: nombre.trim(),
        email: correo,
        password,
        password_confirmation: passwordConfirm,
      });
      router.dismissAll();
      router.replace('/');
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
      <CabeceraCuenta titulo="Crear cuenta" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, ContenidoCentrado]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.titulo}>Crea tu cuenta gratis</Text>
          <Text style={styles.subtitulo}>
            Es la misma cuenta que usas en calculapromedio.cl. Recibes 5 días de premium de regalo.
          </Text>

          <View style={styles.formulario}>
            <CampoTexto
              label="Nombre"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              autoComplete="name"
              autoFocus
              error={errores.nombre?.[0]}
            />
            <CampoTexto
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tucorreo@ejemplo.cl"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errores.email?.[0]}
            />
            <CampoTexto
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoComplete="password"
              error={errores.password?.[0]}
            />
            <CampoTexto
              label="Confirmar contraseña"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Repite tu contraseña"
              secureTextEntry
              autoComplete="password"
              error={errores.password_confirmation?.[0]}
              onSubmitEditing={enviar}
            />

            {errorGeneral && <ErrorGeneral mensaje={errorGeneral} />}

            <BotonEnviar label="Crear cuenta" onPress={enviar} cargando={cargando} />
          </View>

          <Pressable onPress={() => router.push('/login')} hitSlop={8} style={styles.conCuenta}>
            <Text style={styles.conCuentaTexto}>
              ¿Ya tienes cuenta? <Text style={styles.conCuentaStrong}>Iniciar sesión</Text>
            </Text>
          </Pressable>

          <Pressable onPress={() => router.dismissAll()} hitSlop={8} style={styles.sinCuenta}>
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
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  titulo: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  formulario: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  conCuenta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  conCuentaTexto: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  conCuentaStrong: {
    color: '#a78bfa',
    fontWeight: '700',
  },
  sinCuenta: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  sinCuentaTexto: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '600',
  },
});
